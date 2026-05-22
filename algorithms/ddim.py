import torch
import torch.nn as nn
from algorithms.ddpm import DDPM

class DDIM(DDPM):
    """
    去噪扩散隐式模型 (Denoising Diffusion Implicit Models, DDIM)。
    DDIM 与 DDPM 共享完全相同的训练方式 (噪声预测损失)，但定义了一个非马尔可夫的前向过程。
    由于此特性，DDIM 具备以下巨大优势：
    1. 可以使用少得多的采样步数 (e.g. 20步) 快速生成高品质图像，而训练时依然可以使用 100/1000 步。
    2. 采样过程可以实现完全确定性 (eta = 0.0)，即给定相同的初始噪声，生成完全相同的 2D 分布，方便轨迹控制。
    """
    def __init__(self, num_steps=100, sample_steps=20, eta=0.0, beta_start=1e-4, beta_end=0.02):
        """
        参数:
            num_steps (int): 训练总时间步数 T
            sample_steps (int): 实际采样的步数 S (S <= T)
            eta (float): 控制随机性强度的参数。
                         - eta = 0.0 代表完全确定性采样（常称之为 DDIM ODE）。
                         - eta = 1.0 在采样步数 S=T 时退化为标准 DDPM。
            beta_start, beta_end: 同 DDPM 方差调度设置
        """
        super().__init__(num_steps=num_steps, beta_start=beta_start, beta_end=beta_end)
        if sample_steps < 1:
            raise ValueError("sample_steps 必须 >= 1")
        if sample_steps > num_steps:
            raise ValueError("DDIM 的 sample_steps 不能大于 num_steps")
        self.sample_steps = sample_steps
        self.eta = eta

    @torch.no_grad()
    def sample(self, model: nn.Module, n_samples: int, device: torch.device) -> torch.Tensor:
        """
        DDIM 快速采样方法。
        从训练步数 [0, T-1] 中挑选出 S 个步数，通过推导出的非马尔可夫公式，逐步确定性或随机生成 x_0。
        """
        model.eval()
        
        # 1. 在训练步数范围内，均匀挑选出 S 个采样刻度点 (e.g. T=100, S=20, steps=[0, 5, 10, ..., 95])
        # 确保 steps 存储在对应的 device 上
        if self.sample_steps == 1:
            steps = torch.tensor([self.num_steps - 1], device=device, dtype=torch.long)
        else:
            steps = torch.linspace(0, self.num_steps - 1, self.sample_steps).long().to(device)
        
        # 2. 从标准正态先验采样初始噪声 x_{\tau_{S-1}}
        x_t = torch.randn(n_samples, 2, device=device)
        
        # 3. 从倒数第一个采样刻度点开始，反向逆积分至 0
        for k in reversed(range(self.sample_steps)):
            # 当前时间步索引 t
            t_idx = steps[k]
            t = torch.full((n_samples,), t_idx, device=device, dtype=torch.long)
            t_norm = t.float() / self.num_steps
            
            # 模型预测当前噪声
            predicted_noise = model(x_t, t_norm)
            
            # 获取 \bar{\alpha}_t 并 view 成合适形状
            alpha_bar_t = self._get_coefficient(self.alpha_bar, t, x_t.shape)
            
            # 获取前一采样时刻的 \bar{\alpha}_s (若当前为最后一层 k=0，则 s 时刻直接回归到 \bar{\alpha} = 1.0 即无噪声状态)
            if k > 0:
                s_idx = steps[k - 1]
                s = torch.full((n_samples,), s_idx, device=device, dtype=torch.long)
                alpha_bar_s = self._get_coefficient(self.alpha_bar, s, x_t.shape)
            else:
                alpha_bar_s = torch.ones_like(alpha_bar_t)
                
            # 1. 估算当前生成的干净数据 \hat{x}_0 (Denoised x_0)
            pred_x_0 = (x_t - torch.sqrt(1.0 - alpha_bar_t) * predicted_noise) / torch.sqrt(alpha_bar_t)
            
            # 2. 计算控制随机性的系数 \sigma_t
            if k > 0 and self.eta > 0:
                sigma_t = self.eta * torch.sqrt((1.0 - alpha_bar_s) / (1.0 - alpha_bar_t)) * torch.sqrt(1.0 - alpha_bar_t / alpha_bar_s)
            else:
                sigma_t = torch.zeros_like(alpha_bar_t)
                
            # 3. 计算指向 x_t 的方向向量 (Direction pointing to x_t)
            # 为了数值稳定，使用 clamp 确保开根号内非负
            dir_xt_coeff = torch.clamp(1.0 - alpha_bar_s - sigma_t ** 2, min=0.0)
            dir_xt = torch.sqrt(dir_xt_coeff) * predicted_noise
            
            # 4. 根据非马尔可夫递推公式更新 x_s
            if k > 0:
                # 随机采样高斯噪声 (若 eta > 0 则会注入)
                noise = torch.randn_like(x_t)
                x_t = torch.sqrt(alpha_bar_s) * pred_x_0 + dir_xt + sigma_t * noise
            else:
                # 最后一步直接输出，不注入噪声
                x_t = torch.sqrt(alpha_bar_s) * pred_x_0 + dir_xt
                
        model.train()
        return x_t
