import torch
import torch.nn as nn

from algorithms.ddim import DDIM


class AvgDDIM(DDIM):
    """
    Avg-DDIM uses DDIM/DDPM-style noisy training points, but replaces the
    noise target with a probability-weighted average over k candidate x0s.
    """
    def __init__(
        self,
        num_steps=100,
        sample_steps=20,
        eta=0.0,
        beta_start=1e-4,
        beta_end=0.02,
        avg_k=30,
        gaussian_candidate_sampling=False,
        gaussian_candidate_std=0.3,
        gaussian_candidate_proposals=256
    ):
        super().__init__(
            num_steps=num_steps,
            sample_steps=sample_steps,
            eta=eta,
            beta_start=beta_start,
            beta_end=beta_end
        )
        if avg_k < 1:
            raise ValueError("avg_k 必须 >= 1")
        if gaussian_candidate_std <= 0:
            raise ValueError("gaussian_candidate_std 必须 > 0")
        if gaussian_candidate_proposals < 1:
            raise ValueError("gaussian_candidate_proposals 必须 >= 1")
        self.avg_k = avg_k
        self.gaussian_candidate_sampling = gaussian_candidate_sampling
        self.gaussian_candidate_std = gaussian_candidate_std
        self.gaussian_candidate_proposals = gaussian_candidate_proposals
        self.data_bank = None

    def set_data_bank(self, data: torch.Tensor):
        self.data_bank = data.detach().clone()

    def _get_candidate_bank(self, x_0: torch.Tensor) -> torch.Tensor:
        if self.data_bank is None:
            return x_0
        if self.data_bank.device != x_0.device or self.data_bank.dtype != x_0.dtype:
            self.data_bank = self.data_bank.to(device=x_0.device, dtype=x_0.dtype)
        return self.data_bank

    def _sample_extra_x0(self, x_0: torch.Tensor, extra_count: int) -> torch.Tensor:
        batch_size = x_0.shape[0]
        device = x_0.device
        bank = self._get_candidate_bank(x_0)
        bank_size = bank.shape[0]

        if not self.gaussian_candidate_sampling:
            extra_indices = torch.randint(0, bank_size, (batch_size, extra_count), device=device)
            return bank[extra_indices]

        accepted = torch.empty(batch_size, extra_count, x_0.shape[-1], device=device, dtype=x_0.dtype)
        fill_counts = torch.zeros(batch_size, device=device, dtype=torch.long)
        sigma_sq = self.gaussian_candidate_std ** 2

        proposal_count = self.gaussian_candidate_proposals
        while torch.any(fill_counts < extra_count):
            active_rows = torch.nonzero(fill_counts < extra_count, as_tuple=False).flatten()
            candidate_indices = torch.randint(
                0,
                bank_size,
                (active_rows.numel(), proposal_count),
                device=device
            )
            candidates = bank[candidate_indices]
            centered = candidates - x_0[active_rows].unsqueeze(1)
            dist_sq = torch.sum(centered ** 2, dim=-1)
            accept_prob = torch.exp(-0.5 * dist_sq / sigma_sq)
            accept = torch.rand_like(accept_prob) < accept_prob

            for local_idx, row_idx in enumerate(active_rows.tolist()):
                accepted_candidates = candidates[local_idx][accept[local_idx]]
                if accepted_candidates.numel() == 0:
                    continue
                need = extra_count - int(fill_counts[row_idx].item())
                take = min(need, accepted_candidates.shape[0])
                start = fill_counts[row_idx]
                accepted[row_idx, start:start + take] = accepted_candidates[:take]
                fill_counts[row_idx] += take

        return accepted

    def compute_loss(self, model: nn.Module, x_0: torch.Tensor) -> torch.Tensor:
        batch_size = x_0.shape[0]
        device = x_0.device

        t = torch.randint(0, self.num_steps, (batch_size,), device=device)
        noise = torch.randn_like(x_0)

        sqrt_alpha_bar_t = self._get_coefficient(self.sqrt_alpha_bar, t, x_0.shape)
        sqrt_one_minus_alpha_bar_t = self._get_coefficient(self.sqrt_one_minus_alpha_bar, t, x_0.shape)
        x_t = sqrt_alpha_bar_t * x_0 + sqrt_one_minus_alpha_bar_t * noise

        extra_count = self.avg_k - 1
        if extra_count == 0:
            target_noise = noise
        else:
            extra_x0 = self._sample_extra_x0(x_0, extra_count)
            candidates = torch.cat([x_0.unsqueeze(1), extra_x0], dim=1)

            sqrt_alpha = sqrt_alpha_bar_t.unsqueeze(1)
            sqrt_one_minus_alpha = sqrt_one_minus_alpha_bar_t.unsqueeze(1).clamp_min(1e-12)
            candidate_noise = (x_t.unsqueeze(1) - sqrt_alpha * candidates) / sqrt_one_minus_alpha

            # q(x_t | x0) is isotropic Gaussian; constants cancel in softmax.
            log_probs = -0.5 * torch.sum(candidate_noise ** 2, dim=-1)
            weights = torch.softmax(log_probs, dim=1).unsqueeze(-1)
            target_noise = torch.sum(weights * candidate_noise, dim=1)

        t_norm = t.float() / self.num_steps
        predicted_noise = model(x_t, t_norm)
        return torch.mean((predicted_noise - target_noise) ** 2)
