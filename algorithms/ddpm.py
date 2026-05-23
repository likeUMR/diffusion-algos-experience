import torch
import torch.nn as nn
from algorithms.base import BaseAlgorithm

class DDPM(BaseAlgorithm):
    """
    去噪扩散概率模型 (Denoising Diffusion Probabilistic Models, DDPM)。
    1. 前向过程: 逐步向数据中注入高斯噪声，直到完全变为白噪声。
       x_t = sqrt(\bar{\alpha}_t) * x_0 + sqrt(1 - \bar{\alpha}_t) * \epsilon
    2. 逆向过程: 训练网络预测注入的噪声，然后使用马尔可夫链逐步还原数据。
    """
    def __init__(self, num_steps=100, beta_start=1e-4, beta_end=0.02, variance_type="fixed_geometric"):
        """
        参数:
            num_steps (int): 扩散的总时间步数 T
            beta_start (float): 初始 beta 值
            beta_end (float): 最终 beta 值
            variance_type (str): 采样时的方差选择，"fixed_large" 为 \sigma_t^2 = \beta_t,
                                "fixed_small" 为 \sigma_t^2 = \tilde{\beta}_t (后验方差)，
                                "fixed_geometric" 为两者方差的几何平均
        """
        super().__init__()
        self.num_steps = num_steps
        self.variance_type = variance_type
        
        # 1. 定义方差调度 (Linear Beta Schedule)
        self.beta = torch.linspace(beta_start, beta_end, num_steps)
        self.alpha = 1.0 - self.beta
        self.alpha_bar = torch.cumprod(self.alpha, dim=0)
        self.alpha_bar_prev = torch.cat([torch.tensor([1.0]), self.alpha_bar[:-1]])
        
        # 2. 前向加噪过程的相关系数
        self.sqrt_alpha_bar = torch.sqrt(self.alpha_bar)
        self.sqrt_one_minus_alpha_bar = torch.sqrt(1.0 - self.alpha_bar)
        
        # 3. 逆向采样还原过程的相关系数
        self.sqrt_recip_alpha = torch.sqrt(1.0 / self.alpha)
        # 后验方差: \tilde{\beta}_t = \frac{1 - \bar{\alpha}_{t-1}}{1 - \bar{\alpha}_t} \beta_t
        self.posterior_variance = self.beta * (1.0 - self.alpha_bar_prev) / (1.0 - self.alpha_bar)

    def _get_coefficient(self, tensor: torch.Tensor, t: torch.Tensor, x_shape: torch.Size) -> torch.Tensor:
        """
        获取指定步数 t 的系数，并 view 成与数据维度匹配的形状，以便广播计算。
        """
        tensor = tensor.to(t.device)
        out = tensor.gather(-1, t)
        return out.view(-1, *([1] * (len(x_shape) - 1)))

    def compute_loss(self, model: nn.Module, x_0: torch.Tensor) -> torch.Tensor:
        """
        计算 DDPM 的 MSE 损失函数 (噪声预测)
        """
        batch_size = x_0.shape[0]
        device = x_0.device
        
        # 1. 随机采样时间步 t \in [0, T-1]
        t = torch.randint(0, self.num_steps, (batch_size,), device=device)
        
        # 2. 采样标准高斯噪声 \epsilon
        noise = torch.randn_like(x_0)
        
        # 3. 计算加噪后的 x_t
        sqrt_alpha_bar_t = self._get_coefficient(self.sqrt_alpha_bar, t, x_0.shape)
        sqrt_one_minus_alpha_bar_t = self._get_coefficient(self.sqrt_one_minus_alpha_bar, t, x_0.shape)
        x_t = sqrt_alpha_bar_t * x_0 + sqrt_one_minus_alpha_bar_t * noise
        
        # 4. 模型预测噪声 (时间 t 归一化至 [0, 1] 以便 TimeEmbedding 内部放大至合适的周期频率)
        t_norm = t.float() / self.num_steps
        predicted_noise = model(x_t, t_norm)
        
        # 5. 计算 MSE 损失
        loss = torch.mean((predicted_noise - noise) ** 2)
        return loss

    @torch.no_grad()
    def sample(self, model: nn.Module, n_samples: int, device: torch.device) -> torch.Tensor:
        """
        实现标准 DDPM 的逆向马尔可夫采样过程。
        从 x_T ~ N(0, I) 逐步去噪到 x_0。
        """
        model.eval()
        # 1. 从先验分布中采样纯高斯噪声 x_T
        x_t = torch.randn(n_samples, 2, device=device)
        
        # 2. 从 t = T-1 逐步倒推至 0
        for step in reversed(range(self.num_steps)):
            # 构造包含 step 的时间张量 [B]
            t = torch.full((n_samples,), step, device=device, dtype=torch.long)
            t_norm = t.float() / self.num_steps
            
            # 模型预测注入的噪声
            predicted_noise = model(x_t, t_norm)
            
            # 提取当前步数相关的计算系数
            sqrt_recip_alpha_t = self._get_coefficient(self.sqrt_recip_alpha, t, x_t.shape)
            beta_t = self._get_coefficient(self.beta, t, x_t.shape)
            sqrt_one_minus_alpha_bar_t = self._get_coefficient(self.sqrt_one_minus_alpha_bar, t, x_t.shape)
            
            # 计算重构得到的去噪均值 \mu_t
            mean = sqrt_recip_alpha_t * (x_t - (beta_t / sqrt_one_minus_alpha_bar_t) * predicted_noise)
            
            # 计算当前步的方差 \sigma_t
            if step > 0:
                if self.variance_type == "fixed_large":
                    # \sigma_t^2 = \beta_t
                    variance = beta_t
                elif self.variance_type == "fixed_small":
                    # \sigma_t^2 = \tilde{\beta}_t (后验方差)
                    variance = self._get_coefficient(self.posterior_variance, t, x_t.shape)
                elif self.variance_type == "fixed_geometric":
                    # \sigma_t^2 = sqrt(\beta_t * \tilde{\beta}_t)，在 large/small 两种方差之间取几何平均。
                    posterior_variance_t = self._get_coefficient(self.posterior_variance, t, x_t.shape)
                    variance = torch.sqrt(torch.clamp(beta_t * posterior_variance_t, min=1e-20))
                else:
                    raise ValueError(f"未知的 variance_type: {self.variance_type}")
                
                # 注入重构高斯噪声
                noise = torch.randn_like(x_t)
                x_t = mean + torch.sqrt(variance) * noise
            else:
                # 最后一步（t=0）不加噪声，直接输出均值
                x_t = mean
                
        model.train()
        return x_t
