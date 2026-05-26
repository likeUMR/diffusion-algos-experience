import os
import json
import copy

def main():
    results_dir = "results"
    if not os.path.exists(results_dir):
        print(f"[!] Results directory '{results_dir}' not found.")
        return

    hpo_history = {100: {}, 20: {}, 5: {}, 1: {}}
    
    # Locate all hpo_run directories
    # Folders are of format hpo_run_{algo}_nfe_{nfe}
    for folder in os.listdir(results_dir):
        folder_path = os.path.join(results_dir, folder)
        if os.path.isdir(folder_path) and folder.startswith("hpo_run_"):
            parts = folder.replace("hpo_run_", "").split("_nfe_")
            if len(parts) == 2:
                algo = parts[0]
                try:
                    nfe = int(parts[1])
                except ValueError:
                    continue
                
                jsonl_path = os.path.join(folder_path, "trial_results.jsonl")
                if os.path.exists(jsonl_path):
                    trials = []
                    with open(jsonl_path, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if not line:
                                continue
                            try:
                                data = json.loads(line)
                                trial_num = data.get("trial")
                                status = data.get("status", "success")
                                
                                # Check if it failed
                                if status == "failed" or data.get("mean_dist") is None:
                                    trials.append({
                                        "trial": trial_num,
                                        "status": "failed",
                                        "failure_reason": data.get("failure_reason", "unknown"),
                                        "hidden_dim": data.get("hidden_dim"),
                                        "num_blocks": data.get("num_blocks"),
                                        "lr": data.get("lr"),
                                        "weight_decay": data.get("weight_decay"),
                                        "epochs": data.get("epochs")
                                    })
                                else:
                                    trials.append({
                                        "trial": trial_num,
                                        "status": "success",
                                        "cd": data.get("mean_dist"),
                                        "hidden_dim": data.get("hidden_dim"),
                                        "num_blocks": data.get("num_blocks"),
                                        "lr": data.get("lr"),
                                        "weight_decay": data.get("weight_decay"),
                                        "epochs": data.get("epochs")
                                    })
                            except Exception as e:
                                print(f"Error parsing line in {jsonl_path}: {e}")
                    
                    if trials:
                        # Sort trials by trial number
                        trials.sort(key=lambda x: x["trial"])
                        if nfe in hpo_history:
                            hpo_history[nfe][algo] = trials
            else:
                print(f"Skipping directory with unexpected format: {folder}")
                
    # Also, avg_ddim shares the same trial history as ddim, because they share the exact same training-time HPO!
    # Let's explicitly mirror ddim's trials into avg_ddim so that it is available under avg_ddim as well!
    for nfe in hpo_history:
        if "ddim" in hpo_history[nfe]:
            hpo_history[nfe]["avg_ddim"] = copy.deepcopy(hpo_history[nfe]["ddim"])
            
    # Serialize to JS format
    js_content = f"""/**
 * 扩散模型严格等效算力约束 HPO 寻优历程历史数据
 * 包含每个 NFE、算法下各个 Trial 的超参数配置与倒角距离 (Chamfer Distance)
 */
const hpoHistoryData = {json.dumps(hpo_history, indent=2, ensure_ascii=False)};

if (typeof module !== 'undefined' && module.exports) {{
  module.exports = hpoHistoryData;
}}
"""
    
    # Write to presentation/data/hpo_history.js and docs/data/hpo_history.js
    paths = [
        "presentation/data/hpo_history.js",
        "docs/data/hpo_history.js"
    ]
    
    for path in paths:
        dir_name = os.path.dirname(path)
        if os.path.exists(dir_name):
            with open(path, "w", encoding="utf-8") as f:
                f.write(js_content)
            print(f"[*] Successfully wrote HPO history to {path}")
        else:
            print(f"[!] Directory {dir_name} does not exist, skipped writing {path}")

if __name__ == "__main__":
    main()
