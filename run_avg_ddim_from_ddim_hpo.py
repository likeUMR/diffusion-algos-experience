import argparse
import os

from algorithms.avg_ddim import AvgDDIM
from data_generator import ConchSpiralDataset
from main import get_model_scale_factor, get_time_channels, load_config, parse_hpo_report, set_global_seed
from models.mlp import ConditionalMLP
from trainer import Trainer


NFE_BUCKETS = [100, 20, 5, 1]


def _as_int(value):
    return int(str(value).split()[0])


def _as_float(value):
    return float(str(value).split()[0])


def build_run_config(
    results_dir,
    nfe,
    avg_k,
    gaussian_candidate_sampling,
    gaussian_candidate_std,
    gaussian_candidate_proposals
):
    report_path = os.path.join(results_dir, f"hpo_best_report_ddim_nfe_{nfe}.txt")
    report = parse_hpo_report(report_path)
    if not report:
        raise FileNotFoundError(f"未找到 DDIM NFE={nfe} 的 HPO 最佳报告: {report_path}")

    return {
        "hidden_dim": _as_int(report["hidden_dim"]),
        "num_blocks": _as_int(report["num_blocks"]),
        "time_emb_dim": _as_int(report["time_emb_dim"]),
        "epochs": _as_int(report["epochs (自适应配平)"]),
        "lr": _as_float(report["lr"]),
        "weight_decay": _as_float(report["weight_decay"]),
        "algo_params": {
            "num_steps": _as_int(report["num_steps"]),
            "sample_steps": _as_int(report["sample_steps"]),
            "eta": _as_float(report["eta"]),
            "beta_start": _as_float(report["beta_start"]),
            "beta_end": _as_float(report["beta_end"]),
            "avg_k": avg_k,
            "gaussian_candidate_sampling": gaussian_candidate_sampling,
            "gaussian_candidate_std": gaussian_candidate_std,
            "gaussian_candidate_proposals": gaussian_candidate_proposals,
        },
    }


def run_one(nfe, args, config):
    train_cfg = config.get("train", {})
    results_dir = train_cfg.get("results_dir", "results")
    run_cfg = build_run_config(
        results_dir,
        nfe,
        args.avg_k,
        args.gaussian_candidate_sampling,
        args.gaussian_candidate_std,
        args.gaussian_candidate_proposals,
    )

    set_global_seed(args.seed)
    dataset = ConchSpiralDataset(
        n_samples=train_cfg.get("n_samples", 20000),
        noise=train_cfg.get("noise", 0.0),
        turns=train_cfg.get("turns", 3.0),
    )
    model = ConditionalMLP(
        input_dim=2,
        hidden_dim=run_cfg["hidden_dim"],
        num_blocks=run_cfg["num_blocks"],
        time_emb_dim=run_cfg["time_emb_dim"],
        scale_factor=get_model_scale_factor("avg_ddim"),
        time_channels=get_time_channels("avg_ddim"),
    )
    algorithm = AvgDDIM(**run_cfg["algo_params"])
    gaussian_suffix = ""
    if args.gaussian_candidate_sampling:
        std_label = str(args.gaussian_candidate_std).replace(".", "p")
        gaussian_suffix = f"_gauss{std_label}"

    trainer = Trainer(
        model=model,
        algorithm=algorithm,
        dataset=dataset,
        batch_size=train_cfg.get("batch_size", 512),
        lr=run_cfg["lr"],
        weight_decay=run_cfg["weight_decay"],
        results_dir=os.path.join(results_dir, f"avg_ddim_k{args.avg_k}{gaussian_suffix}_from_ddim_hpo_nfe_{nfe}"),
        algorithm_name=f"avg_ddim_k{args.avg_k}{gaussian_suffix}_nfe_{nfe}",
        config_path=args.config,
        backup_source=True,
        seed=args.seed,
    )

    print("\n" + "=" * 80)
    print(
        f"[*] 启动 Avg-DDIM 对照实验 | NFE={nfe} | avg_k={args.avg_k} | "
        f"gaussian_candidate_sampling={args.gaussian_candidate_sampling} | "
        f"gaussian_candidate_std={args.gaussian_candidate_std} | "
        f"gaussian_candidate_proposals={args.gaussian_candidate_proposals}"
    )
    print(f"[*] 完全复用 DDIM HPO 参数: {run_cfg}")
    print("=" * 80)
    trainer.train(
        epochs=run_cfg["epochs"],
        plot_nodes=train_cfg.get("plot_nodes", 10),
        save_nodes=0,
    )


def main():
    parser = argparse.ArgumentParser(description="使用 DDIM HPO 最佳参数运行 Avg-DDIM 对照实验")
    parser.add_argument("--config", type=str, default="config.yaml")
    parser.add_argument("--nfe", type=int, nargs="*", default=NFE_BUCKETS, choices=NFE_BUCKETS)
    parser.add_argument("--avg_k", type=int, default=30)
    parser.add_argument("--gaussian_candidate_sampling", action="store_true")
    parser.add_argument("--gaussian_candidate_std", type=float, default=0.3)
    parser.add_argument("--gaussian_candidate_proposals", type=int, default=256)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    config = load_config(args.config)
    for nfe in args.nfe:
        run_one(nfe, args, config)


if __name__ == "__main__":
    main()
