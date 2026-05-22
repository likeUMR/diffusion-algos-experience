import subprocess
import os
import sys
import time
import argparse
import math

ALGORITHMS = [
    "ddpm",
    "ddim",
    "vdm",
    "v_learning",
    "flow_matching",
    "consistency_models",
    "mean_flow"
]
NFE_BUCKETS = [100, 20, 5, 1]

def parse_valid_distance(value):
    try:
        dist = float(str(value).split()[0])
    except (TypeError, ValueError):
        return None
    if not math.isfinite(dist) or dist >= 1e6:
        return None
    return dist

def report_has_valid_result(report_file):
    if not os.path.exists(report_file):
        return False
    with open(report_file, "r", encoding="utf-8") as f:
        for line in f:
            if "Manifold" in line or "1D" in line or "均距" in line:
                _, _, value = line.partition(":")
                if parse_valid_distance(value.strip()) is not None:
                    return True
    return False

def run_hpo_for_algo(algo, fixed_sample_steps, trials=10, seed=42, hpo_repeats=1, reset_study=False):
    cmd = [
        r".\.venv\Scripts\python.exe",
        "main.py",
        "--mode", "hpo",
        "--algorithm", algo,
        "--hpo_trials", str(trials),
        "--fixed_sample_steps", str(fixed_sample_steps),
        "--seed", str(seed),
        "--hpo_repeats", str(hpo_repeats)
    ]
    if reset_study:
        cmd.append("--reset_study")
    print(f"\n======================================================================")
    print(f"[*] [HPO MASTER] 正在启动算法自动调参: {algo.upper()} | NFE={fixed_sample_steps} (总试验组数={trials}, repeats={hpo_repeats})")
    print(f"======================================================================")
    
    # 使用 subprocess 运行，并将输出实时打印到控制台
    process = subprocess.Popen(cmd, stdout=sys.stdout, stderr=sys.stderr)
    process.wait()
    
    if process.returncode != 0:
        print(f"[!] 警告: 算法 {algo} 在 NFE={fixed_sample_steps} HPO 过程中异常退出。")
    else:
        print(f"[OK] 完成: 算法 {algo} 的 NFE={fixed_sample_steps} HPO 调参测试成功。")

