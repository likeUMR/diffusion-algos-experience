import math
import torch
import torch.nn as nn

class SinusoidalEmbedding(nn.Module):
    """
    正弦/余弦时间位置编码 (Sinusoidal Positional Embedding)
    """
    def __init__(self, dim, max_period=10000):
        super().__init__()
        self.dim = dim
        self.max_period = max_period

    def forward(self, t):
        """
        参数:
            t (torch.Tensor): 形状为 [B] 或 [B, 1] 的时间张量 (float)
        返回:
            torch.Tensor: 形状为 [B, dim] 的时间特征向量
        """
        if len(t.shape) == 2:
            t = t.squeeze(-1)
            
        # 确保输入是 float
        t = t.to(torch.float32)
        
        half_dim = self.dim // 2
        frequencies = torch.exp(
            -math.log(self.max_period) * torch.arange(start=0, end=half_dim, dtype=torch.float32, device=t.device) / half_dim
        )
        args = t[:, None] * frequencies[None, :]
        embedding = torch.cat([torch.sin(args), torch.cos(args)], dim=-1)
        
        # 奇数维度补零
        if self.dim % 2 == 1:
            embedding = torch.cat([embedding, torch.zeros_like(embedding[:, :1])], dim=-1)
            
        return embedding

class TimeEmbedding(nn.Module):
    """
    时间编码包装块，将正弦位置编码投影到隐藏层维度
    """
    def __init__(self, embedding_dim=64, hidden_dim=128, scale_factor=1000.0, time_channels=1):
        super().__init__()
        self.scale_factor = scale_factor
        self.time_channels = time_channels
        self.sin_embed = SinusoidalEmbedding(embedding_dim)
        self.mlp = nn.Sequential(
            nn.Linear(embedding_dim * time_channels, hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, hidden_dim)
        )

    def forward(self, t):
        """
        参数:
            t (torch.Tensor): 形状为 [B] 或 [B, 1] 的时间张量 (值域可能在 [0, 1] 或 [0, T])
        返回:
            torch.Tensor: 形状为 [B, hidden_dim] 的嵌入编码
        """
        # 如果时间 t 都在 [0, 1] 区间内 (如 Flow-Matching 或连续扩散)，
        # 我们依据 scale_factor 进行放大，使得正弦编码的周期频率更加合适。
        # 在计算 MeanFlow 的物理全导数时，PyTorch 链式法则会自动传递对叶子节点 t_grad 的偏导，
        # 因此即使乘以 scale_factor 放大，由于 autograd 的数学链式法则性质，求导出来的 grad_t
        # 本身依然是相对于原始物理时间 t 的真实全导数，而不会发生量纲扭曲。
        if self.scale_factor > 1.0 and t.max() <= 1.0 + 1e-5:
            t = t * self.scale_factor
            
        if len(t.shape) == 2 and t.shape[-1] == 2:
            r = t[:, 0]
            t_end = t[:, 1]
            delta = torch.clamp(t_end - r, min=0.0)
            channels = [r, t_end, delta]
            emb = torch.cat([self.sin_embed(channels[i]) for i in range(self.time_channels)], dim=-1)
        else:
            emb = self.sin_embed(t)
            
        return self.mlp(emb)
