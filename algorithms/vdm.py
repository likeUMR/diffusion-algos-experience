import torch
import torch.nn as nn
from algorithms.base import BaseAlgorithm

class VDM(BaseAlgorithm):
    r"""
    Karras EDM 风格的连续噪声扩散模型。
    1. 训练噪声尺度 sigma 服从 log-normal 分布：log(sigma) ~ N(p_mean, p_std)。
    2. 加噪形式使用 VE 参数化：x_sigma = x_0 + sigma * epsilon。
    3. 模型继续预测噪声 epsilon，并使用 EDM 风格权重平滑不同噪声区间的训练贡献。
    4. 采样使用 Karras rho schedule，在 sigma 空间做确定性 Euler 反向积分。
    """
    def __init__(
        self,
        num_steps=100,
        sigma_min=0.002,
        sigma_max=80.0,
        p_mean=-1.2,
        p_std=1.2,
        loss_weighting="edm_weighting",
        sampler_rho=7.0
    ):
        """
        参数:
            num_steps (int): 采样时的离散时间步数
            sigma_min (float): EDM 最小噪声尺度
            sigma_max (float): EDM 最大噪声尺度
            p_mean (float): log-normal 训练噪声中心
            p_std (float): log-normal 训练噪声宽度
            loss_weighting (str): 损失加权策略，目前固定使用 "edm_weighting"
            sampler_rho (float): Karras 采样时间步切分弯曲度
        """
        super().__init__()
        self.num_steps = num_steps
        self.sigma_min = sigma_min
        self.sigma_max = sigma_max
        self.p_mean = p_mean
        self.p_std = p_std
        self.loss_weighting = loss_weighting
        self.sampler_rho = sampler_rho

    def _sample_sigma(self, batch_size: int, device: torch.device) -> torch.Tensor:
        log_sigma = torch.randn(batch_size, device=device) * self.p_std + self.p_mean
        sigma = torch.exp(log_sigma)
        return torch.clamp(sigma, min=self.sigma_min, max=self.sigma_max)

    def _sigma_to_time(self, sigma: torch.Tensor) -> torch.Tensor:
        log_min = torch.log(torch.as_tensor(self.sigma_min, device=sigma.device, dtype=sigma.dtype))
        log_max = torch.log(torch.as_tensor(self.sigma_max, device=sigma.device, dtype=sigma.dtype))
        log_sigma = torch.log(torch.clamp(sigma, min=self.sigma_min))
        return torch.clamp((log_sigma - log_min) / (log_max - log_min), 0.0, 1.0)

    def _get_edm_weights(self, sigma: torch.Tensor) -> torch.Tensor:
        if self.loss_weighting != "edm_weighting":
            raise ValueError(f"未知的 loss_weighting: {self.loss_weighting}")
        # 对 epsilon 预测使用温和的 EDM/SNR 型权重，避免极小 sigma 样本主导梯度。
        sigma_sq = sigma ** 2
        return sigma_sq / (sigma_sq + 1.0)

    def _get_karras_sigmas(self, device: torch.device) -> torch.Tensor:
        ramp = torch.linspace(0, 1, self.num_steps, device=device)
        min_inv_rho = self.sigma_min ** (1.0 / self.sampler_rho)
        max_inv_rho = self.sigma_max ** (1.0 / self.sampler_rho)
        sigmas = (max_inv_rho + ramp * (min_inv_rho - max_inv_rho)) ** self.sampler_rho
        return torch.cat([sigmas, torch.zeros(1, device=device)])

    def compute_loss(self, model: nn.Module, x_0: torch.Tensor) -> torch.Tensor:
        """
        计算 EDM 噪声尺度下的 L2 噪声预测损失。
        """
        batch_size = x_0.shape[0]
        device = x_0.device
        
        # 1. 从 Karras/EDM 推荐的 log-normal 分布中采样训练噪声尺度。
        sigma = self._sample_sigma(batch_size, device)
        noise = torch.randn_like(x_0)
        
        # 2. VE 加噪：x_sigma = x_0 + sigma * epsilon。
        sigma_view = sigma.view(-1, 1)
        x_t = x_0 + sigma_view * noise
        
        # 3. 将 sigma 映射回 [0, 1]，复用现有时间嵌入网络。
        t = self._sigma_to_time(sigma)
        predicted_noise = model(x_t, t)
        
        # 4. EDM 风格加权，平衡不同 sigma 区间的梯度贡献。
        per_sample_loss = torch.mean((predicted_noise - noise) ** 2, dim=-1)
        weights = self._get_edm_weights(sigma)
        loss = torch.mean(weights.detach() * per_sample_loss)
        return loss

    @torch.no_grad()
    def sample(self, model: nn.Module, n_samples: int, device: torch.device) -> torch.Tensor:
        """
        使用 Karras sigma schedule 做确定性 Euler 采样。
        """
        model.eval()
        
        sigmas = self._get_karras_sigmas(device)
        x_t = torch.randn(n_samples, 2, device=device) * sigmas[0]

        for i in range(len(sigmas) - 1):
            sigma = sigmas[i]
            sigma_next = sigmas[i + 1]
            sigma_batch = torch.full((n_samples,), sigma.item(), device=device, dtype=torch.float32)
            t = self._sigma_to_time(sigma_batch)
            predicted_noise = model(x_t, t)
            x_t = x_t + (sigma_next - sigma) * predicted_noise
                
        model.train()
        return x_t
