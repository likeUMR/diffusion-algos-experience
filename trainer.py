import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import matplotlib.pyplot as plt
import numpy as np
import shutil
import datetime
import json

class Trainer:
    """
    模块化训练框架。
    支持传入任何继承自 BaseAlgorithm 的算法实例和任何 PyTorch 神经网络模型，
    自动化管理训练循环、优化器、设备移动、周期性生成可视化和模型保存。
    """
    def __init__(
        self,
        model: nn.Module,
        algorithm,
        dataset,
        batch_size: int = 512,
        lr: float = 1e-3,
        weight_decay: float = 1e-4,
        device: str = None,
        results_dir: str = "results",
        algorithm_name: str = None,
        config_path: str = "config.yaml",
        checkpoint_dir: str = None,
        backup_source: bool = True,
        seed: int = None,
        visual_config: dict = None
    ):
        # 1. 自动选择运算设备 (CPU / CUDA)
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
            
        print(f"正在初始化训练器... 运行设备: {self.device}")
        
        # 2. 模型与算法
        self.model = model.to(self.device)
        self.algorithm = algorithm
        self.dataset = dataset
        if hasattr(self.algorithm, "set_data_bank") and hasattr(dataset, "data"):
            self.algorithm.set_data_bank(dataset.data)
        
        # 3. 创建 DataLoader
        dataloader_generator = None
        if seed is not None:
            dataloader_generator = torch.Generator()
            dataloader_generator.manual_seed(seed)
        self.dataloader = DataLoader(
            dataset,
            batch_size=batch_size,
            shuffle=True,
            drop_last=True,
            generator=dataloader_generator
        )
        
        # 4. 创建优化器 (AdamW)
        self.optimizer = torch.optim.AdamW(
            self.model.parameters(),
            lr=lr,
            weight_decay=weight_decay
        )
        
        # 5. 学习率调度器 (余弦退火)
        self.scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            self.optimizer,
            T_max=100, # 默认训练周期
            eta_min=1e-5
        )
        
        # 6. 保存路径设置
        # 自动生成带有时间戳和算法名的专属结果子文件夹
        algo_name = algorithm_name if algorithm_name is not None else algorithm.__class__.__name__.lower()
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        self.experiment_dir = os.path.join(results_dir, f"run_{timestamp}_{algo_name}")
        
        self.results_dir = self.experiment_dir
        self.checkpoint_dir = os.path.join(self.experiment_dir, "checkpoints")
        
        os.makedirs(self.experiment_dir, exist_ok=True)
        os.makedirs(self.checkpoint_dir, exist_ok=True)
        
        print(f"[*] 实验专属结果目录已创建: {self.experiment_dir}")
        print(f"[*] 模型 Checkpoint 保存路径: {self.checkpoint_dir}")
        
        # 备份配置与源码
        if backup_source:
            # 备份本次实验使用的配置文件 config.yaml
            if config_path and os.path.exists(config_path):
                shutil.copy(config_path, os.path.join(self.experiment_dir, "config.yaml"))
                print(f"[*] 已成功备份配置文件 {config_path} 到 {self.experiment_dir}")
                
            # 备份本次实验使用的源码
            src_backup_dir = os.path.join(self.experiment_dir, "src")
            os.makedirs(src_backup_dir, exist_ok=True)
            
            # 复制顶层脚本
            for file in ["main.py", "trainer.py", "data_generator.py"]:
                if os.path.exists(file):
                    shutil.copy(file, os.path.join(src_backup_dir, file))
                    
            # 复制核心模块文件夹 (models/ 和 algorithms/)
            for folder in ["models", "algorithms"]:
                if os.path.exists(folder):
                    shutil.copytree(folder, os.path.join(src_backup_dir, folder), dirs_exist_ok=True)
            print(f"[*] 已成功备份源码到 {src_backup_dir}")
        
        # 7. 训练指标记录
        self.loss_history = []
        self.metric_epochs = []
        self.dist_history = []
        self.uniformity_history = []
        self.coverage_history = []
        
        # 8. 属性缓存，用于总结文件生成
        self.init_lr = lr
        self.init_weight_decay = weight_decay
        self.batch_size = batch_size
        self.algorithm_name = algo_name
        self.seed = seed
        self.visual_config = visual_config or {}
        self.visual_enabled = bool(self.visual_config.get("enabled", False))
        self.global_step = 0
        self.lr_history = []
        self.batch_loss_history = []
        if self.visual_enabled:
            self.visual_dir = os.path.join(self.experiment_dir, self.visual_config.get("visual_dirname", "visual_data"))
            self.visual_logs_dir = os.path.join(self.visual_dir, "logs")
            self.visual_samples_dir = os.path.join(self.visual_dir, "samples")
            self.visual_traces_dir = os.path.join(self.visual_dir, "sampling_traces")
            self.visual_checkpoints_dir = os.path.join(self.visual_dir, "checkpoints")
            for path in [
                self.visual_dir,
                self.visual_logs_dir,
                self.visual_samples_dir,
                self.visual_traces_dir,
                self.visual_checkpoints_dir,
            ]:
                os.makedirs(path, exist_ok=True)
            self._save_visual_dataset_snapshot()
            print(f"[*] 可视化优先模式已开启，完整中间数据将保存至: {self.visual_dir}")

    def _append_visual_jsonl(self, filename: str, record: dict):
        if not self.visual_enabled:
            return
        path = os.path.join(self.visual_logs_dir, filename)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    def _save_visual_dataset_snapshot(self):
        if not self.visual_enabled or not hasattr(self.dataset, "data"):
            return
        dataset_path = os.path.join(self.visual_dir, "dataset_snapshot.npz")
        np.savez_compressed(
            dataset_path,
            data=self.dataset.data.detach().cpu().numpy(),
            turns=np.asarray([getattr(self.dataset, "turns", 3.0)], dtype=np.float32),
        )

    def _save_visual_manifest(self, epochs: int):
        if not self.visual_enabled:
            return
        manifest = {
            "algorithm_name": self.algorithm_name,
            "experiment_dir": self.experiment_dir,
            "visual_dir": self.visual_dir,
            "epochs": epochs,
            "batch_size": self.batch_size,
            "seed": self.seed,
            "initial_lr": self.init_lr,
            "weight_decay": self.init_weight_decay,
            "loss_history_file": "logs/epoch_metrics.jsonl",
            "batch_loss_file": "logs/batch_losses.jsonl",
            "sample_dir": "samples",
            "sampling_trace_dir": "sampling_traces",
            "checkpoint_dir": "checkpoints",
            "notes": "This run is optimized for visualization replay and stores raw numeric artifacts in npz/jsonl formats.",
        }
        with open(os.path.join(self.visual_dir, "visual_manifest.json"), "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)

    def _save_visual_checkpoint(self, epoch: int, loss: float):
        if not self.visual_enabled:
            return
        if not self.visual_config.get("save_all_checkpoints", False):
            return
        state = {
            "epoch": epoch,
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "loss": loss,
            "lr": self.optimizer.param_groups[0]["lr"],
            "global_step": self.global_step,
        }
        filepath = os.path.join(self.visual_checkpoints_dir, f"checkpoint_epoch_{epoch:04d}.pt")
        torch.save(state, filepath)

    def train(self, epochs: int = 100, plot_nodes: int = 10, save_nodes: int = 4):
        """
        开始模型的训练过程
        
        参数:
            epochs (int): 总训练轮数
            plot_nodes (int): 整体一共绘制多少个节点，且均匀分布
            save_nodes (int): 整体一共保存多少个模型权重节点，且均匀分布
        """
        # 计算均匀分布的绘图节点 epoch 列表 (set 用于去重，保障逻辑的健壮性)
        if plot_nodes > 0:
            step = epochs // plot_nodes
            if step <= 0:
                step = 1
            plot_epochs = set([i * step for i in range(1, plot_nodes + 1)])
            if epochs not in plot_epochs:
                plot_epochs.add(epochs)
        else:
            plot_epochs = set()

        # 计算均匀分布的保存 checkpoint 节点 epoch 列表
        if save_nodes > 0:
            step = epochs // save_nodes
            if step <= 0:
                step = 1
            save_epochs = set([i * step for i in range(1, save_nodes + 1)])
            if epochs not in save_epochs:
                save_epochs.add(epochs)
        else:
            save_epochs = set()

        import time
        start_time = time.time()
        
        print(f"开始训练，共计 {epochs} 轮。")
        print(f"[*] 绘图 Epoch 节点: {sorted(list(plot_epochs))}")
        print(f"[*] 保存 Epoch 节点: {sorted(list(save_epochs))}")
        
        # 更新学习率调度器的总步数
        self.scheduler.T_max = epochs
        
        avg_loss = 0.0  # 声明外层变量
        for epoch in range(1, epochs + 1):
            self.model.train()
            if hasattr(self.algorithm, "set_training_progress"):
                self.algorithm.set_training_progress(epoch, epochs)
            epoch_loss = 0.0
            num_batches = 0
            
            for batch_idx, batch_x in enumerate(self.dataloader, start=1):
                # 将数据移动到设备上
                batch_x = batch_x.to(self.device)
                
                # 梯度归零
                self.optimizer.zero_grad()
                
                # 使用算法组件计算损失
                loss = self.algorithm.compute_loss(self.model, batch_x)
                
                # 反向传播和优化
                loss.backward()
                # 梯度裁剪防梯度爆炸
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                self.optimizer.step()
                
                epoch_loss += loss.item()
                num_batches += 1
                self.global_step += 1
                if self.visual_enabled:
                    loss_value = float(loss.item())
                    self.batch_loss_history.append(loss_value)
                    batch_log_interval = int(self.visual_config.get("batch_log_interval", 1))
                    if batch_log_interval > 0 and (batch_idx % batch_log_interval == 0 or batch_idx == 1):
                        self._append_visual_jsonl("batch_losses.jsonl", {
                            "epoch": epoch,
                            "batch": batch_idx,
                            "global_step": self.global_step,
                            "loss": loss_value,
                            "lr": float(self.optimizer.param_groups[0]["lr"]),
                        })
                
            # 记录并打印平均 Loss
            avg_loss = epoch_loss / num_batches
            self.loss_history.append(avg_loss)
            
            # 更新学习率
            self.scheduler.step()
            current_lr = self.optimizer.param_groups[0]['lr']
            self.lr_history.append(current_lr)
            if self.visual_enabled:
                self._append_visual_jsonl("epoch_metrics.jsonl", {
                    "epoch": epoch,
                    "avg_loss": float(avg_loss),
                    "lr": float(current_lr),
                    "global_step": self.global_step,
                    "num_batches": num_batches,
                })
            
            # 打印训练进度
            if epoch % 1 == 0 or epoch == epochs:
                print(f"Epoch [{epoch:03d}/{epochs}] | Loss: {avg_loss:.6f} | LR: {current_lr:.6e}")
                
            # 周期性绘图可视化
            if epoch in plot_epochs:
                self.visualize_generation(epoch, avg_loss)
                
            # 周期性保存模型
            if epoch in save_epochs:
                self.save_checkpoint(epoch, avg_loss)
            self._save_visual_checkpoint(epoch, avg_loss)
                
        # 训练结束后绘制 Loss 曲线、指标变化曲线，并生成实验总结报告
        self.plot_loss_curve()
        self.plot_metrics_curves()
        
        train_time = time.time() - start_time
        self.save_result_summary(train_time, avg_loss)
        self._save_visual_manifest(epochs)
        print("训练已完成！")

    @torch.no_grad()
    def visualize_generation(self, epoch: int, current_loss: float, n_samples: int = 5000):
        """
        采样生成数据，并与原始数据分布并排绘制对比，同时评测真实一维流形的距离和分布均匀度指标
        """
        if self.visual_enabled:
            n_samples = int(self.visual_config.get("eval_samples", n_samples))
        # 1. 运行算法的采样过程
        print(f" -> Epoch {epoch}: 正在进行反向采样生成...")
        should_trace = (
            self.visual_enabled
            and int(self.visual_config.get("trace_every_n_epochs", 0)) > 0
            and (epoch % int(self.visual_config.get("trace_every_n_epochs", 1)) == 0 or epoch == self.scheduler.T_max)
        )
        if should_trace:
            from visualization_recorder import sample_with_trace
            trace_samples = int(self.visual_config.get("trace_samples", n_samples))
            trace_dir = os.path.join(self.visual_traces_dir, f"epoch_{epoch:04d}")
            generated_points = sample_with_trace(
                self.algorithm,
                self.model,
                n_samples=trace_samples,
                device=self.device,
                trace_dir=trace_dir,
                seed=None if self.seed is None else self.seed + epoch * 100003,
            )
            if trace_samples != n_samples:
                generated_points = self.algorithm.sample(self.model, n_samples, self.device)
        else:
            generated_points = self.algorithm.sample(self.model, n_samples, self.device)
        generated_points_np = generated_points.cpu().numpy()
        
        # 计算评估指标
        from data_generator import evaluate_manifold_metrics
        turns = getattr(self.dataset, "turns", 3.0)
        avg_dist, uniformity, coverage = evaluate_manifold_metrics(
            generated_points,
            turns=turns,
            n_ref_samples=50000
        )
        print(f"    [评估结果] 双向倒角距离 (Chamfer Dist): {avg_dist:.6f} | 投影分步均匀度 (Entropy): {uniformity:.4f} | 流形覆盖率: {coverage:.2%}")
        
        # 记录评估指标，用于后期绘制指标曲线
        self.metric_epochs.append(epoch)
        self.dist_history.append(avg_dist)
        self.uniformity_history.append(uniformity)
        self.coverage_history.append(coverage)
        if self.visual_enabled:
            np.savez_compressed(
                os.path.join(self.visual_samples_dir, f"epoch_{epoch:04d}_samples.npz"),
                generated=generated_points_np,
                loss=np.asarray([current_loss], dtype=np.float32),
                chamfer=np.asarray([avg_dist], dtype=np.float32),
                uniformity=np.asarray([uniformity], dtype=np.float32),
                coverage=np.asarray([coverage], dtype=np.float32),
            )
            self._append_visual_jsonl("sample_metrics.jsonl", {
                "epoch": epoch,
                "loss": float(current_loss),
                "chamfer_distance": float(avg_dist),
                "uniformity_entropy": float(uniformity),
                "coverage": float(coverage),
                "sample_file": f"samples/epoch_{epoch:04d}_samples.npz",
                "trace_dir": f"sampling_traces/epoch_{epoch:04d}" if should_trace else None,
            })
        
        # 2. 获取原始数据用于对比
        original_points = self.dataset.data.numpy()
        # 随机抽取同等数量的样本点对比
        indices = np.random.choice(len(original_points), size=min(n_samples, len(original_points)), replace=False)
        original_subset = original_points[indices]
        
        # 3. 绘制并排对比图
        fig, axes = plt.subplots(1, 2, figsize=(12, 6))
        
        # 左图：真实分布
        axes[0].scatter(original_subset[:, 0], original_subset[:, 1], s=2, alpha=0.5, color='royalblue')
        axes[0].set_title("Original Conch Spiral Distribution")
        axes[0].set_xlim(-1.5, 1.5)
        axes[0].set_ylim(-1.5, 1.5)
        axes[0].axhline(0, color='black', linewidth=0.5, ls='--')
        axes[0].axvline(0, color='black', linewidth=0.5, ls='--')
        axes[0].grid(True, alpha=0.3)
        
        # 右图：模型生成分布
        axes[1].scatter(generated_points_np[:, 0], generated_points_np[:, 1], s=2, alpha=0.5, color='crimson')
        axes[1].set_title(f"Generated Distribution (Epoch {epoch})")
        axes[1].set_xlim(-1.5, 1.5)
        axes[1].set_ylim(-1.5, 1.5)
        axes[1].axhline(0, color='black', linewidth=0.5, ls='--')
        axes[1].axvline(0, color='black', linewidth=0.5, ls='--')
        axes[1].grid(True, alpha=0.3)
        
        # 总标题
        plt.suptitle(
            f"Epoch: {epoch} | Loss: {current_loss:.6f}\n"
            f"Chamfer Distance: {avg_dist:.6f} | Coverage: {coverage:.2%}",
            fontsize=12, y=0.98
        )
        plt.tight_layout()
        
        save_path = os.path.join(self.results_dir, f"generation_epoch_{epoch:03d}.png")
        plt.savefig(save_path, dpi=150)
        plt.close()
        print(f"    对比图已成功保存至: {save_path}")

    def plot_loss_curve(self):
        """
        绘制并保存 Loss 变化曲线
        """
        plt.figure(figsize=(8, 4))
        plt.plot(self.loss_history, color='forestgreen', label='Training Loss')
        plt.title("Training Loss Curve")
        plt.xlabel("Epoch")
        plt.ylabel("Loss")
        plt.grid(True, alpha=0.3)
        plt.legend()
        plt.tight_layout()
        
        save_path = os.path.join(self.results_dir, "loss_curve.png")
        plt.savefig(save_path, dpi=150)
        plt.close()
        print(f"Loss 曲线图已成功保存至: {save_path}")
        if self.visual_enabled:
            np.savez_compressed(
                os.path.join(self.visual_logs_dir, "loss_history.npz"),
                epoch_loss=np.asarray(self.loss_history, dtype=np.float32),
                batch_loss=np.asarray(self.batch_loss_history, dtype=np.float32),
                lr=np.asarray(self.lr_history, dtype=np.float32),
            )

    def save_checkpoint(self, epoch: int, loss: float):
        """
        保存当前模型和优化器的权重参数
        """
        state = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'loss': loss,
        }
        filename = f"checkpoint_epoch_{epoch:03d}.pt"
        filepath = os.path.join(self.checkpoint_dir, filename)
        torch.save(state, filepath)
        print(f"[*] 已保存模型 Checkpoint 到: {filepath}")

    def load_checkpoint(self, filepath: str):
        """
        从指定路径加载模型和优化器权重
        """
        checkpoint = torch.load(filepath, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        print(f"[*] 已成功从 {filepath} 恢复模型权重 (Epoch {checkpoint['epoch']}, Loss: {checkpoint['loss']:.6f})")
        return checkpoint['epoch']

    def plot_metrics_curves(self):
        """
        绘制并保存评估指标 (流形距离、均匀度、覆盖率) 的演期演化曲线图
        """
        if not self.metric_epochs:
            return
            
        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        
        # 1. 双向倒角距离 (Chamfer Distance)
        axes[0].plot(self.metric_epochs, self.dist_history, color='crimson', marker='o', linewidth=1.5, label='Chamfer Distance')
        axes[0].set_title("Chamfer Distance Curve", fontsize=11, fontweight='bold')
        axes[0].set_xlabel("Epoch", fontsize=10)
        axes[0].set_ylabel("Distance", fontsize=10)
        axes[0].grid(True, alpha=0.3)
        axes[0].legend()
        
        # 2. 投影分布均匀度 (Uniformity Entropy)
        axes[1].plot(self.metric_epochs, self.uniformity_history, color='royalblue', marker='s', linewidth=1.5, label='Uniformity (Entropy)')
        axes[1].set_title("Uniformity (Entropy) Curve", fontsize=11, fontweight='bold')
        axes[1].set_xlabel("Epoch", fontsize=10)
        axes[1].set_ylabel("Entropy", fontsize=10)
        axes[1].grid(True, alpha=0.3)
        axes[1].legend()
        
        # 3. 流形覆盖率 (Coverage)
        axes[2].plot(self.metric_epochs, [c * 100 for c in self.coverage_history], color='darkorange', marker='^', linewidth=1.5, label='Manifold Coverage (%)')
        axes[2].set_title("Manifold Coverage Curve", fontsize=11, fontweight='bold')
        axes[2].set_xlabel("Epoch", fontsize=10)
        axes[2].set_ylabel("Coverage (%)", fontsize=10)
        axes[2].grid(True, alpha=0.3)
        axes[2].legend()
        
        plt.suptitle(f"{self.algorithm_name.upper()} Generation Metrics Evolution", fontsize=14, fontweight='bold', y=1.02)
        plt.tight_layout()
        save_path = os.path.join(self.results_dir, "metrics_curve.png")
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"    评估指标曲线图已成功保存至: {save_path}")
        if self.visual_enabled:
            np.savez_compressed(
                os.path.join(self.visual_logs_dir, "metric_history.npz"),
                epochs=np.asarray(self.metric_epochs, dtype=np.int32),
                chamfer=np.asarray(self.dist_history, dtype=np.float32),
                uniformity=np.asarray(self.uniformity_history, dtype=np.float32),
                coverage=np.asarray(self.coverage_history, dtype=np.float32),
            )

    @torch.no_grad()
    def save_result_summary(self, total_time, final_loss):
        """
        生成最终运行总结报告 (result_summary.txt)，记录完整的超参和最终指标。
        """
        # 1. 确保有最终的评估指标。如果没有任何评估记录，则进行一次最终采样评估。
        if not self.dist_history:
            print(" -> 正在进行最终的指标采样评测...")
            n_samples = 5000
            generated_points = self.algorithm.sample(self.model, n_samples, self.device)
            from data_generator import evaluate_manifold_metrics
            turns = getattr(self.dataset, "turns", 3.0)
            avg_dist, uniformity, coverage = evaluate_manifold_metrics(
                generated_points,
                turns=turns,
                n_ref_samples=50000
            )
            self.metric_epochs.append(self.scheduler.T_max)
            self.dist_history.append(avg_dist)
            self.uniformity_history.append(uniformity)
            self.coverage_history.append(coverage)
        else:
            avg_dist = self.dist_history[-1]
            uniformity = self.uniformity_history[-1]
            coverage = self.coverage_history[-1]
            
        # 2. 提取模型架构参数
        try:
            hidden_dim = self.model.input_layer.out_features
            num_blocks = len(self.model.blocks)
            time_emb_dim = self.model.time_embed.mlp[-1].out_features
        except Exception:
            hidden_dim = "N/A"
            num_blocks = "N/A"
            time_emb_dim = "N/A"
            
        params_count = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        
        # 3. 准备写入总结文件
        import datetime
        summary_path = os.path.join(self.results_dir, "result_summary.txt")
        
        lines = [
            "=== 实验运行结果性信息汇总 (Result Summary) ===\n",
            f"生成时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n",
            "[基本信息]\n",
            f"算法名称 (Algorithm): {self.algorithm_name}\n",
            f"实验路径 (Experiment Dir): {self.results_dir}\n\n",
            "[模型架构]\n",
            f"隐藏层维度 (hidden_dim): {hidden_dim}\n",
            f"残差块数量 (num_blocks): {num_blocks}\n",
            f"时间嵌入维度 (time_emb_dim): {time_emb_dim}\n",
            f"模型参数量 (Params Count): {params_count:,}\n\n",
            "[训练配置]\n",
            f"训练轮数 (epochs): {self.scheduler.T_max}\n",
            f"批大小 (batch_size): {self.batch_size}\n",
            f"随机种子 (seed): {self.seed}\n",
            f"初始学习率 (initial_lr): {self.init_lr:.6e}\n",
            f"权重衰减 (weight_decay): {self.init_weight_decay:.6e}\n\n",
            "[最终评估指标]\n",
            f"训练总耗时 (Total Training Time): {total_time:.2f} 秒 ({total_time/60:.2f} 分钟)\n",
            f"最终训练 Loss (Final Loss): {final_loss:.6f}\n",
            f"双向倒角距离 (Chamfer Distance): {avg_dist:.6f}\n",
            f"投影分布均匀度 (Uniformity Entropy): {uniformity:.4f}\n",
            f"流形覆盖率 (Coverage): {coverage:.2%}\n"
        ]
        
        with open(summary_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
            
        print(f"[*] 结果汇总文本已成功写入至: {summary_path}")
