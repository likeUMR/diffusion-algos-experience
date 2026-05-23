import argparse
import torch
import os
import time
import yaml
import numpy as np
import matplotlib.pyplot as plt
import shutil
import random
import json
from data_generator import ConchSpiralDataset, evaluate_manifold_metrics
from models.mlp import ConditionalMLP
from algorithms.ddpm import DDPM
from algorithms.ddim import DDIM
from algorithms.avg_ddim import AvgDDIM
from algorithms.flow_matching import FlowMatching
from algorithms.vdm import VDM
from algorithms.v_learning import VLearning
from algorithms.mean_flow import MeanFlow
from algorithms.consistency_models import ConsistencyModels
from trainer import Trainer

# 算法注册表：已注册所有阶段算法
ALGORITHMS = {
    "ddpm": DDPM,
    "ddim": DDIM,
    "avg_ddim": AvgDDIM,
    "vdm": VDM,
    "v_learning": VLearning,
    "flow_matching": FlowMatching,
    "consistency_models": ConsistencyModels,
    "mean_flow": MeanFlow,
}

def get_args():
    parser = argparse.ArgumentParser(description="二维数据生成模型的模块化训练框架 (Stage 2 & 5)")
    
    # 训练/生成控制
    parser.add_argument("--mode", type=str, default="train", choices=["train", "sample", "benchmark", "hpo"],
                        help="运行模式：'train' (进行训练) 或 'sample' (仅从 checkpoint 采样) 或 'benchmark' (一键评测所有算法并可视化) 或 'hpo' (成本自适应贝叶斯优化调参)")
    parser.add_argument("--config", type=str, default="config.yaml", help="配置文件路径")
    parser.add_argument("--checkpoint", type=str, default=None,
                        help="模型的 Checkpoint (.pt 文件) 路径，用于恢复训练或直接采样")
    parser.add_argument("--algorithm", type=str, default="flow_matching", choices=list(ALGORITHMS.keys()),
                        help="单独训练/采样/调参模式下使用的生成模型算法")
    parser.add_argument("--hpo_trials", type=int, default=20, help="自动调参 (HPO) 的迭代次数 (试验组数)")
    parser.add_argument("--fixed_sample_steps", type=int, default=None, choices=[100, 20, 5, 1],
                        help="HPO 时冻结推理采样步数/NFE。传入后不再搜索 num_steps/sample_steps。")
    parser.add_argument("--seed", type=int, default=42, help="全局随机种子，用于训练、采样和 HPO sampler")
    parser.add_argument("--hpo_repeats", type=int, default=1,
                        help="每个 HPO trial 使用多少个不同 seed 重复评估，并以平均流形距离作为目标")
    parser.add_argument("--reset_study", action="store_true",
                        help="HPO 前清空当前算法/NFE 对应的 Optuna 数据库和 trial 档案，确保从零开始")
    
    return parser.parse_args()

def load_config(config_path="config.yaml"):
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    else:
        print(f"[!] 警告: 未找到配置文件 {config_path}，将采用默认硬编码配置。")
        return {}

def get_time_channels(algo_name):
    return 3 if algo_name == "mean_flow" else 1

def get_model_scale_factor(algo_name):
    if algo_name == "consistency_models":
        return 1.0
    if algo_name == "mean_flow":
        return 100.0
    return 1000.0

def set_global_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = True

def apply_fixed_sample_steps(algo_name, algo_params, fixed_steps):
    if fixed_steps is None:
        return algo_params
        
    algo_params = algo_params.copy()
    if algo_name == "ddpm":
        # DDPM 的训练扩散链和采样链强耦合，只允许同一个步数。
        algo_params["num_steps"] = fixed_steps
    elif algo_name in ["ddim", "avg_ddim", "v_learning", "consistency_models"]:
        # 离散时间算法强制训练网格和推理采样步数一致，避免 sample_steps > num_steps 或重复索引。
        algo_params["num_steps"] = fixed_steps
        algo_params["sample_steps"] = fixed_steps
    elif algo_name in ["vdm", "flow_matching", "mean_flow"]:
        # 连续时间算法的 num_steps 就是数值积分/推理步数。
        algo_params["num_steps"] = fixed_steps
    else:
        raise ValueError(f"未知算法: {algo_name}")
    return algo_params

def get_forward_flops(hidden_dim=256, num_blocks=4, time_emb_dim=256, time_channels=1):
    # TimeEmbedding: (64 * time_channels) -> hidden_dim -> hidden_dim
    time_flops = 2 * 64 * time_channels * hidden_dim + 2 * hidden_dim * hidden_dim
    # input_layer: 2 -> hidden_dim
    input_flops = 2 * 2 * hidden_dim
    # blocks
    block_flops = 0
    for _ in range(num_blocks):
        block_flops += 4 * hidden_dim  # LayerNorm
        block_flops += 2 * hidden_dim * hidden_dim  # Linear 1
        block_flops += 2 * time_emb_dim * hidden_dim  # time_proj
        block_flops += 2 * hidden_dim * hidden_dim  # Linear 2
    # output projection
    output_flops = 4 * hidden_dim + 2 * hidden_dim * 2
    return time_flops + input_flops + block_flops + output_flops

def parse_hpo_report(report_path):
    data = {}
    if not os.path.exists(report_path):
        return data
    with open(report_path, "r", encoding="utf-8") as f:
        for line in f:
            if ":" not in line:
                continue
            key, _, value = line.partition(":")
            data[key.strip()] = value.strip()
    return data

def find_latest_checkpoint(root_dir):
    if not root_dir or not os.path.exists(root_dir):
        return None
    checkpoints = []
    for root, _, files in os.walk(root_dir):
        for name in files:
            if name.endswith(".pt"):
                checkpoints.append(os.path.join(root, name))
    if not checkpoints:
        return None
    checkpoints.sort(key=lambda path: (os.path.getmtime(path), path))
    return checkpoints[-1]

def get_flow_teacher_config(config):
    train_cfg = config.get("train", {})
    model_cfg = config.get("model", {})
    algo_cfg = config.get("algorithms", {})
    results_dir = train_cfg.get("results_dir", "results")
    report = parse_hpo_report(os.path.join(results_dir, "hpo_best_report_flow_matching_nfe_100.txt"))
    flow_cfg = algo_cfg.get("flow_matching", {})

    def get_int(key, default):
        try:
            return int(str(report.get(key, flow_cfg.get(key, default))).split()[0])
        except (TypeError, ValueError):
            return int(default)

    def get_float(key, default):
        try:
            return float(str(report.get(key, flow_cfg.get(key, default))).split()[0])
        except (TypeError, ValueError):
            return float(default)

    hidden_dim = get_int("hidden_dim", flow_cfg.get("hidden_dim", model_cfg.get("hidden_dim", 256)))
    num_blocks = get_int("num_blocks", flow_cfg.get("num_blocks", model_cfg.get("num_blocks", 4)))
    time_emb_dim = get_int("time_emb_dim", flow_cfg.get("time_emb_dim", hidden_dim))
    epochs = get_int("epochs (自适应配平)", flow_cfg.get("epochs", train_cfg.get("epochs", 200)))
    lr = get_float("lr", flow_cfg.get("lr", train_cfg.get("lr", 1e-3)))
    weight_decay = get_float("weight_decay", flow_cfg.get("weight_decay", train_cfg.get("weight_decay", 1e-4)))
    return {
        "hidden_dim": hidden_dim,
        "num_blocks": num_blocks,
        "time_emb_dim": time_emb_dim,
        "epochs": epochs,
        "lr": lr,
        "weight_decay": weight_decay,
        "num_steps": 100,
    }

