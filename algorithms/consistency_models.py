import copy
import torch
import torch.nn as nn
from algorithms.base import BaseAlgorithm

class ConsistencyModels(BaseAlgorithm):
    """
    Consistency Models (一致性模型) —— 走向单步的终极演替。
    核心论文: "Consistency Models" (Yang Song, Prafulla Dhariwal, Ilya Sutskever)
    
    1. 核心概念：一致性模型定义了一个自一致性映射 f_theta(x_t, t)，
       使得对于同一条 ODE 轨迹上的任意时间点 t 都有 f_theta(x_t, t) = x_0。
       因此，训练好的一致性模型只需要单步前向传播 f_theta(x_T, T) 即可直接生成高保真样本。
    
    2. 边界条件：f_theta(x_epsilon, epsilon) = x_epsilon。我们使用参数化方式强制满足此边界条件：
       f_theta(x, t) = c_skip(t) * x + c_out(t) * model(x, t)
       其中 c_skip(epsilon) = 1, c_out(epsilon) = 0。
       
    3. 训练方法：采用 Consistency Training (CT) 直接从头训练。
       在每个时间步离散点 t_i 和 t_{i+1}，在 x_0 上添加相同的噪声 z 以模拟同一去噪轨迹上的相邻点，
       然后利用目标网络 (在线网络的 EMA 拷贝) 提供一致性目标，使模型在两个时间点的预测相一致：
       f_theta(x_{t_{i+1}}, t_{i+1}) ≈ f_{theta^-}(x_{t_i}, t_i)
    """
    def __init__(self, num_steps=50, sample_steps=1, sigma_data=0.5, epsilon=0.002, ema_decay=0.95, sigma_max=1.0):
        """
        参数:
            num_steps (int): 离散时间网格的大小 (也就是最大训练步数)
            sample_steps (int): 实际推理时的采样步数 (CM 核心优势在于 1 或 2 步生成)
            sigma_data (float): 数据分布的标准差，用于计算 skip/out 系数，通常取 0.5 左右
            epsilon (int/float): 最小时间步长 (边界条件点)
            ema_decay (float): 目标网络参数 (theta^-) 的指数移动平均更新系数
            sigma_max (float): 最大噪声尺度。训练和采样必须使用同一个上界，避免先验错配。
        """
        super().__init__()
        if num_steps < 1:
            raise ValueError("num_steps 必须 >= 1")
        if sample_steps < 1:
            raise ValueError("sample_steps 必须 >= 1")
        if sample_steps > num_steps:
            raise ValueError("Consistency Models 的 sample_steps 不能大于 num_steps")
        self.num_steps = num_steps
        self.sample_steps = sample_steps
        self.sigma_data = sigma_data
        self.epsilon = epsilon
        self.ema_decay = ema_decay
        self.sigma_max = sigma_max
        self.target_model = None

    def get_consistency_output(self, model: nn.Module, x: torch.Tensor, t: torch.Tensor) -> torch.Tensor:
        """
        根据公式参数化输出，以强制满足边界条件：
        f_theta(x, t) = c_skip(t) * x + c_out(t) * model(x, t)
        """
        # 确保 t 的形状为 [B]
        t = t.view(-1)
        # 限制下界以避免除零或数值不稳定
        t_clipped = torch.clamp(t, min=self.epsilon)
        t_col = t_clipped.view(-1, 1)
        
        # 计算 c_skip 和 c_out
        c_skip = (self.sigma_data ** 2) / ((t_col - self.epsilon) ** 2 + self.sigma_data ** 2)
        c_out = (t_col - self.epsilon) / torch.sqrt((t_col - self.epsilon) ** 2 + self.sigma_data ** 2)
        
        # 神经网络的前向传播
        model_out = model(x, t)
        
        # 组合获得满足边界自一致的一致性映射输出
        return c_skip * x + c_out * model_out

    def compute_loss(self, model: nn.Module, x_0: torch.Tensor) -> torch.Tensor:
        """
        计算 Consistency Training (CT) 的 L2/MSE 损失
        """
        batch_size = x_0.shape[0]
        device = x_0.device
        
        # 1. 延迟且自适应初始化 EMA 目标模型 (保证与在线模型拥有完全相同的架构和设备)
        if self.target_model is None:
            self.target_model = copy.deepcopy(model).to(device)
            self.target_model.eval()
            for p in self.target_model.parameters():
                p.requires_grad = False
                
        # 2. 对目标模型参数进行 EMA 更新
        with torch.no_grad():
            for p_target, p_online in zip(self.target_model.parameters(), model.parameters()):
                p_target.copy_(self.ema_decay * p_target + (1.0 - self.ema_decay) * p_online.to(device))
                
        # 3. 随机采样离散步数索引。num_steps=1 时退化为直接学习 [epsilon, sigma_max] 全区间一致性映射。
        if self.num_steps == 1:
            t_curr = torch.full((batch_size,), self.epsilon, device=device, dtype=x_0.dtype)
            t_next = torch.full((batch_size,), self.sigma_max, device=device, dtype=x_0.dtype)
        else:
            i = torch.randint(1, self.num_steps, (batch_size,), device=device)
            # 时间尺度映射到 [epsilon, sigma_max] 上，并与采样初始噪声尺度保持一致。
            t_curr = self.epsilon + (i - 1) / (self.num_steps - 1) * (self.sigma_max - self.epsilon)
            t_next = self.epsilon + i / (self.num_steps - 1) * (self.sigma_max - self.epsilon)
        
        # 5. 采样同源高斯噪声 z
        z = torch.randn_like(x_0)
        
        # 6. 计算相邻两个时间步的带噪数据点 (代表同一去噪路径上的两点)
        x_t_curr = x_0 + t_curr.view(-1, 1) * z
        x_t_next = x_0 + t_next.view(-1, 1) * z
        
        # 7. 计算在线模型在 t_{i+1} 时刻的一致性映射输出 (求梯度)
        f_theta = self.get_consistency_output(model, x_t_next, t_next)
        
        # 8. 计算目标模型在 t_i 时刻的一致性映射输出 (不求梯度)
        with torch.no_grad():
            f_target = self.get_consistency_output(self.target_model, x_t_curr, t_curr)
            f_target = f_target.detach()
            
        # 9. 一致性损失函数为两个输出的 MSE
        loss = torch.mean((f_theta - f_target) ** 2)
        return loss

    @torch.no_grad()
    def sample(self, model: nn.Module, n_samples: int, device: torch.device) -> torch.Tensor:
        """
        采样生成数据：
        - 如果 sample_steps == 1：执行单步生成 (CM 的终极特性)
        - 如果 sample_steps > 1：执行交替“加噪-一步去噪”的多步快速采样，展现更精细的分布拟合
        """
        model.eval()
        
        # 1. 采样初始白噪声 x_T ~ N(0, sigma_max^2 I)，与训练端最大噪声尺度一致。
        x = self.sigma_max * torch.randn(n_samples, 2, device=device)
        
        if self.sample_steps <= 1:
            # ----------------- 终极的一步直接生成 -----------------
            t_T = torch.full((n_samples,), self.sigma_max, device=device, dtype=torch.float32)
            # 经过一次 get_consistency_output 直接获得逼近 x_0 的解！
            x_0 = self.get_consistency_output(model, x, t_T)
            model.train()
            return x_0
        else:
            # ----------------- 2 步至多步迭代式采样 -----------------
            # 我们根据指定的 sample_steps 设定降序的时间步序列
            steps = torch.linspace(self.sigma_max, self.epsilon, self.sample_steps, device=device)
            
            # 第一步：直接对初始白噪声做一次一致性投影，获得一个基准点
            t_first = torch.full((n_samples,), steps[0], device=device, dtype=torch.float32)
            x = self.get_consistency_output(model, x, t_first)
            
            # 随后交替进行 重新加噪 (退火) 和 一致性去噪
            for k in range(1, self.sample_steps):
                tau = steps[k]
                t_val = torch.full((n_samples,), tau, device=device, dtype=torch.float32)
                
                # 采样并加入特定大小 of 噪声
                z = torch.randn_like(x)
                noise_scale = torch.sqrt(tau**2 - self.epsilon**2)
                x = x + noise_scale * z
                
                # 再次执行一致性映射投影至 x_0
                x = self.get_consistency_output(model, x, t_val)
                
            model.train()
            return x
