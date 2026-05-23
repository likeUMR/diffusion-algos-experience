import os
import json
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw, ImageFont
import matplotlib.animation as animation

NFE_BUCKETS = [100, 20, 5, 1]
ALGORITHMS = [
    "ddpm",
    "ddim",
    "avg_ddim",
    "vdm",
    "v_learning",
    "flow_matching",
    "consistency_models",
    "mean_flow",
]

# 颜色映射 (针对不同 NFE 设定美观的颜色)
NFE_COLORS = {
    100: "#10b981",  # emerald (绿色)
    20: "#3b82f6",   # blue (蓝色)
    5: "#f59e0b",    # orange (橙色)
    1: "#ef4444",    # red (红色)
}

def find_latest_run_dir(algo, nfe):
    base_dir = f"results/visual_replay_full_best/{algo}_nfe_{nfe}"
    if not os.path.exists(base_dir):
        return None
    subdirs = [os.path.join(base_dir, d) for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]
    valid_dirs = [d for d in subdirs if os.path.exists(os.path.join(d, "visual_data"))]
    if not valid_dirs:
        return None
    valid_dirs.sort(key=os.path.getmtime)
    return valid_dirs[-1]

def read_jsonl(path):
    records = []
    if not os.path.exists(path):
        return records
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records

def generate_curves_for_algorithm(algo):
    print(f"[*] Processing curves for: {algo}")
    plt.close('all')
    fig, axes = plt.subplots(1, 2, figsize=(13, 5), dpi=150)
    plt.subplots_adjust(wspace=0.22)
    
    # 启用暗色系学术网格
    for ax in axes:
        ax.set_facecolor("#0b0f19")
        ax.grid(True, color="#1e293b", linestyle="--", linewidth=0.5)
        ax.tick_params(colors="#94a3b8", labelsize=9)
        ax.spines['bottom'].set_color('#334155')
        ax.spines['top'].set_color('#334155')
        ax.spines['left'].set_color('#334155')
        ax.spines['right'].set_color('#334155')
    
    fig.patch.set_facecolor("#040711")
    
    axes[0].set_title("Training Loss vs Epochs", color="white", fontsize=11, fontweight="bold", pad=12)
    axes[0].set_xlabel("Epoch", color="#94a3b8", fontsize=9, labelpad=8)
    axes[0].set_ylabel("Denoising MSE Loss", color="#94a3b8", fontsize=9, labelpad=8)
    
    axes[1].set_title("Chamfer Distance (CD) vs Epochs", color="white", fontsize=11, fontweight="bold", pad=12)
    axes[1].set_xlabel("Epoch", color="#94a3b8", fontsize=9, labelpad=8)
    axes[1].set_ylabel("Manifold Distance (Lower is Better)", color="#94a3b8", fontsize=9, labelpad=8)
    axes[1].set_yscale("log")  # CD通常采用对数尺度显示更明显

    has_data = False
    
    for nfe in NFE_BUCKETS:
        run_dir = find_latest_run_dir(algo, nfe)
        if not run_dir:
            continue
            
        has_data = True
        log_dir = os.path.join(run_dir, "visual_data", "logs")
        
        # 1. Read Loss history
        epoch_metrics = read_jsonl(os.path.join(log_dir, "epoch_metrics.jsonl"))
        if epoch_metrics:
            epochs = [r["epoch"] for r in epoch_metrics]
            losses = [r["avg_loss"] for r in epoch_metrics]
            axes[0].plot(epochs, losses, color=NFE_COLORS[nfe], label=f"NFE = {nfe}", linewidth=1.5, alpha=0.85)
            
        # 2. Read CD metrics
        sample_metrics = read_jsonl(os.path.join(log_dir, "sample_metrics.jsonl"))
        if sample_metrics:
            epochs = [r["epoch"] for r in sample_metrics]
            cds = [r["chamfer_distance"] for r in sample_metrics]
            axes[1].plot(epochs, cds, color=NFE_COLORS[nfe], marker='o', markersize=4, label=f"NFE = {nfe}", linewidth=1.5, alpha=0.85)
            
    if not has_data:
        print(f"  [!] No run data found for {algo}")
        plt.close()
        return False
        
    axes[0].legend(facecolor="#0f172a", edgecolor="#1e293b", labelcolor="white", fontsize=8)
    axes[1].legend(facecolor="#0f172a", edgecolor="#1e293b", labelcolor="white", fontsize=8)
    
    # 保存图片
    out_dir = f"presentation/assets/papers/{algo}"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "my_convergence_curves.png")
    plt.savefig(out_path, dpi=200, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close()
    print(f"  [OK] Saved curves to: {out_path}")
    return True

def generate_generation_grid_for_algorithm(algo):
    print(f"[*] Splicing generation overview for: {algo}")
    images = []
    nfe_labels = []
    
    for nfe in NFE_BUCKETS:
        run_dir = find_latest_run_dir(algo, nfe)
        if not run_dir:
            continue
            
        # 自动在 run_dir 下搜寻最新生成的点云图
        pngs = [f for f in os.listdir(run_dir) if f.startswith("generation_epoch_") and f.endswith(".png")]
        if not pngs:
            continue
        
        # 按 epoch 数字排序
        pngs.sort(key=lambda x: int(x.split("_")[-1].split(".")[0]))
        latest_png = os.path.join(run_dir, pngs[-1])
        
        images.append(Image.open(latest_png))
        nfe_labels.append(nfe)
        
    if len(images) == 0:
        print(f"  [!] No images found to splice for {algo}")
        return False
        
    w, h = images[0].size
    
    if len(images) == 4:
        grid_w = w * 2
        grid_h = h * 2
        grid_img = Image.new("RGB", (grid_w, grid_h), "#040711")
        grid_img.paste(images[0], (0, 0))
        grid_img.paste(images[1], (w, 0))
        grid_img.paste(images[2], (0, h))
        grid_img.paste(images[3], (w, h))
        draw = ImageDraw.Draw(grid_img)
        
        # 画标注
        positions = [(20, 20), (w + 20, 20), (20, h + 20), (w + 20, h + 20)]
        for pos, nfe in zip(positions, nfe_labels):
            color = NFE_COLORS[nfe]
            draw.rectangle([pos, (pos[0] + 160, pos[1] + 40)], fill="#0f172a", outline="#334155")
            draw.text((pos[0] + 15, pos[1] + 10), f"NFE = {nfe}", fill=color, stroke_fill="black", stroke_width=1)
    else:
        grid_w = w * len(images)
        grid_h = h
        grid_img = Image.new("RGB", (grid_w, grid_h), "#040711")
        for idx, img in enumerate(images):
            grid_img.paste(img, (w * idx, 0))
            draw = ImageDraw.Draw(grid_img)
            color = NFE_COLORS[nfe_labels[idx]]
            draw.rectangle([(w * idx + 20, 20), (w * idx + 180, 60)], fill="#0f172a", outline="#334155")
            draw.text((w * idx + 35, 30), f"NFE = {nfe_labels[idx]}", fill=color, stroke_fill="black", stroke_width=1)
            
    out_dir = f"presentation/assets/papers/{algo}"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "my_generation_overview.png")
    grid_img.save(out_path)
    print(f"  [OK] Saved generation grid to: {out_path}")
    return True

