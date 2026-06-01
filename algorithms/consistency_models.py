import copy
import torch
import torch.nn as nn
from algorithms.base import BaseAlgorithm

class ConsistencyModels(BaseAlgorithm):
    """
    Consistency Models (一致性模型) —— CD 蒸馏模式。
    核心论文: "Consistency Models" (Yang Song, Prafulla Dhariwal, Ilya Sutskever)
    
    1. 核心概念：一致性模型定义了一个自一致性映射 f_theta(x_t, t)，
       使得对于同一条 ODE 轨迹上的任意时间点 t 都有 f_theta(x_t, t) = x_0。
       因此，训练好的一致性模型只需要单步前向传播 f_theta(x_T, T) 即可直接生成高保真样本。
    
    2. 边界条件：f_theta(x_epsilon, epsilon) = x_epsilon。我们使用参数化方式强制满足此边界条件：
       f_theta(x, t) = c_skip(t) * x + c_out(t) * model(x, t)
       其中 c_skip(epsilon) = 1, c_out(epsilon) = 0。
       
    3. 训练方法：采用 Consistency Distillation (CD)。
       先固定一个 100 步 Flow Matching teacher，再从 teacher ODE 轨迹中取相邻状态：
       f_theta(x_{t_{i+1}}, t_{i+1}) ≈ f_{theta^-}(x_{t_i}^{teacher}, t_i)。
    """
    def __init__(
        self,
        num_steps=50,
        sample_steps=1,
        sigma_data=0.5,
        epsilon=0.002,
        ema_decay=0.95,
        sigma_max=1.0,
        distillation_steps=100,
        training_mode="cd"
    ):
        """
        参数:
            num_steps (int): 离散时间网格的大小 (也就是最大训练步数)
            sample_steps (int): 实际推理时的采样步数 (CM 核心优势在于 1 或 2 步生成)
            sigma_data (float): 数据分布的标准差，用于计算 skip/out 系数，通常取 0.5 左右
            epsilon (int/float): 最小时间步长 (边界条件点)
            ema_decay (float): 目标网络参数 (theta^-) 的指数移动平均更新系数
            sigma_max (float): 最大噪声尺度。训练和采样必须使用同一个上界，避免先验错配。
            distillation_steps (int): Flow Matching teacher 的固定 ODE 步数
            training_mode (str): 当前固定使用 "cd"
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
        self.distillation_steps = distillation_steps
        self.training_mode = training_mode
        self.target_model = None
        self.teacher_model = None

    def set_teacher_model(self, teacher_model: nn.Module):
        """
        注入预训练 Flow Matching teacher。teacher 固定为 eval/frozen，仅用于 CD 轨迹蒸馏。
        """
        self.teacher_model = teacher_model
        self.teacher_model.eval()
        for p in self.teacher_model.parameters():
            p.requires_grad = False

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
        计算 Consistency Distillation (CD) 的 L2/MSE 损失。
        """
        if self.training_mode != "cd":
            raise ValueError(f"未知的 Consistency Models 训练模式: {self.training_mode}")
        if self.teacher_model is None:
            raise RuntimeError("Consistency Distillation 需要先注入 100 步 Flow Matching teacher。")

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
                
        self.teacher_model = self.teacher_model.to(device)
        self.teacher_model.eval()

        # 3. 从 Flow Matching teacher 的 100 步 ODE 轨迹中随机抽一个相邻区间。
        # FM 时间 s: 0=噪声, 1=数据；CM 时间 t: 1=噪声, 0=数据，因此 t = 1 - s。
        teacher_steps = max(1, int(self.distillation_steps))
        step_idx = int(torch.randint(0, teacher_steps, (1,), device=device).item())
        dt = 1.0 / teacher_steps

        with torch.no_grad():
            x_teacher = torch.randn_like(x_0)
            for k in range(step_idx):
                s = torch.full((batch_size,), k * dt, device=device, dtype=x_0.dtype)
                velocity = self.teacher_model(x_teacher, s)
                x_teacher = x_teacher + velocity * dt

            s_next = step_idx * dt
            s_curr = (step_idx + 1) * dt
            t_next = torch.full((batch_size,), max(self.epsilon, 1.0 - s_next), device=device, dtype=x_0.dtype)
            t_curr = torch.full((batch_size,), max(self.epsilon, 1.0 - s_curr), device=device, dtype=x_0.dtype)

            x_t_next = x_teacher
            velocity = self.teacher_model(x_t_next, torch.full((batch_size,), s_next, device=device, dtype=x_0.dtype))
            x_t_curr = x_t_next + velocity * dt

        # 4. 在线 student 在较噪状态上直接预测数据端。
        f_theta = self.get_consistency_output(model, x_t_next, t_next)

        # 5. EMA student 在 teacher 推进一步后的较干净状态上提供 CD 目标。
        with torch.no_grad():
            f_target = self.get_consistency_output(self.target_model, x_t_curr, t_curr)
            f_target = f_target.detach()
            
        # 6. 一致性蒸馏损失。
        loss = torch.mean((f_theta - f_target) ** 2)
        return loss

    @torch.no_grad()
    def sample(self, model: nn.Module, n_samples: int, device: torch.device) -> torch.Tensor:
        """
        采样生成数据。

        当前实现采用 Flow Matching teacher 的 Consistency Distillation。训练分布是 teacher
        ODE 轨迹上的相邻状态，而不是 EDM/Karras 风格的 x_0 + sigma * z 轨迹。因此这里固定
        使用 1-step consistency projection，避免推理时反复额外加噪导致轨迹震荡和后期发散。
        """
        model.eval()
        
        # 1. 采样初始白噪声 x_T ~ N(0, sigma_max^2 I)，与训练端最大噪声尺度一致。
        x = self.sigma_max * torch.randn(n_samples, 2, device=device)
        t_T = torch.full((n_samples,), self.sigma_max, device=device, dtype=torch.float32)
        x_0 = self.get_consistency_output(model, x, t_T)
        model.train()
        return x_0
