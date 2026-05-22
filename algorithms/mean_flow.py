import torch
import torch.nn as nn
from algorithms.base import BaseAlgorithm

class MeanFlow(BaseAlgorithm):
    """
    何恺明团队提出的平均流 (Mean Flows) 一步生成算法。
    1. 核心概念：直接预测整个区间上的“平均速度” u，而不是“瞬时速度” v。
       由此可实现高品质的一步 (1-NFE) 数据生成。
    2. 训练目标：满足 MeanFlow Identity 公式：
       u_tgt = v_t - (t - r) * (v_t * \partial_z u_\theta + \partial_t u_\theta)
       其中对 u_tgt 应用 stopgrad，使模型避免了繁琐的二阶梯度，并获得了极佳的训练稳定性。
    3. 自适应加权：通过 powered L2 loss 自动给难易样本分配不同的学习权重。
    4. 采样过程：可进行超快 1-step sampling (z_0 = z_1 - u(z_1, 0, 1))，也支持多步积分。
    """
    def __init__(self, p=0.5, c=1e-3, num_steps=1, interval_sampling="mixed_full", full_interval_prob=0.25):
        """
        参数:
            p (float): 损失的自适应加权指数。
                       - p = 0.0: 标准平方 L2 损失。
                       - p = 0.5: 类似 Pseudo-Huber 损失（极度稳健，减少离群点波动）。
                       - p = 1.0: 论文推荐，对应 powered L2。
            c (float): 用于数值稳定的平滑小量，避免除以零。
            num_steps (int): 采样步数。默认为 1 代表一步直接生成，极快！
                             也可以传入 10~20 步进行高质量少步生成。
            interval_sampling (str): 训练时 r,t 区间的采样策略。
                                     - "uniform_t": 旧策略，先采样 t 再采样 r∈[0,t)
                                     - "uniform_interval": 均匀采样区间长度 t-r
                                     - "mixed_full": 在 uniform_interval 基础上显式混入全区间 [0,1]
            full_interval_prob (float): mixed_full 策略下强制训练 [0,1] 全区间平均速度的比例。
        """
        super().__init__()
        self.p = p
        self.c = c
        self.num_steps = num_steps
        self.interval_sampling = interval_sampling
        self.full_interval_prob = full_interval_prob

    def _sample_interval(self, batch_size: int, device: torch.device):
        eps = 1e-4
        if self.interval_sampling == "uniform_t":
            t = torch.rand(batch_size, device=device) * (1.0 - eps) + eps
            r = torch.rand(batch_size, device=device) * t
            return r, t

        # 均匀覆盖短区间与长区间，避免训练几乎只看很短的平均速度。
        delta = torch.rand(batch_size, device=device) * (1.0 - eps) + eps
        r = torch.rand(batch_size, device=device) * (1.0 - delta)
        t = r + delta

        if self.interval_sampling == "mixed_full" and self.full_interval_prob > 0:
            full_mask = torch.rand(batch_size, device=device) < self.full_interval_prob
            r = torch.where(full_mask, torch.zeros_like(r), r)
            t = torch.where(full_mask, torch.ones_like(t), t)

        return r, t

    def compute_loss(self, model: nn.Module, x_1: torch.Tensor) -> torch.Tensor:
        """
        计算 MeanFlow 的损失。
        使用 Autograd 计算全导数 d/dt u(z_t, r, t)，且对目标使用 stopgrad。
        """
        batch_size = x_1.shape[0]
        device = x_1.device
        
        # 1. 采样平均速度区间 [r, t]。MeanFlow 对区间长度极敏感，
        # 需要显式覆盖长区间和采样时使用的全区间。
        r, t = self._sample_interval(batch_size, device)
        
        # 3. 从标准正态先验中采样源噪声 e ~ N(0, I) 作为 z_1
        e = torch.randn_like(x_1)
        
        # 4. 沿轨迹进行线性插值，注意 MeanFlow 的公式是：t=0 为真实数据 x_1，t=1 为源噪声 e
        t_col = t.view(-1, 1)
        z = (1.0 - t_col) * x_1 + t_col * e
        
        # 5. 真实条件瞬时速度 v = e - x_1
        v = e - x_1
        
        # --- 准备通过 Autograd 求解 Jacobian-vector product ---
        # 启用 z 和 t_grad 的求导
        z = z.detach().requires_grad_(True)
        t_grad = t.detach().requires_grad_(True)
        
        # 拼接双时间参数并送入模型，得到当前预测的平均速度 u，形状为 [B, 2]
        time_tensor = torch.stack([r, t_grad], dim=-1)
        u = model(z, time_tensor)
        
        # 6. 计算全导数 dudt = v * \partial_z u + \partial_t u
        # 针对 2D 点的 2 个通道分别求偏导，不仅完美兼容 PyTorch，而且极度稳定
        dudt = torch.zeros_like(u)
        for i in range(2):
            grad_outputs = torch.ones_like(u[:, i])
            grads = torch.autograd.grad(
                outputs=u[:, i],
                inputs=[z, t_grad],
                grad_outputs=grad_outputs,
                retain_graph=True,
                create_graph=True
            )
            grad_z, grad_t = grads[0], grads[1]
            
            # 计算第 i 个输出的全导数并存储
            dudt[:, i] = (grad_z * v).sum(dim=-1) + grad_t
            
        # 7. 构建 stop-gradient 变分目标 u_tgt = v - (t - r) * dudt
        # 数值稳定：在训练初期随机模型的导数可能极大导致训练发散。将其裁剪到物理合理范围内，保证极强稳定性
        dudt = torch.clamp(dudt, min=-15.0, max=15.0)
        t_minus_r = (t - r).view(-1, 1)
        u_tgt = v - t_minus_r * dudt
        u_tgt = torch.clamp(u_tgt, min=-15.0, max=15.0)
        
        # 对目标应用 stop-gradient (detach)，防止二阶导数优化
        u_tgt_sg = u_tgt.detach()
        
        # 8. 计算回归误差与自适应损失权重
        error = u - u_tgt_sg
        sq_err = error ** 2
        
        if self.p > 0:
            delta_norm_sq = sq_err.sum(dim=-1, keepdim=True)
            w = 1.0 / ((delta_norm_sq + self.c) ** self.p)
            loss = torch.mean(w.detach() * sq_err)
        else:
            loss = torch.mean(sq_err)
            
        return loss

    @torch.no_grad()
    def sample(self, model: nn.Module, n_samples: int, device: torch.device) -> torch.Tensor:
        """
        采样过程。
        - 1-step sampling (默认): x_0 = e - u(e, r=0, t=1) 
        - Few-step sampling (当 num_steps > 1 时): 沿时间路径用平均速度做多步反向推演
        """
        model.eval()
        
        # 1. 采样初始白噪声 e ~ N(0, I)
        z = torch.randn(n_samples, 2, device=device)
        
        if self.num_steps == 1:
            # 极速一步生成！
            r = torch.zeros(n_samples, device=device)
            t = torch.ones(n_samples, device=device)
            time_tensor = torch.stack([r, t], dim=-1)
            
            # 预测平均速度并还原
            u = model(z, time_tensor)
            x_0 = z - u
            model.train()
            return x_0
            
        else:
            # 优美的 Few-step 多步反向推演！
            dt = 1.0 / self.num_steps
            z_t = z
            
            # 从 t_k = 1.0 倒退到 0.0，共 num_steps 步
            for k in reversed(range(self.num_steps)):
                t_val = (k + 1) * dt
                r_val = k * dt
                
                t = torch.full((n_samples,), t_val, device=device, dtype=torch.float32)
                r = torch.full((n_samples,), r_val, device=device, dtype=torch.float32)
                time_tensor = torch.stack([r, t], dim=-1)
                
                # 预测当前的平均速度 u
                u = model(z_t, time_tensor)
                
                # 根据公式更新 z_r
                z_t = z_t - dt * u
                
            model.train()
            return z_t