def generate_sampling_gif_for_algorithm(algo):
    print(f"[*] Generating sampling GIF for: {algo}")
    best_nfe = 100
    if algo == "consistency_models":
        # 一致性模型，选择NFE=2或1的最佳
        best_nfe = 2
        
    run_dir = find_latest_run_dir(algo, best_nfe)
    if not run_dir:
        for nfe in [100, 20, 5, 1]:
            run_dir = find_latest_run_dir(algo, nfe)
            if run_dir:
                best_nfe = nfe
                break
                
    if not run_dir:
        print(f"  [!] No trajectory run dir found for {algo}")
        return False
        
    traces_dir = os.path.join(run_dir, "visual_data", "sampling_traces")
    if not os.path.exists(traces_dir):
        print(f"  [!] No traces dir for {algo}")
        return False
        
    epoch_dirs = [d for d in os.listdir(traces_dir) if d.startswith("epoch_")]
    if not epoch_dirs:
        print(f"  [!] No epoch trace subdirs for {algo}")
        return False
        
    epoch_dirs.sort(key=lambda x: int(x.split("_")[-1]))
    latest_epoch_dir = os.path.join(traces_dir, epoch_dirs[-1])
    npz_path = os.path.join(latest_epoch_dir, "sampling_trajectory.npz")
    
    if not os.path.exists(npz_path):
        print(f"  [!] Missing sampling_trajectory.npz at {npz_path}")
        return False
        
    try:
        data = np.load(npz_path, allow_pickle=True)
        states = data["states"]  # [T, N, 2]
        times = data["times"]    # [T]
    except Exception as e:
        print(f"  [!] Error loading npz: {e}")
        return False
        
    T, N, _ = states.shape
    
    # 绘制动图
    plt.close('all')
    fig, ax = plt.subplots(figsize=(6, 6), dpi=100)
    fig.patch.set_facecolor("#040711")
    ax.set_facecolor("#0b0f19")
    
    ax.set_xlim(-4, 4)
    ax.set_ylim(-4, 4)
    ax.axis("off")
    
    dataset_snap = os.path.join(run_dir, "visual_data", "dataset_snapshot.npz")
    if os.path.exists(dataset_snap):
        try:
            snap = np.load(dataset_snap)
            pts = snap["points"]
            ax.scatter(pts[:, 0], pts[:, 1], s=1, color="#1e293b", alpha=0.3, zorder=1)
        except:
            pass
            
    scatter = ax.scatter([], [], s=1.5, alpha=0.75, color="#06b6d4", zorder=2)
    step_text = ax.text(0.05, 0.95, "", transform=ax.transAxes, color="#94a3b8", fontsize=9, fontweight="semibold")
    
    def init():
        scatter.set_offsets(np.empty((0, 2)))
        step_text.set_text("")
        return scatter, step_text
        
    max_frames = 40
    if T > max_frames:
        frame_indices = np.linspace(0, T - 1, max_frames, dtype=int)
    else:
        frame_indices = np.arange(T)
        
    def animate(idx):
        t_idx = frame_indices[idx]
        pts = states[t_idx]
        scatter.set_offsets(pts)
        step_text.set_text(f"Step {t_idx + 1}/{T} | Time t={times[t_idx]:.3f}")
        return scatter, step_text
        
    ani = animation.FuncAnimation(fig, animate, init_func=init, frames=len(frame_indices), interval=100, blit=True)
    
    out_dir = f"presentation/assets/papers/{algo}"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "my_sampling_trajectory.gif")
    
    try:
        ani.save(out_path, writer="pillow", fps=10)
        print(f"  [OK] Saved sampling GIF to: {out_path}")
        
        # 如果是ddpm，把生成的 gif 也拷贝到 presentation/assets/ 目录下做额外备用
        if algo == "ddpm":
            os.makedirs("presentation/assets", exist_ok=True)
            # 拷贝 gif 
            import shutil
            shutil.copy(out_path, "presentation/assets/my_ddpm_sampling_animation.gif")
            print(f"  [OK] Symmetrically copied DDPM curves & GIF to core assets folder.")
            
    except Exception as e:
        print(f"  [!] Failed to save GIF: {e}")
    finally:
        plt.close()
    return True

if __name__ == "__main__":
    print("==================================================")
    print("      STARTING PRESENTATION VISUALIZATIONS")
    print("==================================================")
    
    for algo in ALGORITHMS:
        print(f"\n[Algorithm] -> {algo.upper()}")
        curves_ok = generate_curves_for_algorithm(algo)
        grid_ok = generate_generation_grid_for_algorithm(algo)
        gif_ok = generate_sampling_gif_for_algorithm(algo)
        
    print("\n==================================================")
    print("      ALL VISUALIZATIONS PROCESSED")
    print("==================================================")
