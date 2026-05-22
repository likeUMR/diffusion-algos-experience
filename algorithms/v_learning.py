import torch
import torch.nn as nn
from algorithms.ddim import DDIM

class VLearning(DDIM):
    r"""
    v-learning / v-prediction 扩散模型。
    1. 前向过程：与 DDIM/DDPM 共享同一组边缘加噪分布，
       x_t = \alpha_t * x_0 + \sigma_t * \epsilon
       其中 \alpha_t = sqrt(\bar{\alpha}_t), \sigma_t = sqrt(1 - \bar{\alpha}_t)
    2. 目标预测：不再预测噪声 \epsilon，而是预测速度向量 v_t
       v_t = \alpha_t * \epsilon - \sigma_t * x_0
    3. 逆向过程：由模型预测的 \hat{v}_t 还原出预测噪声 \hat{\epsilon} = \sigma_t * x_t + \alpha_t * \hat{v}_t，
       进而进行 DDIM 式确定性/半随机采样。
    """
    def __init__(self, num_steps=100, sample_steps=None, eta=0.0, beta_start=1e-4, beta_end=0.02, variance_type=None):
        """
        继承自 DDIM，共享其 linear beta variance schedule。
        variance_type 仅为兼容旧配置保留；DDIM 采样不使用该参数。
        """
        if sample_steps is None:
            sample_steps = num_steps
        super().__init__(
            num_steps=num_steps,
            sample_steps=sample_steps,
            eta=eta,
            beta_start=beta_start,
            beta_end=beta_end,
        )
        self.variance_type = variance_type

    def compute_loss(self, model: nn.Module, x_0: torch.Tensor) -> torch.Tensor:
        """
        计算 v-prediction 损失函数 (速度预测)
        """
        batch_size = x_0.shape[0]
        device = x_0.device
        
        # 1. 随机采样时间步 t \in [0, T-1]
        t = torch.randint(0, self.num_steps, (batch_size,), device=device)
        
        # 2. 采样标准高斯噪声 \epsilon
        noise = torch.randn_like(x_0)
        
        # 3. 获取前向加噪系数 \alpha_t 和 \sigma_t
        alpha_t = self._get_coefficient(self.sqrt_alpha_bar, t, x_0.shape)
        sigma_t = self._get_coefficient(self.sqrt_one_minus_alpha_bar, t, x_0.shape)
        
        # 4. 前向加噪
        x_t = alpha_t * x_0 + sigma_t * noise
        
        # 5. 计算目标速度 v_t = \alpha_t * \epsilon - \sigma_t * x_0
        target_v = alpha_t * noise - sigma_t * x_0
        
        # 6. 模型预测速度 (时间归一化至 [0, 1])
        t_norm = t.float() / self.num_steps
        predicted_v = model(x_t, t_norm)
        
        # 7. 计算 MSE 损失
        loss = torch.mean((predicted_v - target_v) ** 2)
        return loss

    @torch.no_grad()
    def sample(self, model: nn.Module, n_samples: int, device: torch.device) -> torch.Tensor:
        """
        DDIM 式逆向采样。由预测的 v_t 解出 x_0 与噪声方向后逐步去噪。
        """
        model.eval()
        # 1. 在训练步数范围内，均匀挑选出 S 个采样刻度点
        if self.sample_steps == 1:
            steps = torch.tensor([self.num_steps - 1], device=device, dtype=torch.long)
        else:
            steps = torch.linspace(0, self.num_steps - 1, self.sample_steps).long().to(device)

        # 2. 从先验分布中采样纯高斯噪声 x_{\tau_{S-1}}
        x_t = torch.randn(n_samples, 2, device=device)
        
        # 3. 从倒数第一个采样刻度点开始，反向逆积分至 0
        for k in reversed(range(self.sample_steps)):
            t_idx = steps[k]
            t = torch.full((n_samples,), t_idx, device=device, dtype=torch.long)
            t_norm = t.float() / self.num_steps
            
            # 模型预测速度 v
            predicted_v = model(x_t, t_norm)
            
            # 获取当前时间步的加噪系数 \alpha_t 和 \sigma_t
            alpha_bar_t = self._get_coefficient(self.alpha_bar, t, x_t.shape)
            alpha_t = torch.sqrt(alpha_bar_t)
            sigma_t = torch.sqrt(1.0 - alpha_bar_t)
            
            # 由 v-prediction 同时恢复干净样本与噪声方向
            pred_x_0 = alpha_t * x_t - sigma_t * predicted_v
            predicted_noise = sigma_t * x_t + alpha_t * predicted_v
            
            # 获取前一采样时刻的 \bar{\alpha}_s
            if k > 0:
                s_idx = steps[k - 1]
                s = torch.full((n_samples,), s_idx, device=device, dtype=torch.long)
                alpha_bar_s = self._get_coefficient(self.alpha_bar, s, x_t.shape)
            else:
                alpha_bar_s = torch.ones_like(alpha_bar_t)

            # DDIM 的 eta 控制是否注入采样噪声；默认 eta=0.0 为完全确定性
            if k > 0 and self.eta > 0:
                sigma_ddim = self.eta * torch.sqrt((1.0 - alpha_bar_s) / (1.0 - alpha_bar_t)) * torch.sqrt(1.0 - alpha_bar_t / alpha_bar_s)
            else:
                sigma_ddim = torch.zeros_like(alpha_bar_t)

            dir_xt_coeff = torch.clamp(1.0 - alpha_bar_s - sigma_ddim ** 2, min=0.0)
            dir_xt = torch.sqrt(dir_xt_coeff) * predicted_noise

            if k > 0:
                noise = torch.randn_like(x_t)
                x_t = torch.sqrt(alpha_bar_s) * pred_x_0 + dir_xt + sigma_ddim * noise
            else:
                x_t = pred_x_0
                
        model.train()
        return x_t
