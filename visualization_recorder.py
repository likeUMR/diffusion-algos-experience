import json
import os
import time

import numpy as np
import torch


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)
    return path


def append_jsonl(path, record):
    ensure_dir(os.path.dirname(path))
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def write_json(path, payload):
    ensure_dir(os.path.dirname(path))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def _tensor_to_numpy(tensor):
    return tensor.detach().cpu().numpy()


def _save_trace(trace_dir, states, times, labels, meta):
    ensure_dir(trace_dir)
    states_np = np.stack([_tensor_to_numpy(state) for state in states], axis=0)
    np.savez_compressed(
        os.path.join(trace_dir, "sampling_trajectory.npz"),
        states=states_np,
        times=np.asarray(times, dtype=np.float32),
        labels=np.asarray(labels, dtype=object),
    )
    write_json(os.path.join(trace_dir, "sampling_trajectory_meta.json"), meta)


@torch.no_grad()
def sample_with_trace(algorithm, model, n_samples, device, trace_dir, seed=None):
    """
    Run the same sampler logic as each algorithm's sample() method, but keep every
    intermediate point cloud so the trajectory can be replayed or animated later.
    """
    if seed is not None:
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    was_training = model.training
    model.eval()
    class_name = algorithm.__class__.__name__
    states = []
    times = []
    labels = []

    def record(x, t_value, label):
        states.append(x.detach().clone().cpu())
        times.append(float(t_value))
        labels.append(label)

    if class_name in {"DDPM"}:
        x_t = torch.randn(n_samples, 2, device=device)
        record(x_t, algorithm.num_steps, "initial_noise")
        for step in reversed(range(algorithm.num_steps)):
            t = torch.full((n_samples,), step, device=device, dtype=torch.long)
            t_norm = t.float() / algorithm.num_steps
            predicted_noise = model(x_t, t_norm)
            sqrt_recip_alpha_t = algorithm._get_coefficient(algorithm.sqrt_recip_alpha, t, x_t.shape)
            beta_t = algorithm._get_coefficient(algorithm.beta, t, x_t.shape)
            sqrt_one_minus_alpha_bar_t = algorithm._get_coefficient(algorithm.sqrt_one_minus_alpha_bar, t, x_t.shape)
            mean = sqrt_recip_alpha_t * (x_t - (beta_t / sqrt_one_minus_alpha_bar_t) * predicted_noise)

            if step > 0:
                if algorithm.variance_type == "fixed_large":
                    variance = beta_t
                elif algorithm.variance_type == "fixed_small":
                    variance = algorithm._get_coefficient(algorithm.posterior_variance, t, x_t.shape)
                elif algorithm.variance_type == "fixed_geometric":
                    posterior_variance_t = algorithm._get_coefficient(algorithm.posterior_variance, t, x_t.shape)
                    variance = torch.sqrt(torch.clamp(beta_t * posterior_variance_t, min=1e-20))
                else:
                    raise ValueError(f"未知的 variance_type: {algorithm.variance_type}")
                x_t = mean + torch.sqrt(variance) * torch.randn_like(x_t)
            else:
                x_t = mean
            record(x_t, step, f"ddpm_step_{step}")

    elif class_name in {"DDIM", "AvgDDIM"}:
        if algorithm.sample_steps == 1:
            steps = torch.tensor([algorithm.num_steps - 1], device=device, dtype=torch.long)
        else:
            steps = torch.linspace(0, algorithm.num_steps - 1, algorithm.sample_steps).long().to(device)
        x_t = torch.randn(n_samples, 2, device=device)
        record(x_t, int(steps[-1].item()), "initial_noise")

        for k in reversed(range(algorithm.sample_steps)):
            t_idx = steps[k]
            t = torch.full((n_samples,), t_idx, device=device, dtype=torch.long)
            t_norm = t.float() / algorithm.num_steps
            predicted_noise = model(x_t, t_norm)
            alpha_bar_t = algorithm._get_coefficient(algorithm.alpha_bar, t, x_t.shape)
            if k > 0:
                s_idx = steps[k - 1]
                s = torch.full((n_samples,), s_idx, device=device, dtype=torch.long)
                alpha_bar_s = algorithm._get_coefficient(algorithm.alpha_bar, s, x_t.shape)
            else:
                alpha_bar_s = torch.ones_like(alpha_bar_t)

            pred_x_0 = (x_t - torch.sqrt(1.0 - alpha_bar_t) * predicted_noise) / torch.sqrt(alpha_bar_t)
            if k > 0 and algorithm.eta > 0:
                sigma_t = algorithm.eta * torch.sqrt((1.0 - alpha_bar_s) / (1.0 - alpha_bar_t)) * torch.sqrt(1.0 - alpha_bar_t / alpha_bar_s)
            else:
                sigma_t = torch.zeros_like(alpha_bar_t)
            dir_xt_coeff = torch.clamp(1.0 - alpha_bar_s - sigma_t ** 2, min=0.0)
            dir_xt = torch.sqrt(dir_xt_coeff) * predicted_noise
            if k > 0:
                x_t = torch.sqrt(alpha_bar_s) * pred_x_0 + dir_xt + sigma_t * torch.randn_like(x_t)
            else:
                x_t = torch.sqrt(alpha_bar_s) * pred_x_0 + dir_xt
            record(x_t, int(t_idx.item()), f"ddim_step_{k}")

    elif class_name == "VLearning":
        if algorithm.sample_steps == 1:
            steps = torch.tensor([algorithm.num_steps - 1], device=device, dtype=torch.long)
        else:
            steps = torch.linspace(0, algorithm.num_steps - 1, algorithm.sample_steps).long().to(device)
        x_t = torch.randn(n_samples, 2, device=device)
        record(x_t, int(steps[-1].item()), "initial_noise")

        for k in reversed(range(algorithm.sample_steps)):
            t_idx = steps[k]
            t = torch.full((n_samples,), t_idx, device=device, dtype=torch.long)
            t_norm = t.float() / algorithm.num_steps
            predicted_v = model(x_t, t_norm)
            alpha_bar_t = algorithm._get_coefficient(algorithm.alpha_bar, t, x_t.shape)
            alpha_t = torch.sqrt(alpha_bar_t)
            sigma_t = torch.sqrt(1.0 - alpha_bar_t)
            pred_x_0 = alpha_t * x_t - sigma_t * predicted_v
            predicted_noise = sigma_t * x_t + alpha_t * predicted_v

            if k > 0:
                s_idx = steps[k - 1]
                s = torch.full((n_samples,), s_idx, device=device, dtype=torch.long)
                alpha_bar_s = algorithm._get_coefficient(algorithm.alpha_bar, s, x_t.shape)
            else:
                alpha_bar_s = torch.ones_like(alpha_bar_t)
            if k > 0 and algorithm.eta > 0:
                sigma_ddim = algorithm.eta * torch.sqrt((1.0 - alpha_bar_s) / (1.0 - alpha_bar_t)) * torch.sqrt(1.0 - alpha_bar_t / alpha_bar_s)
            else:
                sigma_ddim = torch.zeros_like(alpha_bar_t)
            dir_xt_coeff = torch.clamp(1.0 - alpha_bar_s - sigma_ddim ** 2, min=0.0)
            dir_xt = torch.sqrt(dir_xt_coeff) * predicted_noise
            if k > 0:
                x_t = torch.sqrt(alpha_bar_s) * pred_x_0 + dir_xt + sigma_ddim * torch.randn_like(x_t)
            else:
                x_t = pred_x_0
            record(x_t, int(t_idx.item()), f"v_learning_step_{k}")

    elif class_name == "VDM":
        sigmas = algorithm._get_karras_sigmas(device)
        x_t = torch.randn(n_samples, 2, device=device) * sigmas[0]
        record(x_t, float(sigmas[0].item()), "initial_noise")
        for i in range(len(sigmas) - 1):
            sigma = sigmas[i]
            sigma_next = sigmas[i + 1]
            sigma_batch = torch.full((n_samples,), sigma.item(), device=device, dtype=torch.float32)
            t = algorithm._sigma_to_time(sigma_batch)
            predicted_noise = model(x_t, t)
            x_t = x_t + (sigma_next - sigma) * predicted_noise
            record(x_t, float(sigma_next.item()), f"vdm_sigma_step_{i}")

    elif class_name == "FlowMatching":
        x_t = torch.randn(n_samples, 2, device=device)
        record(x_t, 0.0, "initial_noise")
        dt = 1.0 / algorithm.num_steps
        for step in range(algorithm.num_steps):
            t_val = step * dt
            t = torch.full((n_samples,), t_val, device=device, dtype=torch.float32)
            vel = model(x_t, t)
            x_t = x_t + vel * dt
            record(x_t, t_val + dt, f"flow_step_{step}")

    elif class_name == "ConsistencyModels":
        x = algorithm.sigma_max * torch.randn(n_samples, 2, device=device)
        record(x, algorithm.sigma_max, "initial_noise")
        if algorithm.sample_steps <= 1:
            t_T = torch.full((n_samples,), algorithm.sigma_max, device=device, dtype=torch.float32)
            x = algorithm.get_consistency_output(model, x, t_T)
            record(x, 0.0, "consistency_projection")
        else:
            steps = torch.linspace(algorithm.sigma_max, algorithm.epsilon, algorithm.sample_steps, device=device)
            t_first = torch.full((n_samples,), steps[0], device=device, dtype=torch.float32)
            x = algorithm.get_consistency_output(model, x, t_first)
            record(x, float(steps[0].item()), "consistency_initial_projection")
            for k in range(1, algorithm.sample_steps):
                tau = steps[k]
                t_val = torch.full((n_samples,), tau, device=device, dtype=torch.float32)
                noise_scale = torch.sqrt(tau**2 - algorithm.epsilon**2)
                x = x + noise_scale * torch.randn_like(x)
                record(x, float(tau.item()), f"consistency_renoise_{k}")
                x = algorithm.get_consistency_output(model, x, t_val)
                record(x, float(tau.item()), f"consistency_projection_{k}")
        x_t = x

    elif class_name == "MeanFlow":
        z_t = torch.randn(n_samples, 2, device=device)
        record(z_t, 1.0, "initial_noise")
        if algorithm.num_steps == 1:
            r = torch.zeros(n_samples, device=device)
            t = torch.ones(n_samples, device=device)
            time_tensor = torch.stack([r, t], dim=-1)
            u = model(z_t, time_tensor)
            z_t = z_t - u
            record(z_t, 0.0, "mean_flow_one_step")
        else:
            dt = 1.0 / algorithm.num_steps
            for k in reversed(range(algorithm.num_steps)):
                t_val = (k + 1) * dt
                r_val = k * dt
                t = torch.full((n_samples,), t_val, device=device, dtype=torch.float32)
                r = torch.full((n_samples,), r_val, device=device, dtype=torch.float32)
                time_tensor = torch.stack([r, t], dim=-1)
                u = model(z_t, time_tensor)
                z_t = z_t - dt * u
                record(z_t, r_val, f"mean_flow_step_{k}")
        x_t = z_t

    else:
        x_t = algorithm.sample(model, n_samples=n_samples, device=device)
        record(x_t, 0.0, "final_only_fallback")

    meta = {
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        "algorithm_class": class_name,
        "n_samples": int(n_samples),
        "num_frames": len(states),
        "format": "states[frame, sample, xy], times[frame], labels[frame]",
    }
    _save_trace(trace_dir, states, times, labels, meta)

    if was_training:
        model.train()
    else:
        model.eval()
    return x_t
