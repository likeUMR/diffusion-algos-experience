import argparse
import gc
import inspect
import json
import os
import time
import traceback
from types import SimpleNamespace

import torch

from data_generator import ConchSpiralDataset
from main import (
    ALGORITHMS,
    apply_fixed_sample_steps,
    attach_cd_teacher_if_needed,
    get_model_scale_factor,
    get_time_channels,
    load_config,
    parse_hpo_report,
    set_global_seed,
)
from models.mlp import ConditionalMLP
from trainer import Trainer


NFE_BUCKETS = [100, 20, 5, 1]
ALGORITHM_ORDER = [
    "ddpm",
    "ddim",
    "avg_ddim",
    "vdm",
    "v_learning",
    "flow_matching",
    "consistency_models",
    "mean_flow",
]


def parse_args():
    parser = argparse.ArgumentParser(
        description="用 HPO best 超参重跑可视化优先实验，完整保存 loss/metric/checkpoint/sampling trajectory。"
    )
    parser.add_argument("--config", type=str, default="config.yaml")
    parser.add_argument("--algorithm", type=str, default="all", choices=["all"] + list(ALGORITHMS.keys()))
    parser.add_argument("--nfe", type=str, default="all", help="all 或逗号分隔 NFE，如 100,20,5,1")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output_name", type=str, default=None, help="可视化复现实验根目录名，默认带时间戳")
    parser.add_argument("--trace_samples", type=int, default=2000, help="每次采样轨迹保存多少个点")
    parser.add_argument("--eval_samples", type=int, default=5000, help="每次评估/点云图使用多少个点")
    parser.add_argument("--batch_log_interval", type=int, default=10, help="每隔多少 batch 写一次 loss，0 表示关闭 batch 级日志")
    parser.add_argument("--trace_every", type=int, default=50, help="每隔多少 epoch 保存一次完整采样轨迹，1 表示每个 epoch 都保存")
    parser.add_argument("--plot_every", type=int, default=50, help="每隔多少 epoch 评估并画图，1 表示每个 epoch 都评估")
    parser.add_argument("--save_checkpoints", type=int, default=1, help="保存多少个普通 checkpoint；默认 1 表示保存最终权重")
    parser.add_argument("--all_checkpoints", action="store_true", help="保存每个 epoch 的可视化 checkpoint（非常占磁盘）")
    parser.add_argument("--force", action="store_true", help="即使检测到该算法/NFE 已完成，也重新运行")
    parser.add_argument("--fail_fast", action="store_true", help="任意组合失败后立即退出，而不是继续跑后续组合")
    parser.add_argument("--epochs_override", type=int, default=None, help="调试用：覆盖 HPO 报告中的 epochs")
    parser.add_argument("--dry_run", action="store_true", help="只打印计划，不实际训练")
    return parser.parse_args()


def parse_nfes(raw):
    if raw == "all":
        return NFE_BUCKETS
    values = [int(item.strip()) for item in raw.split(",") if item.strip()]
    invalid = sorted(set(values) - set(NFE_BUCKETS))
    if invalid:
        raise ValueError(f"不支持的 NFE: {invalid}; 当前支持 {NFE_BUCKETS}")
    return values


def parse_bool(value):
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in {"true", "1", "yes", "y"}:
        return True
    if text in {"false", "0", "no", "n"}:
        return False
    raise ValueError(f"无法解析布尔值: {value}")


def parse_scalar(value):
    text = str(value).strip()
    if not text:
        return text
    if text.lower() in {"true", "false"}:
        return parse_bool(text)
    try:
        if any(ch in text for ch in [".", "e", "E"]):
            return float(text.split()[0])
        return int(text.split()[0])
    except (TypeError, ValueError):
        return text


def write_json(path, payload):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def filter_constructor_params(algorithm, params):
    signature = inspect.signature(ALGORITHMS[algorithm].__init__)
    if any(param.kind == inspect.Parameter.VAR_KEYWORD for param in signature.parameters.values()):
        return params, {}
    allowed = {name for name in signature.parameters if name != "self"}
    kept = {key: value for key, value in params.items() if key in allowed}
    dropped = {key: value for key, value in params.items() if key not in allowed}
    return kept, dropped


def find_completed_run(group_dir):
    if not os.path.isdir(group_dir):
        return None
    for name in sorted(os.listdir(group_dir), reverse=True):
        exp_dir = os.path.join(group_dir, name)
        manifest_path = os.path.join(exp_dir, "visual_data", "visual_manifest.json")
        summary_path = os.path.join(exp_dir, "result_summary.txt")
        if os.path.isfile(manifest_path) and os.path.isfile(summary_path):
            return exp_dir
    return None


