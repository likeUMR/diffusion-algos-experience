import torch
import torch.nn as nn
from algorithms.base import BaseAlgorithm

class VDM(BaseAlgorithm):
    r"""
    变分扩散模型 (Variational Diffusion Models, VDM)。
    1. 时间连续化：时间 t 连续分布在 [0, 1] 区间内。
    2. 噪声调度使用信号噪比 (Signal-to-Noise Ratio, SNR) 的对数形式 \gamma(t)。
       \gamma(t) = \gamma_min + t * (\gamma_max - \gamma_min)
       \alpha_t^2 = sigmoid(-\gamma(t))
       \sigma_t^2 = sigmoid(\gamma(t))
    3. 训练目标：模型预测注入的噪声，计算 MSE 损失。
    4. 采样过程：将 [0, 1] 离散化为 N 步，使用 DDIM 式确定性反向更新。
    """
    def __init__(
        self,
        num_steps=100,
        gamma_min=-5.0,
        gamma_max=5.0,
        schedule_power=1.0,
        loss_weighting="uniform",
        min_snr_gamma=5.0,
        x0_clip=5.0
    ):
        """
        参数:
            num_steps (int): 采样时的离散时间步数
            gamma_min (float): t=0 时的 log-SNR
            gamma_max (float): t=1 时的 log-SNR
            schedule_power (float): 时间采样幂指数，用于调整训练时关注的噪声区间
            loss_weighting (str): 损失加权策略，支持 "uniform", "snr", "min_snr"
            min_snr_gamma (float): min_snr 策略的 SNR 截断值
            x0_clip (float): 采样时对预测 x0 的裁剪范围
        """
        super().__init__()
        self.num_steps = num_steps
        self.gamma_min = gamma_min
        self.gamma_max = gamma_max
        self.schedule_power = schedule_power
        self.loss_weighting = loss_weighting
        self.min_snr_gamma = min_snr_gamma
        self.x0_clip = x0_clip

    def _get_gamma(self, t: torch.Tensor) -> torch.Tensor:
        r"""
        计算 log-SNR \gamma(t)
        """
        return self.gamma_min + t * (self.gamma_max - self.gamma_min)

    def _sample_time(self, batch_size: int, device: torch.device) -> torch.Tensor:
        t = torch.rand(batch_size, device=device)
        if self.schedule_power != 1.0:
            t = torch.pow(t, self.schedule_power)
        return t

    def _get_alpha_sigma(self, t: torch.Tensor):
        r"""
        根据连续时间 t 计算 \alpha_t 和 \sigma_t
        """
        gamma = self._get_gamma(t)
        # \alpha_t^2 = sigmoid(-gamma)
        # \sigma_t^2 = sigmoid(gamma)
        alpha_sq = torch.sigmoid(-gamma)
        sigma_sq = torch.sigmoid(gamma)
        return torch.sqrt(alpha_sq), torch.sqrt(sigma_sq)

    def compute_loss(self, model: nn.Module, x_0: torch.Tensor) -> torch.Tensor:
        """
        计算连续时间 VDM 的 L2 噪声预测损失
        """
        batch_size = x_0.shape[0]
        device = x_0.device
        
        # 1. 在 [0, 1] 采样连续时间步 t，可通过 schedule_power 偏向低噪声或高噪声区间
        t = self._sample_time(batch_size, device)
        
        # 2. 采样标准高斯噪声 \epsilon
        noise = torch.randn_like(x_0)
        
        # 3. 计算当前时间步下的连续系数
        alpha_t, sigma_t = self._get_alpha_sigma(t)
        alpha_t = alpha_t.view(-1, 1)
        sigma_t = sigma_t.view(-1, 1)
        
        # 4. 生成加噪样本 x_t
        x_t = alpha_t * x_0 + sigma_t * noise
        
        # 5. 预测噪声
        predicted_noise = model(x_t, t)
        
        # 6. 计算 MSE，并按 log-SNR 调度进行可选加权
        per_sample_loss = torch.mean((predicted_noise - noise) ** 2, dim=-1)
        if self.loss_weighting == "uniform":
            weights = torch.ones_like(per_sample_loss)
        else:
            gamma = self._get_gamma(t)
            snr = torch.exp(-gamma)
            if self.loss_weighting == "snr":
                weights = snr / torch.clamp(torch.mean(snr.detach()), min=1e-6)
            elif self.loss_weighting == "min_snr":
                weights = torch.minimum(snr, torch.full_like(snr, self.min_snr_gamma)) / torch.clamp(snr, min=1e-6)
            else:
                raise ValueError(f"未知的 loss_weighting: {self.loss_weighting}")
        loss = torch.mean(weights.detach() * per_sample_loss)
        return loss

    @torch.no_grad()
    def sample(self, model: nn.Module, n_samples: int, device: torch.device) -> torch.Tensor:
        """
        通过将 [0, 1] 区间离散化为 num_steps 步进行确定性变分反向采样
        """
        model.eval()
        
        # 1. 采样初始白噪声 x_1 ~ N(0, I)
        x_t = torch.randn(n_samples, 2, device=device)
        
        dt = 1.0 / self.num_steps
        
        # 2. 从 i = num_steps - 1 倒退到 0
        for i in reversed(range(self.num_steps)):
            t_val = (i + 1) * dt
            s_val = i * dt
            
            t = torch.full((n_samples,), t_val, device=device, dtype=torch.float32)
            s = torch.full((n_samples,), s_val, device=device, dtype=torch.float32)
            
            alpha_t, sigma_t = self._get_alpha_sigma(t)
            alpha_s, sigma_s = self._get_alpha_sigma(s)
            
            alpha_t = alpha_t.view(-1, 1)
            sigma_t = sigma_t.view(-1, 1)
            alpha_s = alpha_s.view(-1, 1)
            sigma_s = sigma_s.view(-1, 1)
            
            # 预测噪声
            predicted_noise = model(x_t, t)
            
            # 3. 估计干净的数据点 \hat{x}_0
            pred_x_0 = (x_t - sigma_t * predicted_noise) / torch.clamp(alpha_t, min=1e-5)
            # 防止数值爆炸
            pred_x_0 = torch.clamp(pred_x_0, min=-self.x0_clip, max=self.x0_clip)
            
            # 4. DDIM 式确定性更新：沿同一个预测噪声方向移动到更干净的 s 时刻
            if i > 0:
                x_t = alpha_s * pred_x_0 + sigma_s * predicted_noise
            else:
                x_t = pred_x_0
                
        model.train()
        return x_t
