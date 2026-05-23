import math
import torch
from torch.utils.data import Dataset
import matplotlib.pyplot as plt

def generate_conch_spiral(n_samples=20000, noise=0.0, turns=3.0):
    """
    生成仅包含海螺线（不带“6”字尾巴）的二维数据点集。
    1. 海螺线的中点（最内侧起点）位于原点 (0, 0)。
    2. 截断在 y 轴正半轴上（theta_max = 2 * pi * turns + pi / 2）。
    3. 左右翻转（x = -x）。
    4. 数据点严格分布在一维流形上（noise=0.0）。
    
    参数:
        n_samples (int): 生成的样本点数量。
        noise (float): 注入的高斯噪声标准差系数。
        turns (float): 螺线的圈数。
        
    返回:
        torch.Tensor: 形状为 [n_samples, 2] 的归一化二维坐标张量。
    """
    u = torch.linspace(0, 1, n_samples)
    x = torch.zeros(n_samples)
    y = torch.zeros(n_samples)
    
    # 截断在 y 轴正半轴上，对应的最大旋转角度
    theta_max = 2 * math.pi * turns + 0.5 * math.pi
    b = 1.0  # 阿基米德螺线系数 r = b * theta
    
    for i in range(n_samples):
        ui = u[i].item()
        theta = theta_max * ui
        r = b * theta
        x[i] = r * math.cos(theta)
        y[i] = r * math.sin(theta)
        
    # 左右翻转 (水平镜像)
    x = -x
        
    data = torch.stack([x, y], dim=1)
    
    # 添加轻微高斯噪声 (若 noise > 0)
    if noise > 0:
        data += torch.randn_like(data) * noise * (b * theta_max)
    
    # 归一化：由于要使海螺线的中点（原点 0,0）严格保持在坐标轴原点上，
    # 我们直接除以坐标最大绝对值来进行等比例缩放。
    max_val = torch.max(torch.abs(data))
    if max_val > 0:
        normalized_data = (data / max_val) * 1.2
    else:
        normalized_data = data
    return normalized_data

def evaluate_manifold_metrics(generated_points, turns=3.0, n_ref_samples=50000):
    """
    计算三个指标：
    1. Chamfer Distance: 双向倒角距离，即 (生->熟) 平均最短距离与 (熟->生) 平均最短距离的和。能有效解决模式坍缩问题。
    2. Uniformity (Entropy): 投影到流形后，各个区域的分布均匀程度。
       我们计算投影点在一维流形参数 [0, 1] 上的归一化 Shannon 熵，值在 [0, 1] 之间，越接近 1.0 表示分布越均匀。
       同时返回 Coverage: 100个等宽区间中，有多少比例的区间包含至少一个生成的投影点，用来反映是否生成完整、有无空洞。
       
    参数:
        generated_points (torch.Tensor 或 numpy.ndarray): 生成的二维坐标点，形状为 [N, 2]。
        turns (float): 海螺线的旋转圈数。
        n_ref_samples (int): 真实一维流形的参考采样点数（采样越密，度量越精准，默认 50000）。
        
    返回:
        chamfer_dist (float): 双向倒角距离。
        uniformity (float): 投影均匀程度（归一化熵）。
        coverage (float): 区间覆盖率。
    """
    import numpy as np
    import torch
    
    # 确保是 torch.Tensor 且在 CPU 上进行计算（或由调用者设备决定，这里用 CPU 最通用稳定）
    if isinstance(generated_points, np.ndarray):
        generated_points = torch.from_numpy(generated_points).float()
    else:
        generated_points = generated_points.cpu().float()
    
    # 生成无噪声的完美一维参考流形
    ref_points = generate_conch_spiral(n_samples=n_ref_samples, noise=0.0, turns=turns)
    
    # 分批计算欧氏距离，防止内存溢出（适合没有 GPU 或内存较小的环境）
    num_gen = generated_points.shape[0]
    min_dists = []
    proj_indices = []
    
    batch_size = 1000
    for i in range(0, num_gen, batch_size):
        batch_pts = generated_points[i:i+batch_size]
        # 计算成对距离：shape 为 [batch_size, n_ref_samples]
        dists = torch.cdist(batch_pts, ref_points)
        batch_min_dists, batch_indices = torch.min(dists, dim=1)
        min_dists.append(batch_min_dists)
        proj_indices.append(batch_indices)
        
    min_dists = torch.cat(min_dists, dim=0)
    proj_indices = torch.cat(proj_indices, dim=0)
    
    # 1. (A) Fidelity distance (生 -> 熟): 每个生成点到最近真实流形点的距离的平均值
    fidelity_dist = torch.mean(min_dists).item()
    
    # (B) Coverage distance (熟 -> 生): 每个真实流形点到最近生成点的距离的平均值
    # 由于 ref_points 较大，我们同样进行分批，以保持内存友好
    min_dists_ref = []
    ref_batch_size = 1000
    for i in range(0, n_ref_samples, ref_batch_size):
        batch_ref = ref_points[i:i+ref_batch_size]
        dists_ref = torch.cdist(batch_ref, generated_points)
        batch_min_dists_ref, _ = torch.min(dists_ref, dim=1)
        min_dists_ref.append(batch_min_dists_ref)
        
    min_dists_ref = torch.cat(min_dists_ref, dim=0)
    coverage_dist = torch.mean(min_dists_ref).item()
    
    # 双向倒角距离 = fidelity_dist + coverage_dist
    chamfer_dist = fidelity_dist + coverage_dist
    
    # 2. 均匀度指标：将最近邻索引映射为一维参数 u_proj \in [0, 1]
    # 因为参考流形是用 linspace(0, 1, n_ref_samples) 生成的，它的索引 index 直接线性对应 u
    u_proj = proj_indices.float() / (n_ref_samples - 1)
    u_proj_np = u_proj.numpy()
    
    # 划分为 100 个等宽区间
    num_bins = 100
    counts, _ = np.histogram(u_proj_np, bins=num_bins, range=(0.0, 1.0))
    
    # 计算区间覆盖率 (Coverage)
    coverage = float(np.sum(counts > 0)) / num_bins
    
    # 计算归一化 Shannon 熵 (Uniformity)
    probs = counts / num_gen
    probs = probs[probs > 0]  # 过滤掉为 0 的区间
    entropy = -np.sum(probs * np.log(probs))
    max_entropy = np.log(num_bins)
    uniformity = float(entropy / max_entropy) if max_entropy > 0 else 0.0
    
    return chamfer_dist, uniformity, coverage