def prepare_flow_matching_teacher(args, config):
    train_cfg = config.get("train", {})
    results_dir = train_cfg.get("results_dir", "results")
    best_teacher_dir = os.path.join(results_dir, "hpo_best_flow_matching_nfe_100")
    checkpoint = find_latest_checkpoint(best_teacher_dir)
    teacher_cfg = get_flow_teacher_config(config)

    teacher_model = ConditionalMLP(
        input_dim=2,
        hidden_dim=teacher_cfg["hidden_dim"],
        num_blocks=teacher_cfg["num_blocks"],
        time_emb_dim=teacher_cfg["time_emb_dim"],
        scale_factor=get_model_scale_factor("flow_matching"),
        time_channels=get_time_channels("flow_matching")
    )

    if checkpoint is None:
        raise FileNotFoundError(
            "Consistency Distillation 需要直接使用已 HPO 胜出的 "
            f"Flow Matching NFE=100 checkpoint，但在 {best_teacher_dir} 下没有找到 .pt 文件。"
            "请先重跑 flow_matching NFE=100 HPO；当前代码会在该 HPO 中保存 best checkpoint。"
        )

    state = torch.load(checkpoint, map_location="cpu")
    teacher_model.load_state_dict(state["model_state_dict"])
    teacher_model.eval()
    print(f"[*] 已加载 HPO best 100-step Flow Matching CD teacher: {checkpoint}")
    return teacher_model

def attach_cd_teacher_if_needed(algo_name, algo_instance, args, config, teacher_model=None):
    if algo_name != "consistency_models":
        return teacher_model
    if teacher_model is None:
        teacher_model = prepare_flow_matching_teacher(args, config)
    algo_instance.set_teacher_model(teacher_model)
    return teacher_model