def load_best_config(config, algorithm, nfe, epochs_override=None):
    train_cfg = config.get("train", {})
    model_cfg = config.get("model", {})
    algo_cfg = config.get("algorithms", {})
    results_dir = train_cfg.get("results_dir", "results")
    report_path = os.path.join(results_dir, f"hpo_best_report_{algorithm}_nfe_{nfe}.txt")
    report = parse_hpo_report(report_path)
    if not report:
        raise FileNotFoundError(f"没有找到 HPO best 报告: {report_path}")

    def get_int(key, default):
        return int(str(report.get(key, default)).split()[0])

    def get_float(key, default):
        return float(str(report.get(key, default)).split()[0])

    hidden_dim = get_int("hidden_dim", algo_cfg.get(algorithm, {}).get("hidden_dim", model_cfg.get("hidden_dim", 256)))
    num_blocks = get_int("num_blocks", algo_cfg.get(algorithm, {}).get("num_blocks", model_cfg.get("num_blocks", 4)))
    time_emb_dim = get_int("time_emb_dim", hidden_dim)
    epochs = get_int("epochs (自适应配平)", algo_cfg.get(algorithm, {}).get("epochs", train_cfg.get("epochs", 200)))
    if epochs_override is not None:
        epochs = int(epochs_override)
    lr = get_float("lr", algo_cfg.get(algorithm, {}).get("lr", train_cfg.get("lr", 1e-3)))
    weight_decay = get_float("weight_decay", algo_cfg.get(algorithm, {}).get("weight_decay", train_cfg.get("weight_decay", 1e-4)))

    excluded_keys = {
        "hidden_dim",
        "num_blocks",
        "time_emb_dim",
        "epochs (自适应配平)",
        "epochs",
        "lr",
        "weight_decay",
        "最佳双向倒角距离 (Chamfer Dist)",
        "固定推理采样步数 / NFE",
        "随机种子基准",
        "每个 Trial 重复次数",
        "目标算力天花板预算",
        "调参结束时间",
        "最佳极限超参组合",
    }
    algo_params = {}
    for key, value in algo_cfg.get(algorithm, {}).items():
        if key not in {"hidden_dim", "num_blocks", "time_emb_dim", "epochs", "lr", "weight_decay"}:
            algo_params[key] = value
    for key, value in report.items():
        if key in excluded_keys:
            continue
        parsed_value = parse_scalar(value)
        if parsed_value == "":
            continue
        algo_params[key] = parsed_value
    algo_params = apply_fixed_sample_steps(algorithm, algo_params, nfe)
    algo_params, dropped_algo_params = filter_constructor_params(algorithm, algo_params)

    return {
        "report_path": report_path,
        "hidden_dim": hidden_dim,
        "num_blocks": num_blocks,
        "time_emb_dim": time_emb_dim,
        "epochs": epochs,
        "lr": lr,
        "weight_decay": weight_decay,
        "algo_params": algo_params,
        "dropped_algo_params": dropped_algo_params,
    }