class ConchSpiralDataset(Dataset):
    """
    海螺线 PyTorch Dataset 封装，方便后续模型训练时通过 DataLoader 进行加载。
    """
    def __init__(self, n_samples=20000, noise=0.0, turns=3.0):
        super().__init__()
        self.n_samples = n_samples
        self.noise = noise
        self.turns = turns
        self.data = generate_conch_spiral(n_samples=n_samples, noise=noise, turns=turns)
        
    def __len__(self):
        return self.n_samples
        
    def __getitem__(self, idx):
        """
        获取单个样本。
        
        返回:
            torch.Tensor: 形状为 [2] 的一维坐标张量。
        """
        return self.data[idx]

def plot_dataset(data, save_path="diffusion_result.png"):
    """
    绘制数据分布图并保存为图片。
    
    参数:
        data (torch.Tensor 或 numpy.ndarray): 需要可视化的二维数据。
        save_path (str): 可视化图片的保存路径。
    """
    if isinstance(data, torch.Tensor):
        data = data.numpy()
        
    plt.figure(figsize=(6, 6))
    plt.scatter(data[:, 0], data[:, 1], s=2, alpha=0.5, color='royalblue')
    plt.title("Conch Spiral Dataset (1D Manifold, Flipped, Origin at Center)")
    plt.xlim(-1.5, 1.5)
    plt.ylim(-1.5, 1.5)
    plt.axhline(0, color='black', linewidth=0.5, ls='--')
    plt.axvline(0, color='black', linewidth=0.5, ls='--')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()
    print(f"数据分布图已成功保存至: {save_path}")

if __name__ == "__main__":
    # 测试数据生成与可视化
    print("正在生成纯海螺线数据集...")
    dataset = ConchSpiralDataset(n_samples=20000, noise=0.0, turns=3.0)
    print(f"数据集大小: {len(dataset)}")
    print(f"单样本形状: {dataset[0].shape}")
    print(f"数据坐标范围: X [{dataset.data[:, 0].min():.4f}, {dataset.data[:, 0].max():.4f}] | Y [{dataset.data[:, 1].min():.4f}, {dataset.data[:, 1].max():.4f}]")
    
    # 绘制并保存图片
    plot_dataset(dataset.data, save_path="diffusion_result.png")
