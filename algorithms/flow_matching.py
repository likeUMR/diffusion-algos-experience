import torch
import torch.nn as nn
from algorithms.base import BaseAlgorithm

class FlowMatching(BaseAlgorithm):
    """
    标准流匹配 (Flow Matching) / 最优传输条件流匹配 (Optimal Transport CFM)。
    时间正向：t=0.0 为纯高斯噪声，t=1.0 为真实数据分布。
    1. 前向过程 (插值): x_t = (1 - t) * x_0 + t * x_1
       其中 x_0 ~ N(0, I) 为源分布 (噪声)，x_1 ~ p_data 为目标分布 (数据)
    2. 目标速度 (向量场): u_t(x_t | x_0, x_1) = x_1 - x_0
    3. 逆向采样 (正向积分): 从 t=0.0 开始，使用常微分方程 (ODE) 欧拉法将噪声逐步积分推演至 t=1.0。
    """
    def __init__(self, num_steps=50):
        """
        参数:
            num_steps (int): 欧拉法离散积分步数，值越大积分越精准，通常 20~50 步即可获得极佳效果。
        """
        super().__init__()
        self.num_steps = num_steps

    def compute_loss(self, model: nn.Module, x_1: torch.Tensor) -> torch.Tensor:
        """
        计算最优传输条件流匹配 (OT-CFM) 的 L2/MSE 损失
        """
        batch_size = x_1.shape[0]
        device = x_1.device
        
        # 1. 在 [0, 1] 范围内均匀采样时间戳 t
        t = torch.rand(batch_size, device=device)
        t_col = t.view(-1, 1)
        
        # 2. 从标准正态先验采样源噪声 x_0
        x_0 = torch.randn_like(x_1)
        
        # 3. 构造插值轨迹上的点 x_t
        x_t = (1.0 - t_col) * x_0 + t_col * x_1
        
        # 4. 真实速度向量场即为最优传输路径的导数: u_t = x_1 - x_0
        target_velocity = x_1 - x_0
        
        # 5. 模型预测该位置的瞬时速度
        predicted_velocity = model(x_t, t)
        
        # 6. 计算速度矢量的均方误差损失 (MSE Loss)
        loss = torch.mean((predicted_velocity - target_velocity) ** 2)
        return loss

    @torch.no_grad()
    def sample(self, model: nn.Module, n_samples: int, device: torch.device) -> torch.Tensor:
        """
        通过求解常微分方程 (ODE) 生成新样本：
        从 t = 0.0 (纯噪声) 逐步向 t = 1.0 (真实数据分布) 前向积分。
        """
        model.eval()
        # 1. 采样先验纯噪声 x_0
        x_t = torch.randn(n_samples, 2, device=device)
        
        # 2. 计算积分步长
        dt = 1.0 / self.num_steps
        
        # 3. 欧拉法数值积分 (从 t=0.0 到 t=1.0)
        for step in range(self.num_steps):
            t_val = step * dt
            # 构造包含 t_val 的时间张量 [B]
            t = torch.full((n_samples,), t_val, device=device, dtype=torch.float32)
            
            # 模型预测当前位置瞬时速度 vel = dx/dt
            vel = model(x_t, t)
            
            # 前向欧拉步更新: x_{t+dt} = x_t + vel * dt
            x_t = x_t + vel * dt
            
        model.train()
        return x_t
