import torch
import torch.nn as nn
from models.time_embedding import TimeEmbedding

class ResidualBlock(nn.Module):
    """
    一个包含时间条件嵌入的残差层
    """
    def __init__(self, dim, time_emb_dim):
        super().__init__()
        # 使用 LayerNorm 来稳定 2D 数据的高维特征训练
        self.norm = nn.LayerNorm(dim)
        
        # 主干网络
        self.linear1 = nn.Linear(dim, dim)
        self.act = nn.SiLU()
        self.linear2 = nn.Linear(dim, dim)
        
        # 时间投影网络，用于调整中间特征
        self.time_proj = nn.Sequential(
            nn.SiLU(),
            nn.Linear(time_emb_dim, dim)
        )

    def forward(self, x, time_emb):
        """
        参数:
            x (torch.Tensor): 形状为 [B, dim] 的中间隐藏特征
            time_emb (torch.Tensor): 形状为 [B, time_emb_dim] 的时间特征向量
        返回:
            torch.Tensor: 形状为 [B, dim] 的输出特征
        """
        # 1. 预归一化
        h = self.norm(x)
        
        # 2. 第一层线性变换
        h = self.linear1(h)
        
        # 3. 融入时间条件 (将时间编码投影到当前特征维度，并相加)
        h = h + self.time_proj(time_emb)
        
        # 4. 激活与第二层线性变换
        h = self.act(h)
        h = self.linear2(h)
        
        # 5. 残差连接
        return x + h

class ConditionalMLP(nn.Module):
    """
    条件多层感知机 (Conditional MLP)，作为扩散/流匹配模型的核心去噪/速度网
    输入 [B, 2] 的坐标以及 [B] 的时间戳 t，输出与输入相同形状 [B, 2] 的更新向量
    """
    def __init__(self, input_dim=2, hidden_dim=256, num_blocks=4, time_emb_dim=256, scale_factor=1000.0, time_channels=1):
        super().__init__()
        # 1. 时间嵌入层
        self.time_embed = TimeEmbedding(
            embedding_dim=64,
            hidden_dim=time_emb_dim,
            scale_factor=scale_factor,
            time_channels=time_channels
        )
        
        # 2. 输入投影层
        self.input_layer = nn.Linear(input_dim, hidden_dim)
        
        # 3. 堆叠残差块
        self.blocks = nn.ModuleList([
            ResidualBlock(hidden_dim, time_emb_dim) for _ in range(num_blocks)
        ])
        
        # 4. 输出投影层
        self.norm_out = nn.LayerNorm(hidden_dim)
        self.act_out = nn.SiLU()
        self.output_layer = nn.Linear(hidden_dim, input_dim)
        
    def forward(self, x, t):
        """
        参数:
            x (torch.Tensor): 形状为 [B, 2] 的二维数据点
            t (torch.Tensor): 形状为 [B] 或 [B, 1] 的时间张量
        返回:
            torch.Tensor: 形状为 [B, 2] 的预测输出 (如去噪方向或速度矢量)
        """
        # 获取时间嵌入
        t_emb = self.time_embed(t)
        
        # 将输入投影到隐藏空间
        h = self.input_layer(x)
        
        # 顺序通过所有残差块
        for block in self.blocks:
            h = block(h, t_emb)
            
        # 最后的归一化和输出
        h = self.norm_out(h)
        h = self.act_out(h)
        out = self.output_layer(h)
        
        return out

if __name__ == "__main__":
    # 快速测试模型的前向传播
    model = ConditionalMLP()
    print("模型结构:\n", model)
    
    test_x = torch.randn(8, 2)
    test_t = torch.rand(8)
    out = model(test_x, test_t)
    print(f"输入形状: {test_x.shape}, 时间形状: {test_t.shape}")
    print(f"输出形状: {out.shape}")
    assert out.shape == test_x.shape, "输出形状应当与输入完全一致！"
    print("前向传播测试通过！")