def run_one(args, config, replay_root, algorithm, nfe, run_seed):
    train_cfg = config.get("train", {})
    n_samples = train_cfg.get("n_samples", 20000)
    noise = train_cfg.get("noise", 0.0)
    turns = train_cfg.get("turns", 3.0)
    batch_size = train_cfg.get("batch_size", 512)

    best_cfg = load_best_config(config, algorithm, nfe, epochs_override=args.epochs_override)
    group_dir = os.path.join(replay_root, f"{algorithm}_nfe_{nfe}")
    os.makedirs(group_dir, exist_ok=True)
    status_path = os.path.join(group_dir, "replay_status.json")
    completed_run = find_completed_run(group_dir)
    if completed_run and not args.force:
        print(f"[SKIP] {algorithm.upper()} NFE={nfe}: 已检测到完成结果 {completed_run}")
        return completed_run

    print("\n" + "=" * 96)
    print(f"[*] Visual Replay | Algorithm={algorithm.upper()} | NFE={nfe} | Seed={run_seed}")
    print(f"[*] HPO Report: {best_cfg['report_path']}")
    print(f"[*] Model: H={best_cfg['hidden_dim']} B={best_cfg['num_blocks']} T={best_cfg['time_emb_dim']} | Epochs={best_cfg['epochs']}")
    print(f"[*] Optim: lr={best_cfg['lr']:.6e} | wd={best_cfg['weight_decay']:.6e}")
    print(f"[*] Algo Params: {best_cfg['algo_params']}")
    if best_cfg["dropped_algo_params"]:
        print(f"[*] Ignored report-only params: {sorted(best_cfg['dropped_algo_params'].keys())}")
    print("=" * 96)

    if args.dry_run:
        return None

    write_json(status_path, {
        "status": "running",
        "algorithm": algorithm,
        "nfe": nfe,
        "seed": run_seed,
        "started_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        "epochs": best_cfg["epochs"],
        "report_path": best_cfg["report_path"],
    })

    set_global_seed(run_seed)
    dataset = ConchSpiralDataset(n_samples=n_samples, noise=noise, turns=turns)
    model = ConditionalMLP(
        input_dim=2,
        hidden_dim=best_cfg["hidden_dim"],
        num_blocks=best_cfg["num_blocks"],
        time_emb_dim=best_cfg["time_emb_dim"],
        scale_factor=get_model_scale_factor(algorithm),
        time_channels=get_time_channels(algorithm),
    )
    algo_instance = ALGORITHMS[algorithm](**best_cfg["algo_params"])
    helper_args = SimpleNamespace(config=args.config, algorithm=algorithm, fixed_sample_steps=nfe, seed=run_seed)
    attach_cd_teacher_if_needed(algorithm, algo_instance, helper_args, config)

    visual_config = {
        "enabled": True,
        "visual_dirname": "visual_data",
        "batch_log_interval": args.batch_log_interval,
        "trace_every_n_epochs": args.trace_every,
        "trace_samples": args.trace_samples,
        "eval_samples": args.eval_samples,
        "save_all_checkpoints": args.all_checkpoints,
    }
    trainer = Trainer(
        model=model,
        algorithm=algo_instance,
        dataset=dataset,
        batch_size=batch_size,
        lr=best_cfg["lr"],
        weight_decay=best_cfg["weight_decay"],
        results_dir=group_dir,
        algorithm_name=f"{algorithm}_nfe_{nfe}_visual",
        config_path=args.config,
        backup_source=True,
        seed=run_seed,
        visual_config=visual_config,
    )

    plot_every = max(1, int(args.plot_every))
    plot_nodes = max(1, best_cfg["epochs"] // plot_every)
    trainer.train(
        epochs=best_cfg["epochs"],
        plot_nodes=plot_nodes,
        save_nodes=max(0, int(args.save_checkpoints)),
    )
    write_json(status_path, {
        "status": "completed",
        "algorithm": algorithm,
        "nfe": nfe,
        "seed": run_seed,
        "completed_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        "epochs": best_cfg["epochs"],
        "experiment_dir": trainer.experiment_dir,
        "report_path": best_cfg["report_path"],
    })
    return trainer.experiment_dir


def main():
    args = parse_args()
    config = load_config(args.config)
    train_cfg = config.get("train", {})
    results_dir = train_cfg.get("results_dir", "results")
    algorithms = [name for name in ALGORITHM_ORDER if name in ALGORITHMS] if args.algorithm == "all" else [args.algorithm]
    nfes = parse_nfes(args.nfe)

    timestamp = time.strftime("%Y%m%d_%H%M%S", time.localtime())
    output_name = args.output_name or f"visual_replay_{timestamp}"
    replay_root = os.path.join(results_dir, output_name)
    os.makedirs(replay_root, exist_ok=True)

    print(f"[*] 可视化复现实验根目录: {replay_root}")
    print(f"[*] 运行计划: {len(algorithms)} 个算法 x {len(nfes)} 个 NFE = {len(algorithms) * len(nfes)} 组")
    print(f"[*] 可视化频率: plot_every={args.plot_every}, trace_every={args.trace_every}, all_checkpoints={args.all_checkpoints}")
    completed = []
    failed = []
    run_idx = 0
    for algorithm in algorithms:
        for nfe in nfes:
            run_seed = args.seed + run_idx * 10000
            run_idx += 1
            try:
                exp_dir = run_one(args, config, replay_root, algorithm, nfe, run_seed)
                if exp_dir:
                    completed.append({"algorithm": algorithm, "nfe": nfe, "experiment_dir": exp_dir})
            except FileNotFoundError as exc:
                print(f"[SKIP] {algorithm.upper()} NFE={nfe}: {exc}")
                failed.append({"algorithm": algorithm, "nfe": nfe, "error": repr(exc)})
            except Exception as exc:
                err_text = traceback.format_exc()
                print(f"[FAIL] {algorithm.upper()} NFE={nfe}: {exc!r}")
                failure_path = os.path.join(replay_root, "visual_replay_failures.log")
                with open(failure_path, "a", encoding="utf-8") as f:
                    f.write("\n" + "=" * 96 + "\n")
                    f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())} | {algorithm} | NFE={nfe}\n")
                    f.write(err_text)
                group_dir = os.path.join(replay_root, f"{algorithm}_nfe_{nfe}")
                write_json(os.path.join(group_dir, "replay_status.json"), {
                    "status": "failed",
                    "algorithm": algorithm,
                    "nfe": nfe,
                    "seed": run_seed,
                    "failed_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
                    "error": repr(exc),
                    "failure_log": failure_path,
                })
                failed.append({"algorithm": algorithm, "nfe": nfe, "error": repr(exc)})
                if args.fail_fast:
                    raise
            finally:
                gc.collect()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()

    if not args.dry_run:
        summary_path = os.path.join(replay_root, "visual_replay_index.json")
        with open(summary_path, "w", encoding="utf-8") as f:
            import json

            json.dump(
                {
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
                    "config": args.config,
                    "runs": completed,
                    "failed": failed,
                },
                f,
                ensure_ascii=False,
                indent=2,
            )
        print(f"[*] 可视化复现实验索引已写入: {summary_path}")


if __name__ == "__main__":
    main()
