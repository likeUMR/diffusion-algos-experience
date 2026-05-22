import torch
import torch.nn as nn

class BaseAlgorithm:
    """
    生成算法的抽象基类。
    所有具体的扩散模型 (DDPM, DDIM) 和流匹配 (Flow-Matching) 算法都需要继承此类，
    并实现 compute_loss 和 sample 方法。
    """
    def __init__(self):
        pass

    def compute_loss(self, model: nn.Module, x_0: torch.Tensor) -> torch.Tensor:
        """
        计算单步训练的损失函数 (通常为 L2/MSE 损失)
        
        参数:
            model (nn.Module): 神经网络模型 (如 ConditionalMLP)
            x_0 (torch.Tensor): 形状为 [B, 2] 的真实数据批次
            
        返回:
            torch.Tensor: 标量 Loss
        """
        raise NotImplementedError("每个算法类必须实现 compute_loss 方法！")

    def sample(self, model: nn.Module, n_samples: int, device: torch.device) -> torch.Tensor:
        """
        从先验分布中反向采样生成新的数据点
        
        参数:
            model (nn.Module): 训练好的条件神经网络模型
            n_samples (int): 采样生成的样本点数量
            device (torch.device): 运算设备 (cpu 或 cuda)
            
        返回:
            torch.Tensor: 形状为 [n_samples, 2] 的生成数据点
        """
        raise NotImplementedError("每个算法类必须实现 sample 方法！")
