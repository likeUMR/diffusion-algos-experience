import os
import json
import numpy as np

INDEX_PATH = r"results\visual_replay_full_best\visual_replay_index.json"
OUTPUT_JS_PATH = r"presentation\data\visual_replay_data.js"
FINAL_GENERATED_POINTS = 5000
TRAJECTORY_POINTS = 2000
TRAJECTORY_MAX_FRAMES = 40
TRAJECTORY_FINAL_DENSE_FRAMES = 5

def load_jsonl(path):
    if not os.path.exists(path):
        return []
    records = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records

def downsample_list(items, target_num):
    n = len(items)
    if n <= target_num:
        return items
    indices = np.linspace(0, n - 1, target_num, dtype=int)
    return [items[i] for i in indices]

def main():
    if not os.path.exists(INDEX_PATH):
        print(f"Error: Index file not found at {INDEX_PATH}")
        return

    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        index_data = json.load(f)

    runs = index_data.get("runs", [])
    print(f"Found {len(runs)} runs in the visual replay index.")

    extracted_runs = {}
    ground_truth_points = None

    # We will use a fixed seed for reproducible downsampling
    np.random.seed(42)

    for i, run in enumerate(runs):
        algo = run["algorithm"]
        nfe = int(run["nfe"])
        exp_dir = run["experiment_dir"]

        print(f"[{i+1}/{len(runs)}] Extracting data for {algo} NFE={nfe} from {exp_dir}...")

        visual_dir = os.path.join(exp_dir, "visual_data")
        if not os.path.exists(visual_dir):
            print(f"  Warning: visual_data not found in {exp_dir}")
            continue

        # 1. Extract ground truth spiral points (only once)
        if ground_truth_points is None:
            ds_snapshot_path = os.path.join(visual_dir, "dataset_snapshot.npz")
            if os.path.exists(ds_snapshot_path):
                ds_data = np.load(ds_snapshot_path)
                full_gt = ds_data["data"]
                # Downsample to 800 points
                gt_idx = np.random.choice(len(full_gt), size=min(800, len(full_gt)), replace=False)
                # Convert to normal python list of [x, y] to be JSON-serializable and keep size small (round to 4 decimals)
                ground_truth_points = np.round(full_gt[gt_idx], 4).tolist()
                print(f"  Extracted ground truth: {len(ground_truth_points)} points.")

        # 2. Extract logs: epoch metrics (loss) and sample metrics
        epoch_metrics_path = os.path.join(visual_dir, "logs", "epoch_metrics.jsonl")
        epoch_metrics = load_jsonl(epoch_metrics_path)
        # Downsample loss to 100 points
        downsampled_loss = []
        for em in downsample_list(epoch_metrics, 100):
            downsampled_loss.append({
                "epoch": em["epoch"],
                "loss": round(em["avg_loss"], 6)
            })

        sample_metrics_path = os.path.join(visual_dir, "logs", "sample_metrics.jsonl")
        sample_metrics = load_jsonl(sample_metrics_path)
        formatted_sample_metrics = []
        last_epoch = 0
        for sm in sample_metrics:
            formatted_sample_metrics.append({
                "epoch": sm["epoch"],
                "loss": round(sm["loss"], 6),
                "chamfer": round(sm["chamfer_distance"], 6),
                "entropy": round(sm["uniformity_entropy"], 4),
                "coverage": round(sm["coverage"], 4)
            })
            last_epoch = max(last_epoch, sm["epoch"])

        # 3. Extract final generated points (from last epoch)
        final_sample_file = os.path.join(visual_dir, "samples", f"epoch_{last_epoch:04d}_samples.npz")
        final_points = []
        if os.path.exists(final_sample_file):
            sample_data = np.load(final_sample_file)
            generated = sample_data["generated"]
            # Keep enough samples for dense, presentation-quality point clouds.
            gen_idx = np.random.choice(len(generated), size=min(FINAL_GENERATED_POINTS, len(generated)), replace=False)
            final_points = np.round(generated[gen_idx], 4).tolist()
        else:
            print(f"  Warning: Final samples not found at {final_sample_file}")

        # 4. Extract denoising trajectory for animation.
        # NFE=100 can contain 101 frames, so cap exported frames to keep the page responsive.
        trajectory = None
        trajectory_path = os.path.join(visual_dir, "sampling_traces", f"epoch_{last_epoch:04d}", "sampling_trajectory.npz")
        if os.path.exists(trajectory_path):
            try:
                traj_data = np.load(trajectory_path, allow_pickle=True)
                states = traj_data["states"] # shape (num_frames, num_samples, 2)
                times = traj_data["times"]
                num_frames = states.shape[0]
                num_samples_in_traj = states.shape[1]
                
                target_traj_points = TRAJECTORY_POINTS
                traj_idx = np.random.choice(num_samples_in_traj, size=min(target_traj_points, num_samples_in_traj), replace=False)
                if nfe == 100 and num_frames > TRAJECTORY_FINAL_DENSE_FRAMES:
                    base_end = num_frames - TRAJECTORY_FINAL_DENSE_FRAMES - 1
                    base_idx = np.linspace(0, base_end, min(TRAJECTORY_MAX_FRAMES, base_end + 1), dtype=int)
                    final_idx = np.arange(num_frames - TRAJECTORY_FINAL_DENSE_FRAMES, num_frames, dtype=int)
                    frame_idx = np.unique(np.concatenate([base_idx, final_idx]))
                else:
                    frame_idx = np.linspace(0, num_frames - 1, min(TRAJECTORY_MAX_FRAMES, num_frames), dtype=int)
                    frame_idx = np.unique(frame_idx)
                
                frames = []
                exported_times = []
                exported_sample_t = []
                for f in frame_idx:
                    frame_points = states[f, traj_idx]
                    frames.append(np.round(frame_points, 4).tolist())
                    exported_times.append(float(times[f]))
                    # Use original sampler step progress as the cross-algorithm animation clock.
                    # Raw `times` may be DDPM step ids, normalized t, or VDM sigma values.
                    exported_sample_t.append(float(1.0 - f / max(1, num_frames - 1)))
                
                trajectory = {
                    "num_frames": len(frames),
                    "original_num_frames": int(num_frames),
                    "times": exported_times,
                    "sample_t": exported_sample_t,
                    "frames": frames
                }
                print(f"  Extracted trajectory: {len(frames)}/{num_frames} frames, {len(traj_idx)} points per frame.")
            except Exception as e:
                print(f"  Warning: failed to load trajectory from {trajectory_path}: {e}")
        else:
            print(f"  Warning: Trajectory file not found at {trajectory_path}")

        # Store run data
        if nfe not in extracted_runs:
            extracted_runs[nfe] = {}
        
        # Read learning rate, weight decay, epochs from visual_manifest.json
        manifest_path = os.path.join(visual_dir, "visual_manifest.json")
        initial_lr = 0.001
        weight_decay = 1e-4
        epochs = 1000
        if os.path.exists(manifest_path):
            try:
                with open(manifest_path, "r", encoding="utf-8") as mf:
                    m_data = json.load(mf)
                    initial_lr = m_data.get("initial_lr", 0.001)
                    weight_decay = m_data.get("weight_decay", 1e-4)
                    epochs = m_data.get("epochs", 1000)
            except Exception as e:
                print(f"  Warning: failed to read manifest {manifest_path}: {e}")

        # Read hidden_dim and num_blocks from result_summary.txt
        summary_path = os.path.join(exp_dir, "result_summary.txt")
        hidden_dim = 128
        num_blocks = 3
        if os.path.exists(summary_path):
            try:
                with open(summary_path, "r", encoding="utf-8") as sf:
                    for line in sf:
                        if "隐藏层维度" in line or "hidden_dim" in line:
                            hidden_dim = int(line.split(":")[-1].strip())
                        if "残差块数量" in line or "num_blocks" in line:
                            num_blocks = int(line.split(":")[-1].strip())
            except Exception as e:
                print(f"  Warning: failed to read summary {summary_path}: {e}")

        extracted_runs[nfe][algo] = {
            "hidden_dim": hidden_dim,
            "num_blocks": num_blocks,
            "lr": initial_lr,
            "weight_decay": weight_decay,
            "epochs": epochs,
            "loss_history": downsampled_loss,
            "metrics_history": formatted_sample_metrics,
            "generated_points": final_points,
            "trajectory": trajectory
        }

    # Save to a unified JS file
    print("Writing output JS file...")
    os.makedirs(os.path.dirname(OUTPUT_JS_PATH), exist_ok=True)
    
    js_content = f"""/**
 * Diffusion Training HPO & Visual Replay Aggregated Data
 * Generated automatically from results/visual_replay_full_best
 */
const visualReplayData = {{
  ground_truth: {json.dumps(ground_truth_points)},
  runs: {json.dumps(extracted_runs, separators=(',', ':'))}
}};

if (typeof module !== 'undefined' && module.exports) {{
  module.exports = visualReplayData;
}}
"""

    with open(OUTPUT_JS_PATH, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"Successfully generated {OUTPUT_JS_PATH}! File size: {os.path.getsize(OUTPUT_JS_PATH) / 1024:.2f} KB")

if __name__ == "__main__":
    main()