def run_benchmark(args, config):
    # 1. 提取基础配置与数据集配置
    train_cfg = config.get("train", {})
    model_cfg = config.get("model", {})
    algo_cfg = config.get("algorithms", {})
    
    epochs = train_cfg.get("epochs", 200)
    batch_size = train_cfg.get("batch_size", 512)
    lr = float(train_cfg.get("lr", 1e-3))
    weight_decay = float(train_cfg.get("weight_decay", 1e-4))
    n_samples = train_cfg.get("n_samples", 20000)
    noise = train_cfg.get("noise", 0.0)
    turns = train_cfg.get("turns", 3.0)
    results_dir = train_cfg.get("results_dir", "results")
    
    # 自动生成 benchmark 专属文件夹，完全隔离并记录本次多算法评测的一切细节
    timestamp = time.strftime("%Y%m%d_%H%M%S", time.localtime())
    benchmark_dir = os.path.join(results_dir, f"benchmark_run_{timestamp}")
    os.makedirs(benchmark_dir, exist_ok=True)
    
    # 备份本次 benchmark 的配置文件 config.yaml
    if args.config and os.path.exists(args.config):
        shutil.copy(args.config, os.path.join(benchmark_dir, "config.yaml"))
        
    # 备份本次 benchmark 的源码
    src_backup_dir = os.path.join(benchmark_dir, "src")
    os.makedirs(src_backup_dir, exist_ok=True)
    for file in ["main.py", "trainer.py", "data_generator.py"]:
        if os.path.exists(file):
            shutil.copy(file, os.path.join(src_backup_dir, file))
    for folder in ["models", "algorithms"]:
        if os.path.exists(folder):
            shutil.copytree(folder, os.path.join(src_backup_dir, folder), dirs_exist_ok=True)
            
    print(f"[*] 已创建 Benchmark 专属实验目录: {benchmark_dir}，并成功备份配置与核心源码。")
    
    hidden_dim = model_cfg.get("hidden_dim", 256)
    num_blocks = model_cfg.get("num_blocks", 4)
    time_emb_dim = model_cfg.get("time_emb_dim", 256)
    
    print(f"[*] 开始进行一键多算法评测 (Epochs={epochs}, 数据集样本数={n_samples})...")
    dataset = ConchSpiralDataset(n_samples=n_samples, noise=noise, turns=turns)
    
    results_summary = {}
    generated_samples = {}
    loss_histories = {}
    cd_teacher_model = None
    
    # 算力守门员 (Budget Guardrail) 基准计算 —— 严格卡训练总计算量 (Training Total FLOPs)
    benchmark_ref_algo = train_cfg.get("budget_benchmark_algorithm", "flow_matching")
    global_h = model_cfg.get("hidden_dim", 256)
    global_b = model_cfg.get("num_blocks", 4)
    global_t = model_cfg.get("time_emb_dim", 256)
    ref_algo_params = algo_cfg.get(benchmark_ref_algo, {})
    ref_epochs = ref_algo_params.get("epochs", epochs)
    ref_h = ref_algo_params.get("hidden_dim", global_h)
    ref_b = ref_algo_params.get("num_blocks", global_b)
    ref_t = ref_algo_params.get("time_emb_dim", global_t)
    ref_time_channels = get_time_channels(benchmark_ref_algo)
    base_forward_flops = get_forward_flops(ref_h, ref_b, ref_t, ref_time_channels)
    # 单 batch 训练 NFE (Consistency Models 在 compute_loss 中前向 2 次，1次 online+backward 算 3, 1次 target 算 1, 共计 4 NFE; 其他算法前向 1 次+反向 2 次, 共计 3 NFE)
    ref_train_nfe = 4 if benchmark_ref_algo == "consistency_models" else 3
    num_batches = n_samples // batch_size
    target_flops = ref_epochs * num_batches * ref_train_nfe * base_forward_flops
    
    # 建立评测算法配置 (严格按照要求的时间顺序排列)
    ordered_algo_names = [
        "ddpm", 
        "ddim", 
        "avg_ddim",
        "vdm", 
        "v_learning", 
        "flow_matching", 
        "consistency_models", 
        "mean_flow"
    ]
    
    display_names = {
        "ddpm": "DDPM",
        "ddim": "DDIM",
        "avg_ddim": "Avg-DDIM",
        "vdm": "VDM",
        "v_learning": "V-Learning",
        "flow_matching": "Flow Matching",
        "consistency_models": "Consistency Models",
        "mean_flow": "MeanFlow"
    }
    
    BENCHMARK_CONFIGS = {}
    guardrail_rows = []
    has_warning = False
    
    for algo_name in ordered_algo_names:
        if algo_name in algo_cfg and algo_name in ALGORITHMS:
            # 复制一份，防止由于 pop 引起原有配置字典被污染
            kwargs = algo_cfg[algo_name].copy()
            
            # 提取算法专属模型参数，如果不存在则使用全局 model 配置进行 fallback
            algo_hidden_dim = kwargs.pop("hidden_dim", global_h)
            algo_num_blocks = kwargs.pop("num_blocks", global_b)
            algo_time_emb_dim = kwargs.pop("time_emb_dim", global_t)
            # 提取专属 epochs，否则 fallback 到全局训练 epochs
            algo_epochs = kwargs.pop("epochs", epochs)
            
            # 自动根据参数求得采样 NFE，作为不卡限制的指标进行记录
            nfe = kwargs.get("sample_steps", kwargs.get("num_steps", 1))
            
            # 计算该算法的训练总 FLOPs (Training Total FLOPs)
            algo_time_channels = get_time_channels(algo_name)
            algo_forward_flops = get_forward_flops(algo_hidden_dim, algo_num_blocks, algo_time_emb_dim, algo_time_channels)
            train_nfe = 4 if algo_name == "consistency_models" else 3
            algo_total_flops = algo_epochs * num_batches * train_nfe * algo_forward_flops
            err = (algo_total_flops - target_flops) / target_flops
            
            is_aligned = abs(err) <= 0.10
            status_str = "[PASS]" if is_aligned else "[WARN]"
            if not is_aligned:
                has_warning = True
                
            BENCHMARK_CONFIGS[algo_name] = {
                "class": ALGORITHMS[algo_name],
                "kwargs": kwargs,
                "nfe": nfe,
                "epochs": algo_epochs,
                "hidden_dim": algo_hidden_dim,
                "num_blocks": algo_num_blocks,
                "time_emb_dim": algo_time_emb_dim,
                "total_flops": algo_total_flops,
                "err": err,
                "display_name": display_names.get(algo_name, algo_name)
            }
            
            guardrail_rows.append((
                display_names.get(algo_name, algo_name),
                f"[{algo_hidden_dim}, {algo_num_blocks}]",
                algo_epochs,
                f"{algo_total_flops/1e9:.2f}G",
                f"{err:+.2%}",
                status_str
            ))
            
    # 打印算力守门员校验面板 —— 训练总算力校验
    print("\n" + "="*95)
    print("                           算力守门员 (Budget Guardrail) 训练算力校验看板")
    print("="*95)
    print(f"[*] 训练对齐基准: {benchmark_ref_algo} (使用尺寸 [{ref_h}, {ref_b}] | 训练Epochs={ref_epochs})")
    print(f"[*] 目标训练预算: {target_flops/1e9:.2f}G FLOPs")
    print("-"*95)
    print(f"| {'算法 (Algorithm)':<22} | {'模型尺寸 [H, B]':<13} | {'训练轮数(Epochs)':<16} | {'训练 FLOPs (G)':<16} | {'预算偏差':<10} | {'对齐状态':<8} |")
    print("-"*95)
    for row in guardrail_rows:
        print(f"| {row[0]:<22} | {row[1]:<13} | {row[2]:<16} | {row[3]:<16} | {row[4]:<10} | {row[5]:<8} |")
    print("-"*95)
    if has_warning:
        print("[!] 警告: 存在部分算法的训练计算量偏差超过 10%，这可能会影响巅峰性能公平对比，建议核准配置！")
    else:
        print("[OK] 恭喜: 所有算法的训练总计算量偏差均成功控制在 10.0% 以内！")
    print("="*95 + "\n")
            
    for algo_name, cfg in BENCHMARK_CONFIGS.items():
        print(f"\n" + "="*50)
        print(f"[*] 正在运行评估: {cfg['display_name']}")
        print("="*50)
        
        # 1. 重新实例化神经网络模型 (保证相互独立，并且优先支持专属配置)
        # 连续物理时间算法使用原始尺度，离散扩散类保留高频时间编码。
        model = ConditionalMLP(
            input_dim=2,
            hidden_dim=cfg["hidden_dim"],
            num_blocks=cfg["num_blocks"],
            time_emb_dim=cfg["time_emb_dim"],
            scale_factor=get_model_scale_factor(algo_name),
            time_channels=get_time_channels(algo_name)
        )
        
        # 2. 提取特定的 lr 和 weight_decay，实例化算法组件 (使用配置文件中的独有参数)
        algo_params = cfg["kwargs"].copy()
        algo_lr = float(algo_params.pop("lr", lr))
        algo_wd = float(algo_params.pop("weight_decay", weight_decay))
        algo_instance = cfg["class"](**algo_params)
        cd_teacher_model = attach_cd_teacher_if_needed(algo_name, algo_instance, args, config, cd_teacher_model)
        
        # 3. 初始化训练器 (将 benchmark_dir 传给 Trainer 作为根保存目录，各算法会生成各自带时间戳的子文件夹)
        trainer = Trainer(
            model=model,
            algorithm=algo_instance,
            dataset=dataset,
            batch_size=batch_size,
            lr=algo_lr,
            weight_decay=algo_wd,
            results_dir=benchmark_dir,
            algorithm_name=algo_name,
            config_path=args.config,
            backup_source=False
        )
        
        # 4. 统计训练时间并训练 (指定为 4 节点以在 benchmark 过程中保存中间进化绘图，不保存大体积 checkpoint)
        t_start = time.time()
        trainer.train(
            epochs=cfg["epochs"],
            plot_nodes=4,
            save_nodes=0
        )
        train_time = time.time() - t_start
        
        # 5. 统计采样并进行 5000 样本生成
        print(f"[*] {cfg['display_name']} 训练完成，开始进行 5000 样本反向采样评估...")
        t_sample_start = time.time()
        with torch.no_grad():
            samples = algo_instance.sample(trainer.model, n_samples=5000, device=trainer.device)
        sample_time = time.time() - t_sample_start
        print(f"[*] 采样生成完成！耗时: {sample_time:.4f} 秒。")
        
        # 5.5 计算真实一维流形逼近指标 (平均距离和覆盖率)
        avg_dist, uniformity, coverage = evaluate_manifold_metrics(
            samples, 
            turns=turns, 
            n_ref_samples=50000
        )
        print(f"[*] {cfg['display_name']} 指标评测: 双向倒角距离={avg_dist:.6f} | 覆盖率={coverage:.2%}")
        
        # 6. 收集数据
        generated_samples[algo_name] = samples.cpu().numpy()
        loss_histories[algo_name] = trainer.loss_history
        
        # 采样总 FLOPs = NFE * 该算法单个 forward 的计算量
        single_forward_flops = get_forward_flops(
            cfg["hidden_dim"],
            cfg["num_blocks"],
            cfg["time_emb_dim"],
            get_time_channels(algo_name)
        )
        total_sample_flops = cfg["nfe"] * single_forward_flops
        
        results_summary[algo_name] = {
            "display_name": cfg["display_name"],
            "train_time": train_time,
            "sample_time": sample_time,
            "final_loss": trainer.loss_history[-1] if trainer.loss_history else 0.0,
            "nfe": cfg["nfe"],
            "epochs": cfg["epochs"],
            "hidden_dim": cfg["hidden_dim"],
            "num_blocks": cfg["num_blocks"],
            "sample_flops_per_sample": total_sample_flops,
            "train_total_flops": cfg["total_flops"],
            "budget_deviation": cfg["err"],
            "params_count": sum(p.numel() for p in model.parameters() if p.requires_grad),
            "avg_dist": avg_dist,
            "uniformity": uniformity,
            "coverage": coverage
        }

    # 将 results_dir 重新定向为专属的 benchmark_dir，确保所有后续大图和汇总报告完全备份在该目录下
    results_dir = benchmark_dir

    # 7. 汇总绘图：2D分布对比 (2x4 大画幅)
    print(f"\n[*] 正在绘制 2D 生成分布对比大图 ({results_dir}/benchmark_comparison.png)...")
    total_panels = len(BENCHMARK_CONFIGS) + 1
    ncols = 4
    nrows = int(np.ceil(total_panels / ncols))
    fig, axes = plt.subplots(nrows, ncols, figsize=(5 * ncols, 5 * nrows))
    axes = axes.flatten()
    
    # 原始数据子集
    original_points = dataset.data.numpy()
    indices = np.random.choice(len(original_points), size=min(5000, len(original_points)), replace=False)
    original_subset = original_points[indices]
    
    # 绘制原始数据
    axes[0].scatter(original_subset[:, 0], original_subset[:, 1], s=1.5, alpha=0.5, color='royalblue')
    axes[0].set_title("Original Dataset (Conch Spiral)", fontsize=13, fontweight='bold')
    axes[0].set_xlim(-1.5, 1.5)
    axes[0].set_ylim(-1.5, 1.5)
    axes[0].axhline(0, color='black', linewidth=0.5, ls='--')
    axes[0].axvline(0, color='black', linewidth=0.5, ls='--')
    axes[0].grid(True, alpha=0.3)
    
    colors = ['crimson', 'forestgreen', 'darkorange', 'mediumpurple', 'chocolate', 'teal', 'deeppink']
    for idx, (algo_name, cfg) in enumerate(BENCHMARK_CONFIGS.items()):
        ax = axes[idx + 1]
        pts = generated_samples[algo_name]
        ax.scatter(pts[:, 0], pts[:, 1], s=1.5, alpha=0.5, color=colors[idx % len(colors)])
        res = results_summary[algo_name]
        ax.set_title(
            f"{cfg['display_name']} (NFE={cfg['nfe']})\n"
            f"Dist: {res['avg_dist']:.4f}", 
            fontsize=11, fontweight='bold'
        )
        ax.set_xlim(-1.5, 1.5)
        ax.set_ylim(-1.5, 1.5)
        ax.axhline(0, color='black', linewidth=0.5, ls='--')
        ax.axvline(0, color='black', linewidth=0.5, ls='--')
        ax.grid(True, alpha=0.3)
        
    # 隐藏未使用的子图
    for i in range(len(BENCHMARK_CONFIGS) + 1, len(axes)):
        axes[i].axis('off')
        
    plt.suptitle(f"Algorithm Generation Quality Comparison (Epochs={epochs})", fontsize=16, fontweight='bold', y=0.98)
    plt.tight_layout()
    comparison_path = os.path.join(results_dir, "benchmark_comparison.png")
    plt.savefig(comparison_path, dpi=200, bbox_inches='tight')
    plt.close()
    
    # 8. 汇总绘图：Loss 曲线对比
    print(f"[*] 正在绘制多算法 Loss 变化对比折线图 ({results_dir}/loss_comparison.png)...")
    plt.figure(figsize=(10, 6))
    for algo_name, cfg in BENCHMARK_CONFIGS.items():
        plt.plot(loss_histories[algo_name], label=cfg["display_name"], alpha=0.8, linewidth=1.5)
    plt.title(f"Training Loss Comparison Curve (Epochs={epochs})", fontsize=14, fontweight='bold')
    plt.xlabel("Epoch", fontsize=11)
    plt.ylabel("Loss (Symmetric Log Scale)", fontsize=11)
    plt.yscale("symlog", linthresh=0.01)
    plt.grid(True, alpha=0.3)
    plt.legend(fontsize=10)
    plt.tight_layout()
    loss_path = os.path.join(results_dir, "loss_comparison.png")
    plt.savefig(loss_path, dpi=150)
    plt.close()
    
    # 9. 汇总绘图：多维性能与分布质量指标柱状图 (2x2 大画幅，不含 unif 指标)
    print(f"[*] 正在绘制算法多维性能与分布质量指标对比图 ({results_dir}/metrics_comparison.png)...")
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    algos = [cfg["display_name"] for cfg in BENCHMARK_CONFIGS.values()]
    train_times = [results_summary[algo]["train_time"] for algo in BENCHMARK_CONFIGS]
    sample_times = [results_summary[algo]["sample_time"] for algo in BENCHMARK_CONFIGS]
    
    avg_dists = [results_summary[algo]["avg_dist"] for algo in BENCHMARK_CONFIGS]
    coverages = [results_summary[algo]["coverage"] * 100.0 for algo in BENCHMARK_CONFIGS]
    
    y_pos = np.arange(len(algos))
    
    # (0, 0): 训练总耗时
    axes[0, 0].barh(y_pos, train_times, color='cornflowerblue', alpha=0.8, edgecolor='black')
    axes[0, 0].set_yticks(y_pos)
    axes[0, 0].set_yticklabels(algos, fontsize=10, fontweight='bold')
    axes[0, 0].invert_yaxis()
    axes[0, 0].set_xlabel("Time (seconds)", fontsize=11)
    axes[0, 0].set_title(f"Total Training Time ({epochs} Epochs)", fontsize=12, fontweight='bold')
    axes[0, 0].grid(True, axis='x', alpha=0.3)
    
    # (0, 1): 采样总耗时
    axes[0, 1].barh(y_pos, sample_times, color='salmon', alpha=0.8, edgecolor='black')
    axes[0, 1].set_yticks(y_pos)
    axes[0, 1].set_yticklabels([])
    axes[0, 1].invert_yaxis()
    axes[0, 1].set_xlabel("Time (seconds)", fontsize=11)
    axes[0, 1].set_title("Sampling Time (5000 Samples)", fontsize=12, fontweight='bold')
    axes[0, 1].grid(True, axis='x', alpha=0.3)
    
    # (1, 0): 双向倒角距离 (Chamfer Distance)
    axes[1, 0].barh(y_pos, avg_dists, color='orchid', alpha=0.8, edgecolor='black')
    axes[1, 0].set_yticks(y_pos)
    axes[1, 0].set_yticklabels(algos, fontsize=10, fontweight='bold')
    axes[1, 0].invert_yaxis()
    axes[1, 0].set_xlabel("Chamfer Distance (lower is better)", fontsize=11)
    axes[1, 0].set_title("Chamfer Distance (lower is better)", fontsize=12, fontweight='bold')
    axes[1, 0].grid(True, axis='x', alpha=0.3)
    
    # (1, 1): 流形覆盖率
    axes[1, 1].barh(y_pos, coverages, color='turquoise', alpha=0.8, edgecolor='black')
    axes[1, 1].set_yticks(y_pos)
    axes[1, 1].set_yticklabels([])
    axes[1, 1].invert_yaxis()
    axes[1, 1].set_xlim(0.0, 100.0)
    axes[1, 1].set_xlabel("Coverage Percentage (higher is better)", fontsize=11)
    axes[1, 1].set_title("Manifold Coverage Ratio (%)", fontsize=12, fontweight='bold')
    axes[1, 1].grid(True, axis='x', alpha=0.3)
    
    plt.suptitle("Algorithm Performance, Efficiency & Generation Quality Metrics (Excluding Uniformity)", fontsize=15, fontweight='bold', y=0.98)
    plt.tight_layout()
    metrics_path = os.path.join(results_dir, "metrics_comparison.png")
    plt.savefig(metrics_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    # 10. 打印评测 Markdown 汇总表格
    print("\n" + "="*128)
    print("                                     第五阶段：各生成算法多维性能 and 分布质量一键评测报告")
    print("="*128)
    header = f"| {'算法 (Algorithm)':<22} | {'专属尺寸':<8} | {'训练轮数':<8} | {'训练FLOPs(G)':<12} | {'采样NFE':<7} | {'单样本FLOPs(M)':<14} | {'训练算力偏差':<12} | {'最终Loss':<11} | {'倒角距离':<10} | {'覆盖率':<8} |"
    print(header)
    print("|" + "-"*24 + "|" + "-"*10 + "|" + "-"*10 + "|" + "-"*15 + "|" + "-"*9 + "|" + "-"*16 + "|" + "-"*14 + "|" + "-"*13 + "|" + "-"*12 + "|" + "-"*10 + "|")
    for algo_name, res in results_summary.items():
        size_str = f"{res['hidden_dim']}x{res['num_blocks']}"
        line = f"| {res['display_name']:<22} | {size_str:<8} | {res['epochs']:<8} | {res['train_total_flops']/1e9:<12.2f} | {res['nfe']:<7} | {res['sample_flops_per_sample']/1e6:<14.2f} | {res['budget_deviation']:+12.2%} | {res['final_loss']:<11.6f} | {res['avg_dist']:<10.6f} | {res['coverage']:<8.2%} |"
        print(line)
    print("="*140)
    
    # 11. 写入 benchmark_report.md 报告
    report_path = os.path.join(results_dir, "benchmark_report.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# 第五阶段：二维生成模型算法评测 benchmark 报告 (巅峰性能对决)\n\n")
        f.write(f"本次评测运行于：{time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}。\n")
        f.write(f"所有算法均在 **算力守门员 (Budget Guardrail)** 严格控制 **总训练计算量** 偏差在 $\\pm 10\\%$ 内的配置下，相互独立进行极限调优后的巅峰对决。\n\n")
        f.write("## 1. 性能与分布质量指标对比汇总表\n\n")
        f.write("| 算法 (Algorithm) | 专属尺寸 (H x B) | 训练轮数 (Epochs) | 训练总 FLOPs | 采样 NFE (步) | 单样本生成 FLOPs | 训练算力偏差 | 最终 Loss | 双向倒角距离 (Chamfer Dist) | 流形覆盖率 (Coverage) | 模型参数量 (Params) |\n")
        f.write("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n")
        for algo_name, res in results_summary.items():
            f.write(f"| **{res['display_name']}** | {res['hidden_dim']}x{res['num_blocks']} | {res['epochs']} | {res['train_total_flops']/1e9:.2f}G | {res['nfe']} | {res['sample_flops_per_sample']/1e6:.2f}M | {res['budget_deviation']:+.2%} | {res['final_loss']:.6f} | {res['avg_dist']:.6f} | {res['coverage']:.2%} | {res['params_count']:,} |\n")
        f.write("\n")
        f.write("## 2. 可视化生成图表说明\n\n")
        f.write("- **算法生成数据分布对比**：详见 `results/benchmark_comparison.png`，直观比较各算法对于 2D “海螺线” 复杂非线性流形的逼近 and 拟合效果。\n")
        f.write("- **Loss 曲线对比图**：详见 `results/loss_comparison.png`，展示不同算法的收敛速度和收敛平稳度。\n")
        f.write("- **训练与采样效率指标直方图**：详见 `results/metrics_comparison.png`，整合了耗时、倒角距离和区间覆盖率，多维度综合对比。\n\n")
        f.write("## 3. 评测指标解释\n\n")
        f.write("1. **双向倒角距离 (Chamfer Distance)**: 即（生成->真实）最短距离均值与（真实->生成）最短距离均值的加和，兼顾生成样本真实感与分布完整度（防止模式坍缩），越小越好。\n")
        f.write("2. **流形覆盖率 (Coverage)**: 投影一维流形 100 个等宽区间中，有多少比例 of 区间包含至少一个生成的投影点。用来度量模型是否有“断点”、“空洞”或未覆盖区域，越接近 100% 说明模型生成的流形越完整。\n")
    print(f"[*] 精美 Benchmark 评估 Markdown 报告已成功输出 to: {report_path}\n")

def run_hpo(args, config):
    import optuna
    import copy
    # 禁用 optuna 的繁琐日志
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    if args.hpo_repeats < 1:
        raise ValueError("--hpo_repeats 必须 >= 1")
    
    train_cfg = config.get("train", {})
    model_cfg = config.get("model", {})
    algo_cfg = config.get("algorithms", {})
    
    epochs = train_cfg.get("epochs", 200)
    batch_size = train_cfg.get("batch_size", 512)
    lr = float(train_cfg.get("lr", 1e-3))
    weight_decay = float(train_cfg.get("weight_decay", 1e-4))
    n_samples = train_cfg.get("n_samples", 20000)
    noise = train_cfg.get("noise", 0.0)
    turns = train_cfg.get("turns", 3.0)
    results_dir = train_cfg.get("results_dir", "results")
    
    print("\n" + "="*80)
    print(f"            [HPO] 启动成本感知自动超参优化 | 目标算法: {args.algorithm.upper()}")
    if args.fixed_sample_steps is not None:
        print(f"            [HPO] 固定推理采样步数/NFE: {args.fixed_sample_steps}")
    print(f"            [HPO] 随机种子: {args.seed} | 每个 Trial 重复次数: {args.hpo_repeats}")
    print("="*80)
    
    # 2. 计算基准算力预算 (Target Training FLOPs)
    benchmark_ref_algo = train_cfg.get("budget_benchmark_algorithm", "flow_matching")
    global_h = model_cfg.get("hidden_dim", 256)
    global_b = model_cfg.get("num_blocks", 4)
    global_t = model_cfg.get("time_emb_dim", 256)
    ref_algo_params = algo_cfg.get(benchmark_ref_algo, {})
    ref_epochs = ref_algo_params.get("epochs", epochs)
    ref_h = ref_algo_params.get("hidden_dim", global_h)
    ref_b = ref_algo_params.get("num_blocks", global_b)
    ref_t = ref_algo_params.get("time_emb_dim", global_t)
    ref_time_channels = get_time_channels(benchmark_ref_algo)
    base_forward_flops = get_forward_flops(ref_h, ref_b, ref_t, ref_time_channels)
    ref_train_nfe = 4 if benchmark_ref_algo == "consistency_models" else 3
    num_batches = n_samples // batch_size
    target_flops = ref_epochs * num_batches * ref_train_nfe * base_forward_flops
    
    print(f"[*] 训练对齐基准算法: {benchmark_ref_algo}")
    print(f"[*] 基准网络尺寸: [hidden_dim: {ref_h} | num_blocks: {ref_b} | epochs: {ref_epochs}]")
    print(f"[*] 目标训练计算量预算: {target_flops/1e9:.2f}G FLOPs (HPO 期间所有模型将严格配平至此训练总算力)")
    print("-"*80)
    
    algorithm_class = ALGORITHMS[args.algorithm]
    algo_params_base = algo_cfg.get(args.algorithm, {}).copy()
    
    # 移除可能产生覆盖冲突的参数
    for k in ["hidden_dim", "num_blocks", "time_emb_dim", "epochs", "lr", "weight_decay"]:
        algo_params_base.pop(k, None)
        
    # 使用稳定目录承载同一个算法/NFE 的 HPO，便于中断后继续与审计历史 trial。
    nfe_suffix = f"_nfe_{args.fixed_sample_steps}" if args.fixed_sample_steps is not None else ""
    hpo_session_dir = os.path.join(results_dir, f"hpo_run_{args.algorithm}{nfe_suffix}")
    optuna_dir = os.path.join(results_dir, "optuna_studies")
    os.makedirs(optuna_dir, exist_ok=True)
    study_name = f"{args.algorithm}{nfe_suffix}"
    storage_path = os.path.abspath(os.path.join(optuna_dir, f"{study_name}.db"))
    storage_url = f"sqlite:///{storage_path.replace(os.sep, '/')}"
    trial_results_path = os.path.join(hpo_session_dir, "trial_results.jsonl")
    if args.reset_study:
        if os.path.exists(storage_path):
            os.remove(storage_path)
            print(f"[*] 已重置 Optuna Study 数据库: {storage_path}")
        if os.path.exists(hpo_session_dir):
            shutil.rmtree(hpo_session_dir)
            print(f"[*] 已清空 HPO trial 档案目录: {hpo_session_dir}")
    os.makedirs(hpo_session_dir, exist_ok=True)
    print(f"[*] HPO 实验母文件夹: {hpo_session_dir}")
    print(f"[*] Optuna 持久化数据库: {storage_path}")
    print("-"*80)
    cd_teacher_model = None
    if args.algorithm == "consistency_models":
        cd_teacher_model = prepare_flow_matching_teacher(args, config)
        
    def objective(trial):
        # A. 采样网络超参
        hidden_dim = trial.suggest_categorical("hidden_dim", [128, 192, 256, 384, 512])
        num_blocks = trial.suggest_int("num_blocks", 2, 6)
        time_emb_dim = hidden_dim # 保持时间嵌入维度与隐藏层维度一致
        
        # B. 采样优化超参（算力无关参数，对流形收敛至关重要！）
        trial_lr = trial.suggest_float("lr", 1e-5, 5e-3, log=True)
        trial_wd = trial.suggest_float("weight_decay", 1e-8, 1e-2, log=True)
        trial_algo_params = algo_params_base.copy()

        if args.algorithm == "ddpm":
            if args.fixed_sample_steps is None:
                trial_algo_params["num_steps"] = trial.suggest_categorical("num_steps", [50, 80, 100, 150])
            trial_algo_params["beta_start"] = trial.suggest_float("beta_start", 1e-6, 1e-3, log=True)
            trial_algo_params["beta_end"] = trial.suggest_float("beta_end", 0.03, 0.3, log=True)
            trial_algo_params["variance_type"] = "fixed_geometric"
        elif args.algorithm in ["ddim", "avg_ddim"]:
            if args.fixed_sample_steps is None:
                trial_num_steps = trial.suggest_categorical("num_steps", [50, 80, 100, 150])
                trial_sample_ratio = trial.suggest_categorical("sample_step_ratio", [0.5, 0.8, 1.0])
                trial_algo_params["num_steps"] = trial_num_steps
                trial_algo_params["sample_steps"] = max(1, int(trial_num_steps * trial_sample_ratio))
            trial_algo_params["eta"] = 0.0
            trial_algo_params["beta_start"] = trial.suggest_float("beta_start", 1e-6, 1e-3, log=True)
            trial_algo_params["beta_end"] = trial.suggest_float("beta_end", 0.03, 0.3, log=True)
            if args.algorithm == "avg_ddim":
                trial_algo_params.setdefault("avg_k", 30)
                trial_algo_params.setdefault("gaussian_candidate_sampling", False)
                trial_algo_params.setdefault("gaussian_candidate_std", 0.3)
                trial_algo_params.setdefault("gaussian_candidate_proposals", 1024)
        elif args.algorithm == "vdm":
            if args.fixed_sample_steps is None:
                trial_algo_params["num_steps"] = trial.suggest_categorical("num_steps", [50, 80, 100, 150])
            trial_algo_params["sigma_min"] = 0.002
            trial_algo_params["sigma_max"] = 80.0
            trial_algo_params["p_mean"] = trial.suggest_float("p_mean", -1.5, -1.0)
            trial_algo_params["p_std"] = trial.suggest_float("p_std", 1.0, 1.6)
            trial_algo_params["loss_weighting"] = "edm_weighting"
            trial_algo_params["sampler_rho"] = 7.0
        elif args.algorithm == "v_learning":
            if args.fixed_sample_steps is None:
                trial_num_steps = trial.suggest_categorical("num_steps", [50, 80, 100, 150])
                trial_sample_ratio = trial.suggest_categorical("sample_step_ratio", [0.5, 0.8, 1.0])
                trial_algo_params["num_steps"] = trial_num_steps
                trial_algo_params["sample_steps"] = max(1, int(trial_num_steps * trial_sample_ratio))
            trial_algo_params["eta"] = 0.0
            trial_algo_params["beta_start"] = trial.suggest_float("beta_start", 1e-6, 1e-3, log=True)
            trial_algo_params["beta_end"] = trial.suggest_float("beta_end", 0.03, 0.3, log=True)
        elif args.algorithm == "flow_matching":
            if args.fixed_sample_steps is None:
                trial_algo_params["num_steps"] = trial.suggest_categorical("num_steps", [20, 50, 80, 100])
        elif args.algorithm == "consistency_models":
            if args.fixed_sample_steps is None:
                trial_algo_params["num_steps"] = trial.suggest_categorical("num_steps", [8, 16, 32, 50])
                trial_algo_params["sample_steps"] = trial.suggest_categorical("sample_steps", [1, 3, 5])
            ema_decay_gap = trial.suggest_float("ema_decay_gap", 1e-3, 1e-1, log=True)
            trial_algo_params["ema_decay"] = 1.0 - ema_decay_gap
            trial_algo_params["sigma_data"] = trial.suggest_float("sigma_data", 0.2, 1.0)
            trial_algo_params["sigma_max"] = 1.0
            trial_algo_params["distillation_steps"] = 100
            trial_algo_params["training_mode"] = "cd"
        elif args.algorithm == "mean_flow":
            trial_algo_params["p"] = trial.suggest_categorical("p", [0.0, 0.5, 1.0])
            trial_algo_params["c"] = trial.suggest_float("c", 1e-4, 1e-2, log=True)
            if args.fixed_sample_steps is None:
                trial_algo_params["num_steps"] = trial.suggest_categorical("num_steps", [1, 2, 5, 8])
            trial_algo_params["interval_sampling"] = trial.suggest_categorical(
                "interval_sampling",
                ["uniform_interval", "mixed_full"]
            )
            trial_algo_params["full_interval_prob"] = trial.suggest_categorical(
                "full_interval_prob",
                [0.1, 0.25, 0.5]
            )
            trial_algo_params["warmup_ratio"] = trial.suggest_categorical(
                "warmup_ratio",
                [0.2, 0.35, 0.5]
            )
            trial_algo_params["jvp_ramp_ratio"] = trial.suggest_categorical(
                "jvp_ramp_ratio",
                [0.25, 0.35, 0.5]
            )
            trial_algo_params["max_jvp_weight"] = trial.suggest_categorical(
                "max_jvp_weight",
                [0.25, 0.5, 1.0]
            )
            
        trial_algo_params = apply_fixed_sample_steps(args.algorithm, trial_algo_params, args.fixed_sample_steps)
        
        # C. 训练算力自动对齐配平（根据采样大小，自动精准求得等效 epochs）
        single_forward_flops = get_forward_flops(
            hidden_dim,
            num_blocks,
            time_emb_dim,
            get_time_channels(args.algorithm)
        )
        train_nfe = 4 if args.algorithm == "consistency_models" else 3
        
        # 配平 epochs = target_flops / (num_batches * train_nfe * single_forward_flops)
        algo_epochs = int(target_flops / (num_batches * train_nfe * single_forward_flops))
        algo_epochs = min(1000, max(5, algo_epochs)) # 设定安全下限 5，上限 1000
        
        # 实际该 Trial 所占用的训练 FLOPs
        trial_flops = algo_epochs * num_batches * train_nfe * single_forward_flops
        deviation = (trial_flops - target_flops) / target_flops
        
        print(f"\n[Trial {trial.number:02d}] 正在评估网络: [{hidden_dim} 宽 x {num_blocks} 残差块] (单步前向: {single_forward_flops/1e6:.2f}M FLOPs)")
        print(f"           - 算力自适应配平训练 Epochs : {algo_epochs}")
        print(f"           - 对应实际等效总训练计算量  : {trial_flops/1e9:.2f}G FLOPs (算力偏差: {deviation:+.2%})")
        print(f"           - 采样优化器超参数组合      : lr = {trial_lr:.6e} | weight_decay = {trial_wd:.6e}")
        if trial_algo_params:
            print(f"           - 算法特有参数              : {trial_algo_params}")
        
        # D. 在 HPO 母文件夹下，为当前 Trial 创建专属子目录
        trial_results_dir = os.path.join(hpo_session_dir, f"trial_{trial.number:02d}")
        os.makedirs(trial_results_dir, exist_ok=True)

        repeat_dists = []
        try:
            for repeat_idx in range(args.hpo_repeats):
                repeat_seed = args.seed + trial.number * 1000 + repeat_idx
                set_global_seed(repeat_seed)
                repeat_results_dir = os.path.join(trial_results_dir, f"seed_{repeat_seed}")
                os.makedirs(repeat_results_dir, exist_ok=True)
                
                dataset = ConchSpiralDataset(n_samples=n_samples, noise=noise, turns=turns)
                model = ConditionalMLP(
                    input_dim=2,
                    hidden_dim=hidden_dim,
                    num_blocks=num_blocks,
                    time_emb_dim=time_emb_dim,
                    scale_factor=get_model_scale_factor(args.algorithm),
                    time_channels=get_time_channels(args.algorithm)
                )
                algo_instance = algorithm_class(**trial_algo_params)
                
                trainer = Trainer(
                    model=model,
                    algorithm=algo_instance,
                    dataset=dataset,
                    batch_size=batch_size,
                    lr=trial_lr,
                    weight_decay=trial_wd,
                    results_dir=repeat_results_dir,
                    algorithm_name=args.algorithm,
                    config_path=args.config,
                    backup_source=False,
                    seed=repeat_seed
                )
                attach_cd_teacher_if_needed(args.algorithm, algo_instance, args, config, cd_teacher_model)
                
                hpo_save_nodes = 1 if args.algorithm == "flow_matching" and args.fixed_sample_steps == 100 else 0
                trainer.train(epochs=algo_epochs, plot_nodes=4, save_nodes=hpo_save_nodes)
                if not trainer.loss_history or not np.isfinite(trainer.loss_history[-1]):
                    raise FloatingPointError(f"训练 Loss 非有限值: {trainer.loss_history[-1] if trainer.loss_history else 'empty'}")
                
                set_global_seed(repeat_seed + 500000)
                with torch.no_grad():
                    samples = algo_instance.sample(trainer.model, n_samples=5000, device=trainer.device)
                if not torch.isfinite(samples).all():
                    raise FloatingPointError("采样结果包含 NaN 或 Inf")
                    
                avg_dist, _, _ = evaluate_manifold_metrics(samples, turns=turns, n_ref_samples=50000)
                if not np.isfinite(avg_dist):
                    raise FloatingPointError(f"评估指标非有限值: {avg_dist}")
                repeat_dists.append(avg_dist)
                print(f"[Trial {trial.number:02d} | Seed {repeat_seed}] 评估结果 | 双向倒角距离 (Chamfer Dist) = {avg_dist:.6f}")
        except Exception as exc:
            penalty = 1e6
            trial.set_user_attr("failure_reason", repr(exc))
            trial.set_user_attr("algo_params", copy.deepcopy(trial_algo_params))
            trial.set_user_attr("epochs", algo_epochs)
            trial.set_user_attr("fixed_sample_steps", args.fixed_sample_steps)
            trial_record = {
                "time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
                "trial": trial.number,
                "algorithm": args.algorithm,
                "fixed_sample_steps": args.fixed_sample_steps,
                "seed_base": args.seed,
                "status": "failed",
                "failure_reason": repr(exc),
                "penalty": penalty,
                "epochs": algo_epochs,
                "hidden_dim": hidden_dim,
                "num_blocks": num_blocks,
                "time_emb_dim": time_emb_dim,
                "lr": trial_lr,
                "weight_decay": trial_wd,
                "algo_params": trial_algo_params,
                "train_flops": trial_flops,
                "budget_deviation": deviation,
            }
            with open(trial_results_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(trial_record, ensure_ascii=False) + "\n")
            print(f"[Trial {trial.number:02d}] 失败并标记为 PRUNED，不计入成功 HPO 结果: {exc!r}")
            raise optuna.TrialPruned(f"trial failed: {exc!r}")
        
        mean_dist = float(np.mean(repeat_dists))
        trial.set_user_attr("repeat_distances", repeat_dists)
        trial.set_user_attr("algo_params", copy.deepcopy(trial_algo_params))
        trial.set_user_attr("epochs", algo_epochs)
        trial.set_user_attr("fixed_sample_steps", args.fixed_sample_steps)
        trial_record = {
            "time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            "trial": trial.number,
            "algorithm": args.algorithm,
            "fixed_sample_steps": args.fixed_sample_steps,
            "seed_base": args.seed,
            "repeat_distances": repeat_dists,
            "mean_dist": mean_dist,
            "epochs": algo_epochs,
            "hidden_dim": hidden_dim,
            "num_blocks": num_blocks,
            "time_emb_dim": time_emb_dim,
            "lr": trial_lr,
            "weight_decay": trial_wd,
            "algo_params": trial_algo_params,
            "train_flops": trial_flops,
            "budget_deviation": deviation,
        }
        with open(trial_results_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(trial_record, ensure_ascii=False) + "\n")
        print(f"[Trial {trial.number:02d}] 平均评估结果 | Mean Chamfer Distance = {mean_dist:.6f}")
        
        return mean_dist # 优化目标不变：平均流形距离越小越好
        
    # 采用性能最强、最成熟的贝叶斯树状帕森估计器采样器 (TPE Sampler)
    set_global_seed(args.seed)
    study = optuna.create_study(
        direction="minimize",
        sampler=optuna.samplers.TPESampler(seed=args.seed),
        study_name=study_name,
        storage=storage_url,
        load_if_exists=True
    )
    def get_successful_trials():
        successful = []
        for t in study.get_trials(deepcopy=False):
            if t.state != optuna.trial.TrialState.COMPLETE:
                continue
            if t.user_attrs.get("failure_reason") is not None:
                continue
            if t.value is None or not np.isfinite(t.value) or t.value >= 1e6:
                continue
            successful.append(t)
        return successful

    successful_trials = get_successful_trials()
    remaining_trials = max(0, args.hpo_trials - len(successful_trials))
    print(f"[*] 已成功完成 Trial 数: {len(successful_trials)} / 目标总数: {args.hpo_trials}，本次还需运行: {remaining_trials}")
    if remaining_trials > 0:
        study.optimize(objective, n_trials=remaining_trials)
    else:
        print("[*] 当前 Study 已达到目标 Trial 数，直接整理已有最优结果。")
        
    successful_trials = get_successful_trials()
    if not successful_trials:
        raise RuntimeError("当前 Study 尚无成功完成的 Trial，拒绝生成最佳报告，避免失败 trial 污染矩阵。")
    if len(successful_trials) < args.hpo_trials:
        print(f"[!] 警告: 当前只有 {len(successful_trials)} 个成功 Trial，少于目标 {args.hpo_trials}。失败/剪枝 Trial 未计入最佳报告。")
    best_trial = min(successful_trials, key=lambda t: t.value)
    
    # J. HPO 最终结果整理：选最优并复制到稳定 best 目录，保留完整 trial 档案用于断点继续。
    best_trial_num = best_trial.number
    print(f"\n[*] 正在进行 HPO 最终结果整理和清理：最优组为 Trial {best_trial_num}")
    
    best_trial_exp_dir = os.path.join(hpo_session_dir, f"trial_{best_trial_num:02d}")
    best_persistent_dir = os.path.join(results_dir, f"hpo_best_{args.algorithm}{nfe_suffix}")
    
    if os.path.exists(best_persistent_dir):
        shutil.rmtree(best_persistent_dir)
    os.makedirs(best_persistent_dir, exist_ok=True)
    
    if os.path.exists(best_trial_exp_dir):
        shutil.copytree(best_trial_exp_dir, best_persistent_dir, dirs_exist_ok=True)
        print(f"[OK] 已将最强 Trial {best_trial_num} 的所有重复实验档案备份至: {best_persistent_dir}")
            
    print(f"[OK] HPO Trial 档案已保留在: {hpo_session_dir}，后续重跑同一算法/NFE 会基于该目录与 SQLite Study 继续。")
    
    print("\n" + "="*80)
    print("                       [SUCCESS] 自动成本感知 HPO 调优对决圆满结束")
    print("="*80)
    print(f"[*] 目标算法  : {args.algorithm.upper()}")
    if args.fixed_sample_steps is not None:
        print(f"[*] 固定 NFE  : {args.fixed_sample_steps}")
    print(f"[*] 最佳试验组 : Trial {best_trial.number}")
    print(f"[*] 最佳倒角距离 (Chamfer Distance): {best_trial.value:.6f}")
    print(f"[*] 调出极限参数组合:")
    for k, v in best_trial.params.items():
        if k in ["lr", "weight_decay"]:
            print(f"    - {k:<15} : {v:.6e}")
        else:
            print(f"    - {k:<15} : {v}")
            
    # 计算最佳尺寸下的等效配平 epochs 轮数
    opt_h = best_trial.params["hidden_dim"]
    opt_b = best_trial.params["num_blocks"]
    opt_single_flops = get_forward_flops(opt_h, opt_b, opt_h, get_time_channels(args.algorithm))
    train_nfe = 4 if args.algorithm == "consistency_models" else 3
    opt_epochs = int(target_flops / (num_batches * train_nfe * opt_single_flops))
    opt_epochs = min(1000, max(5, opt_epochs))
    print(f"    - 最佳配平训练轮数 (Epochs): {opt_epochs}")
    best_algo_params = best_trial.user_attrs.get("algo_params", {})
    if best_algo_params:
        print(f"    - 固定/算法参数: {best_algo_params}")
    print("="*80 + "\n")
    
    # 写入专属 HPO 最佳超参报告中
    os.makedirs(results_dir, exist_ok=True)
    hpo_report_path = os.path.join(results_dir, f"hpo_best_report_{args.algorithm}{nfe_suffix}.txt")
    with open(hpo_report_path, "w", encoding="utf-8") as f:
        f.write(f"=== {args.algorithm.upper()} 自动成本感知贝叶斯调参巅峰报告 ===\n")
        f.write(f"调参结束时间: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}\n")
        if args.fixed_sample_steps is not None:
            f.write(f"固定推理采样步数 / NFE: {args.fixed_sample_steps}\n")
        f.write(f"随机种子基准: {args.seed}\n")
        f.write(f"每个 Trial 重复次数: {args.hpo_repeats}\n")
        f.write(f"目标算力天花板预算: {target_flops/1e9:.2f}G FLOPs\n")
        f.write(f"最佳双向倒角距离 (Chamfer Dist): {best_trial.value:.6f}\n\n")
        f.write(f"最佳极限超参组合:\n")
        f.write(f"  hidden_dim        : {opt_h}\n")
        f.write(f"  num_blocks        : {opt_b}\n")
        f.write(f"  time_emb_dim      : {opt_h}\n")
        f.write(f"  epochs (自适应配平): {opt_epochs}\n")
        f.write(f"  lr                : {best_trial.params['lr']:.6e}\n")
        f.write(f"  weight_decay      : {best_trial.params['weight_decay']:.6e}\n")
        for k, v in best_algo_params.items():
            f.write(f"  {k:<18}: {v}\n")
        for k, v in best_trial.params.items():
            if k in ["hidden_dim", "num_blocks", "lr", "weight_decay"]:
                continue
            f.write(f"  {k:<18}: {v}\n")
        repeat_dists = best_trial.user_attrs.get("repeat_distances", [])
        if repeat_dists:
            f.write(f"\n重复实验距离明细: {repeat_dists}\n")
    print(f"[*] 极限超参结果报告已成功保存至: {hpo_report_path}\n")

def main():
    args = get_args()
    set_global_seed(args.seed)
    config = load_config(args.config)
    
    # 提取并整合配置与参数
    train_cfg = config.get("train", {})
    model_cfg = config.get("model", {})
    algo_cfg = config.get("algorithms", {})
    
    epochs = train_cfg.get("epochs", 200)
    batch_size = train_cfg.get("batch_size", 512)
    lr = float(train_cfg.get("lr", 1e-3))
    weight_decay = float(train_cfg.get("weight_decay", 1e-4))
    n_samples = train_cfg.get("n_samples", 20000)
    noise = train_cfg.get("noise", 0.0)
    turns = train_cfg.get("turns", 3.0)
    plot_nodes = train_cfg.get("plot_nodes", 10)
    save_nodes = train_cfg.get("save_nodes", 4)
    checkpoint_dir = train_cfg.get("checkpoint_dir", "checkpoints")
    results_dir = train_cfg.get("results_dir", "results")
    
    hidden_dim = model_cfg.get("hidden_dim", 256)
    num_blocks = model_cfg.get("num_blocks", 4)
    time_emb_dim = model_cfg.get("time_emb_dim", 256)
    
    if args.mode == "benchmark":
        run_benchmark(args, config)
        return
    elif args.mode == "hpo":
        run_hpo(args, config)
        return
        
    # 1. 准备数据集
    print(f"[*] 正在加载海螺线数据集 (点数={n_samples}, 噪声={noise}, 圈数={turns})...")
    dataset = ConchSpiralDataset(n_samples=n_samples, noise=noise, turns=turns)
    
    # 2. 提取并实例化算法组件的参数，同时处理算法专属模型架构（若有）
    print(f"[*] 正在提取算法组件配置: {args.algorithm}...")
    algorithm_class = ALGORITHMS[args.algorithm]
    algo_params = algo_cfg.get(args.algorithm, {}).copy()
    
    # 优先采用算法特定配置的模型参数，否则 fallback 到全局 model 配置
    algo_hidden_dim = algo_params.pop("hidden_dim", hidden_dim)
    algo_num_blocks = algo_params.pop("num_blocks", num_blocks)
    algo_time_emb_dim = algo_params.pop("time_emb_dim", time_emb_dim)
    
    algo_lr = float(algo_params.pop("lr", lr))
    algo_wd = float(algo_params.pop("weight_decay", weight_decay))
    
    # 训练算力校验看板 (Budget Guardrail for Single Run) —— 严格卡训练总计算量
    benchmark_ref_algo = train_cfg.get("budget_benchmark_algorithm", "flow_matching")
    global_h = model_cfg.get("hidden_dim", 256)
    global_b = model_cfg.get("num_blocks", 4)
    global_t = model_cfg.get("time_emb_dim", 256)
    ref_algo_params = algo_cfg.get(benchmark_ref_algo, {})
    ref_epochs = ref_algo_params.get("epochs", epochs)
    ref_h = ref_algo_params.get("hidden_dim", global_h)
    ref_b = ref_algo_params.get("num_blocks", global_b)
    ref_t = ref_algo_params.get("time_emb_dim", global_t)
    ref_time_channels = get_time_channels(benchmark_ref_algo)
    base_forward_flops = get_forward_flops(ref_h, ref_b, ref_t, ref_time_channels)
    ref_train_nfe = 4 if benchmark_ref_algo == "consistency_models" else 3
    num_batches = n_samples // batch_size
    target_flops = ref_epochs * num_batches * ref_train_nfe * base_forward_flops
    
    single_forward_flops = get_forward_flops(
        algo_hidden_dim,
        algo_num_blocks,
        algo_time_emb_dim,
        get_time_channels(args.algorithm)
    )
    algo_epochs = algo_params.pop("epochs", epochs) # 提取专属训练 epochs
    train_nfe = 4 if args.algorithm == "consistency_models" else 3
    total_train_flops = algo_epochs * num_batches * train_nfe * single_forward_flops
    err = (total_train_flops - target_flops) / target_flops
    
    nfe = algo_params.get("sample_steps", algo_params.get("num_steps", 1)) # 仅作为打印信息展示
    
    print("\n" + "="*80)
    print("                     单独调优 - 训练总算力偏差校验")
    print("="*80)
    print(f"[*] 当前运行算法: {args.algorithm}")
    print(f"[*] 专属网络尺寸: [隐藏层宽度 {algo_hidden_dim} | 残差块数 {algo_num_blocks}]")
    print(f"[*] 训练轮数 (Epochs): {algo_epochs}")
    print(f"[*] 采样步数 (NFE): {nfe} (不卡采样限制)")
    print(f"[*] 训练总计算量: {total_train_flops/1e9:.2f}G FLOPs")
    print(f"[*] 基准训练预算: {target_flops/1e9:.2f}G FLOPs (来自 {benchmark_ref_algo})")
    status_str = f"[PASS] (偏差 {err:+.2%})" if abs(err) <= 0.10 else f"[WARN] (偏差 {err:+.2%}, 超过 10% 限制)"
    print(f"[*] 对齐状态: {status_str}")
    print("="*80 + "\n")
    
    # 3. 正在构建模型 (ConditionalMLP)
    print(f"[*] 正在构建模型 (hidden_dim={algo_hidden_dim}, num_blocks={algo_num_blocks})...")
    model = ConditionalMLP(
        input_dim=2,
        hidden_dim=algo_hidden_dim,
        num_blocks=algo_num_blocks,
        time_emb_dim=algo_time_emb_dim,
        scale_factor=get_model_scale_factor(args.algorithm),
        time_channels=get_time_channels(args.algorithm)
    )
    
    # 4. 初始化算法组件
    algorithm = algorithm_class(**algo_params)
    attach_cd_teacher_if_needed(args.algorithm, algorithm, args, config)
    
    # 4. 初始化模块化训练器 (自动创建带时间戳的实验专属目录，并备份代码和配置)
    trainer = Trainer(
        model=model,
        algorithm=algorithm,
        dataset=dataset,
        batch_size=batch_size,
        lr=algo_lr,
        weight_decay=algo_wd,
        results_dir=results_dir,
        algorithm_name=args.algorithm,
        config_path=args.config,
        seed=args.seed
    )
    
    # 5. 如果提供了 checkpoint，则加载它
    start_epoch = 0
    if args.checkpoint is not None:
        if os.path.exists(args.checkpoint):
            start_epoch = trainer.load_checkpoint(args.checkpoint)
        else:
            print(f"[!] 警告: 未找到指定的 checkpoint 文件: {args.checkpoint}，将从头开始运行。")
            
    # 6. 根据模式执行 train 或 sample
    if args.mode == "train":
        print("[*] 进入训练模式...")
        trainer.train(
            epochs=algo_epochs,
            plot_nodes=plot_nodes,
            save_nodes=save_nodes
        )
    elif args.mode == "sample":
        print("[*] 进入单向采样模式...")
        n_samples_to_gen = 5000
        print(f"[*] 正在对训练好的模型采样生成 {n_samples_to_gen} 个样本...")
        trainer.visualize_generation(epoch=start_epoch, current_loss=0.0, n_samples=n_samples_to_gen)
        print(f"[*] 采样生成图已成功输出到 {results_dir} 目录下。")

if __name__ == "__main__":
    main()
