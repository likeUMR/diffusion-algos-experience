import sys
import torch

def check_environment():
    print("=" * 50)
    print("环境检查结果：")
    print("=" * 50)
    
    # 1. Python 版本
    print(f"Python 版本: {sys.version}")
    
    # 2. PyTorch 版本及 CUDA 状态
    print(f"PyTorch 版本: {torch.__version__}")
    cuda_available = torch.cuda.is_available()
    print(f"CUDA 是否可用: {cuda_available}")
    
    if cuda_available:
        print(f"CUDA 设备数量: {torch.cuda.device_count()}")
        print(f"当前 CUDA 设备索引: {torch.cuda.current_device()}")
        print(f"当前 GPU 设备名称: {torch.cuda.get_device_name(0)}")
        
        # 3. 简单的 CUDA 运算测试
        print("\n正在执行 CUDA 简单矩阵运算测试...")
        try:
            x = torch.randn(100, 2, device='cuda')
            y = x @ x.T
            print("CUDA 测试成功！可以在 GPU 上进行张量运算。")
        except Exception as e:
            print(f"CUDA 测试失败，错误信息: {e}")
    else:
        print("\n警告：PyTorch 无法使用 GPU (CUDA)。这通常是因为安装了 CPU 版本的 PyTorch，或者显卡驱动有问题。")
        print("如果是 CPU 版本的 PyTorch，建议重新使用 CUDA whl 页面安装支持 GPU 的版本。")

if __name__ == "__main__":
    check_environment()