def generate_master_report(nfe_buckets):
    print("\n======================================================================")
    print("[*] [HPO MASTER] 正在搜集所有算法调参成果，生成 HPO Master 巅峰报告...")
    print("======================================================================")
    
    results_dir = "results"
    master_report_path = os.path.join(results_dir, "hpo_master_report.md")
    
    master_content = []
    master_content.append("# 7 大生成算法：固定 NFE 成本感知 HPO 成果汇总\n")
    master_content.append(f"汇总时间: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}\n")
    master_content.append("每个单元格为对应算法在固定推理 NFE 下独立 HPO 得到的最佳平均流形距离。\n\n")
    master_content.append("| NFE | 算法 (Algorithm) | 最佳尺寸 (H x B) | 最佳自适应 Epochs | 最佳学习率 (lr) | 最佳权重衰减 (WD) | 极限流形均距 (Manifold Dist) |\n")
    master_content.append("| :---: | :--- | :---: | :---: | :---: | :---: | :---: |\n")
    
    summary_list = []
    matrix_dist = {nfe: {algo: None for algo in ALGORITHMS} for nfe in nfe_buckets}
    
    for nfe in nfe_buckets:
        for algo in ALGORITHMS:
            report_file = os.path.join(results_dir, f"hpo_best_report_{algo}_nfe_{nfe}.txt")
            if os.path.exists(report_file):
                data = {}
                with open(report_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if ":" in line:
                            parts = line.split(":", 1)
                            k = parts[0].strip()
                            v = parts[1].strip()
                            data[k] = v
                
                opt_h = data.get("hidden_dim", "N/A")
                opt_b = data.get("num_blocks", "N/A")
                opt_epochs = data.get("epochs (自适应配平)", data.get("epochs", "N/A"))
                opt_lr = data.get("lr", "N/A")
                opt_wd = data.get("weight_decay", "N/A")
                opt_dist = data.get("最佳 1D 流形均距 (Manifold Dist)", "N/A")
                
                if opt_dist == "N/A":
                    for key, val in data.items():
                        if "Manifold" in key or "1D" in key or "均距" in key:
                            opt_dist = val
                            break
                parsed_dist = parse_valid_distance(opt_dist)
                matrix_dist[nfe][algo] = parsed_dist
                if parsed_dist is None and opt_dist != "N/A":
                    opt_dist = f"{opt_dist} (无效/失败)"
                
                size_str = f"{opt_h}x{opt_b}"
                master_content.append(f"| **{nfe}** | **{algo.upper()}** | {size_str} | {opt_epochs} | {opt_lr} | {opt_wd} | **{opt_dist}** |\n")
                summary_list.append((nfe, algo.upper(), size_str, opt_epochs, opt_lr, opt_wd, opt_dist))
            else:
                master_content.append(f"| **{nfe}** | **{algo.upper()}** | N/A | N/A | N/A | N/A | N/A (未完成调参) |\n")

    matrix_csv_path, heatmap_path = generate_matrix_outputs(results_dir, nfe_buckets, matrix_dist)
    master_content.append("\n## 固定 NFE 最终矩阵图\n\n")
    master_content.append(f"- 矩阵 CSV: `{os.path.basename(matrix_csv_path)}`\n")
    if heatmap_path:
        master_content.append(f"- 矩阵热力图: `{os.path.basename(heatmap_path)}`\n")
    else:
        master_content.append("- 矩阵热力图: 暂未生成，当前没有可用的成功 HPO 单元格。\n")

    with open(master_report_path, "w", encoding="utf-8") as f:
        f.writelines(master_content)
        
    print(f"\n[OK] 成功: HPO Master 巅峰汇总报告已成功输出至: {master_report_path}\n")
    print("="*80)
    print("                      [HPO PANEL] 极限调参最优配置对决面板")
    print("="*80)
    print(f"| {'算法 (Algorithm)':<20} | {'尺寸 (H x B)':<11} | {'自适应Epochs':<13} | {'最佳学习率 (lr)':<15} | {'最佳权重衰减 (WD)':<16} | {'流形均距 (Dist)':<16} |")
    print("-"*100)
    for row in summary_list:
        print(f"| NFE={row[0]:<4} | {row[1]:<20} | {row[2]:<11} | {row[3]:<13} | {row[4]:<15} | {row[5]:<16} | {row[6]:<16} |")
    print("="*100 + "\n")

def generate_matrix_outputs(results_dir, nfe_buckets, matrix_dist):
    """
    根据 7 算法 x 固定 NFE 的最佳 HPO 报告，生成最终矩阵 CSV 与热力图。
    单元格值为最佳平均 Manifold Distance，越低越好。
    """
    os.makedirs(results_dir, exist_ok=True)
    matrix_csv_path = os.path.join(results_dir, "hpo_matrix_dist.csv")
    heatmap_path = os.path.join(results_dir, "hpo_matrix_heatmap.png")

    with open(matrix_csv_path, "w", encoding="utf-8") as f:
        f.write("NFE," + ",".join(ALGORITHMS) + "\n")
        for nfe in nfe_buckets:
            values = []
            for algo in ALGORITHMS:
                value = matrix_dist[nfe].get(algo)
                values.append("" if value is None else f"{value:.8f}")
            f.write(str(nfe) + "," + ",".join(values) + "\n")

    has_value = any(
        matrix_dist[nfe].get(algo) is not None
        for nfe in nfe_buckets
        for algo in ALGORITHMS
    )
    if not has_value:
        print(f"[!] 当前没有成功 HPO 单元格，仅生成空矩阵 CSV: {matrix_csv_path}")
        return matrix_csv_path, None

    try:
        import numpy as np
        import matplotlib.pyplot as plt

        raw = np.full((len(nfe_buckets), len(ALGORITHMS)), np.nan, dtype=float)
        for row_idx, nfe in enumerate(nfe_buckets):
            for col_idx, algo in enumerate(ALGORITHMS):
                value = matrix_dist[nfe].get(algo)
                if value is not None and value > 0 and math.isfinite(value):
                    raw[row_idx, col_idx] = value

        # 使用 log10 色彩压缩动态范围；格内仍标注原始距离值。
        plot_values = np.log10(raw)
        masked_values = np.ma.masked_invalid(plot_values)

        fig, ax = plt.subplots(figsize=(12, 5.5))
        im = ax.imshow(masked_values, cmap="viridis_r", aspect="auto")
        ax.set_xticks(range(len(ALGORITHMS)))
        ax.set_xticklabels([algo.upper() for algo in ALGORITHMS], rotation=30, ha="right")
        ax.set_yticks(range(len(nfe_buckets)))
        ax.set_yticklabels([str(nfe) for nfe in nfe_buckets])
        ax.set_xlabel("Algorithm")
        ax.set_ylabel("Fixed NFE")
        ax.set_title("HPO Best Manifold Distance Matrix (lower is better)")

        for row_idx in range(len(nfe_buckets)):
            for col_idx in range(len(ALGORITHMS)):
                value = raw[row_idx, col_idx]
                label = "N/A" if np.isnan(value) else f"{value:.4g}"
                ax.text(col_idx, row_idx, label, ha="center", va="center", color="white", fontsize=8)

        cbar = fig.colorbar(im, ax=ax)
        cbar.set_label("log10(Manifold Distance)")
        fig.tight_layout()
        fig.savefig(heatmap_path, dpi=200, bbox_inches="tight")
        plt.close(fig)
        print(f"[OK] 固定 NFE HPO 矩阵 CSV 已输出至: {matrix_csv_path}")
        print(f"[OK] 固定 NFE HPO 矩阵热力图已输出至: {heatmap_path}")
        return matrix_csv_path, heatmap_path
    except Exception as exc:
        print(f"[!] 矩阵热力图生成失败，仅保留 CSV: {exc!r}")
        return matrix_csv_path, None

def main():
    parser = argparse.ArgumentParser(description="固定 NFE 分桶批量 HPO")
    parser.add_argument("--trials", type=int, default=10)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--hpo_repeats", type=int, default=1)
    parser.add_argument("--nfe", type=int, nargs="*", default=NFE_BUCKETS, choices=NFE_BUCKETS)
    parser.add_argument("--force", action="store_true", help="即使目标报告已存在，也重新运行")
    parser.add_argument("--reset_study", action="store_true", help="运行前清空对应算法/NFE 的 Optuna study 与 trial 档案")
    args = parser.parse_args()
    
    print("[*] 正在启动全自动 HPO 巅峰对决总控制引擎...")
    start_time = time.time()
    
    for nfe in args.nfe:
        for algo in ALGORITHMS:
            report_file = os.path.join("results", f"hpo_best_report_{algo}_nfe_{nfe}.txt")
            if os.path.exists(report_file) and not args.force and not args.reset_study:
                if report_has_valid_result(report_file):
                    print(f"[*] [HPO MASTER] 算法 {algo.upper()} NFE={nfe} 的有效调参报告已存在，自动跳过运行。")
                    continue
                print(f"[!] [HPO MASTER] 算法 {algo.upper()} NFE={nfe} 的报告无有效成功值，将自动重跑。")
            run_hpo_for_algo(
                algo,
                nfe,
                trials=args.trials,
                seed=args.seed,
                hpo_repeats=args.hpo_repeats,
                reset_study=args.reset_study
            )
        
    # 汇总生成终极报告
    generate_master_report(args.nfe)
    
    elapsed = time.time() - start_time
    print(f"[*] HPO 总控制引擎完美运行完毕！总耗时: {elapsed/60:.2f} 分钟。")

if __name__ == "__main__":
    main()
