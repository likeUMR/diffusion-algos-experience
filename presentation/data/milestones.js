/**
 * 扩散模型（Diffusion Models）演进时间轴 - 核心数据集
 * 包含：论文背景、核心数学公式（KaTeX格式）、原作指标、我的 HPO 复现实验结果
 */
const milestones = [
  {
    id: "m-ddpm",
    year: "2020.06",
    school: "trajectory",
    title: "DDPM (去噪扩散概率模型) —— 现代扩散基石工作",
    paper: "Denoising Diffusion Probabilistic Models",
    authors: "Jonathan Ho, Ajay Jain, Pieter Abbeel",
    venue: "NeurIPS 2020",
    link: "https://arxiv.org/abs/2006.11239",
    status: "扩散主流时代开启",
    bibtex: `@inproceedings{ho2020denoising,
  title={Denoising Diffusion Probabilistic Models},
  author={Ho, Jonathan and Jain, Ajay and Abbeel, Pieter},
  booktitle={Advances in Neural Information Processing Systems},
  volume={33},
  pages={6840--6851},
  year={2020}
}`,
    bg_breakthroughs: [
      "<b>核心痛点：</b> 传统的扩散模型（2015）由于数学推导繁复、训练极不稳定，难以在大尺度复杂图像上有效训练，采样也充斥着无法控制的偏置。",
      "<b>革命性突破：</b> 引入参数化的 U-Net，首创噪声预测参数化（Noise Prediction），并将复杂的极大变分下界（VLB）极限化简为极致优雅的 MSE 噪声均方误差损失函数。一举在 CIFAR-10 上超越 GAN 模型，惊艳学术界。"
    ],
    math_details: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">前向过程 (Forward Process)</span>
          <p class="text-[11px] text-slate-300">利用马尔可夫链自适应加噪。可直接一步写出任意时间步 $t$ 的加噪结果：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $q(x_t | x_0) = \\mathcal{N}(x_t; \\sqrt{\\bar{\\alpha}_t}x_0, (1 - \\bar{\\alpha}_t)I)$
          </div>
          <p class="text-[10px] text-slate-500">其中 $\\bar{\\alpha}_t = \\prod_{i=1}^t (1 - \\beta_i)$，$\\beta_i$ 为预设的方差 Schedule。</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">参数化损失函数 (Simplified Loss)</span>
          <p class="text-[11px] text-slate-300">不直接预测去噪后的 $x_0$，而是预测注入的噪声误差 $\\epsilon$：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\mathcal{L}_{\\text{simple}}(\\theta) = \\mathbb{E}_{t, x_0, \\epsilon} \\left[ \\| \\epsilon - \\epsilon_\\theta(x_t, t) \\|^2 \\right]$
          </div>
        </div>
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">逆向去噪采样 (Reverse Sampler)</span>
          <p class="text-[11px] text-slate-300">通过贝叶斯后验均值反向迭代去噪（每步重新注入高斯方差噪声 $z$）：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $x_{t-1} = \\frac{1}{\\sqrt{\\alpha_t}} \\left( x_t - \\frac{\\beta_t}{\\sqrt{1-\\bar{\\alpha}_t}} \\epsilon_\\theta(x_t, t) \\right) + \\sigma_t z \\quad (z \\sim \\mathcal{N}(0, I))$
          </div>
        </div>
      </div>
    `,
    original_metrics: [
      "在 CIFAR-10 数据集上拿下了当时的最高质量纪录：FID = 3.17, Inception Score = 9.46。",
      "生成分布完备，无 Mode Collapse 缺陷，具备强大的图像插值、超分可控性。",
      "<b>硬伤致命：</b> 必须使用 $T = 1000$ 步漫长马尔可夫链去噪（NFE = 1000），每产生一张图都需要网络前向 1000 次，推理延迟高达数秒甚至数十秒，难以直接应用。"
    ],
    my_experiments: {
      nfe_best: "100",
      metric_100: "0.007153",
      metric_20: "0.012836",
      metric_5: "0.027523",
      metric_1: "0.315131",
      best_hyper: "HxB = 128x3 | Epochs = 1000 | lr = 9.32e-4 | wd = 6.69e-5",
      insights: "在我们的 2D 窄流形螺旋线中，DDPM 在常规高步数下精度不凡（NFE=100，CD=0.0071），对高斯空间拓扑刻画极其精准。然而，由于去噪过程在逆向中每一步都必须重新注入方差噪声 $z$，因此在极限少步下（NFE=5, CD=0.0275），随机方差注入反而会导致轨迹偏离，致使海螺点云分散。在 NFE=1 下完全崩溃（CD=0.315），无法做单步生成。"
    }
  },
  {
    id: "m-ddim",
    year: "2020.10",
    school: "trajectory",
    title: "DDIM (去噪扩散隐式模型) —— 确定性概率流 ODE 的发端",
    paper: "Denoising Diffusion Implicit Models",
    authors: "Jiaming Song, Chenlin Meng, Stefano Ermon",
    venue: "ICLR 2021",
    link: "https://arxiv.org/abs/2010.02502",
    status: "推理加速先锋",
    bibtex: `@inproceedings{song2020denoising,
  title={Denoising Diffusion Implicit Models},
  author={Song, Jiaming and Meng, Chenlin and Ermon, Stefano},
  booktitle={International Conference on Learning Representations},
  year={2021}
}`,
    bg_breakthroughs: [
      "<b>核心痛点：</b> DDPM 每步去噪都引入高斯随机噪声，导致过程不能跨步，采样极慢。",
      "<b>革命性突破：</b> 提出了一种非马尔可夫的前向加噪假设，在训练损失函数完全不改动的情况下，推导出了完全确定性的去噪采样轨迹（通过令超参数 $\\eta = 0$）。将扩散逆向过程构建成了<b>确定性常微分方程（Probability Flow ODE）</b>的离散化求解。首次支持跨越采样步数，将 NFE 压缩了 50 倍而几乎无损图像质量。"
    ],
    math_details: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-amber-400 block mb-0.5">确定性去噪解方程 (Deterministic Sampler)</span>
          <p class="text-[11px] text-slate-300">当 $\\eta = 0$ 时，采样完全是隐式确定性的，其公式为：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $x_{t-1} = \\sqrt{\\bar{\\alpha}_{t-1}} \\left( \\frac{x_t - \\sqrt{1-\\bar{\\alpha}_t} \\epsilon_\\theta(x_t, t)}{\\sqrt{\\bar{\\alpha}_t}} \\right) + \\sqrt{1 - \\bar{\\alpha}_{t-1} - \\sigma_t^2} \\epsilon_\\theta(x_t, t) + \\sigma_t z$
          </div>
          <p class="text-[10px] text-slate-500">当 $\\sigma_t = 0$ 时，最后一项随机噪声消失，逆向过程变为纯 ODE 常微分路线。</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-amber-400 block mb-0.5">隐空间自洽性 (Latent Consistency)</span>
          <p class="text-[11px] text-slate-300">由于轨迹确定，DDIM 支持将图像无损编码至高斯噪声空间，并进行完美的隐空间插值语义漫游。</p>
        </div>
      </div>
    `,
    original_metrics: [
      "在 NFE = 20 到 50 步下，DDIM 的 FID 指标全面压倒了 DDPM 1000步的表现，采样速度狂飙 20-50 倍。",
      "开辟了确定性扩散采样的道路，直接催生了后续各种一阶、高阶高效常微分数值求解器（如 DPMSolver）。"
    ],
    my_experiments: {
      nfe_best: "100",
      metric_100: "0.007316",
      metric_20: "0.009754",
      metric_5: "0.022123",
      metric_1: "0.315133",
      best_hyper: "HxB = 128x3 | Epochs = 1000 | lr = 9.32e-4 | wd = 6.69e-5",
      insights: "在我们的螺旋线实验中，DDIM 展现了对 DDPM 绝对的少步压倒性优势：在 NFE=20 下，它能拿下极其精细的 CD=0.0097（而 DDPM 为 0.0128），去除了随机噪点飘飞，点云极为贴合。但在 NFE=1 下其依然完全崩溃（CD=0.315），因为确定性 ODE 步长如果被强行设为 1，网络直接使用单次直线近似跨越极度弯曲的去噪轨道，会发生极其严重的截断漂移误差，导致直接射向虚无高斯空间。"
    }
  },
  {
    id: "m-vdm",
    year: "2021.07",
    school: "trajectory",
    title: "VDM (变分扩散模型) —— 数学极致：自适应噪声调度与无损似然",
    paper: "Variational Diffusion Models",
    authors: "Diederik P. Kingma, Tim Salimans, Ben Poole, Jonathan Ho",
    venue: "NeurIPS 2021",
    link: "https://arxiv.org/abs/2107.00630",
    status: "数学大一统大作",
    bibtex: `@inproceedings{kingma2021variational,
  title={Variational Diffusion Models},
  author={Kingma, Diederik P and Salimans, Tim and Poole, Ben and Ho, Jonathan},
  booktitle={Advances in Neural Information Processing Systems},
  volume={34},
  pages={21696--21657},
  year={2021}
}`,
    bg_breakthroughs: [
      "<b>核心痛点：</b> 传统的加噪 schedule（$\\beta_t$）全部是死板手动调参设定的，并非最优化方案，导致似然下界难以逼近绝对极限。",
      "<b>革命性突破：</b> Kingma 等人从变分自编码器最底层的连续时间层级概率视角出发，把噪声 schedule 用信噪比 $\\text{log-SNR}$ 的单调网络进行参数化，实现了扩散模型噪声调度的端到端自适应联合训练。在数学上彻底将扩散模型完美纳回了标准的无损极大似然概率理论框架。"
    ],
    math_details: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-emerald-400 block mb-0.5">信噪比定义 (SNR Schedule Parameterization)</span>
          <p class="text-[11px] text-slate-300">定义 $\\gamma(t) = \\log (\\alpha_t^2 / \\sigma_t^2)$，通过单调递减网络参数化，将 schedule 与模型权重一同梯度回传优化。</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-emerald-400 block mb-0.5">连续时间积分损失 (Continuous VLB Loss)</span>
          <p class="text-[11px] text-slate-300">将传统离散求和 VLB 升级为连续时间积分形式，数学形式更为紧凑：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\mathcal{L}_{\\text{diff}} = -\\frac{1}{2} \\int_0^1 \\gamma'(t) \\mathbb{E} \\left[ \\|\\epsilon - \\epsilon_\\theta(x_t, t)\\|^2 \\right] dt$
          </div>
        </div>
      </div>
    `,
    original_metrics: [
      "在 CIFAR-10 上取得了难以企及的无损似然分值：bpd = 2.69，彻底颠覆了自回归模型在似然边界的垄断。",
      "证明了只要噪声调度足够优雅，扩散模型能在不损失任何表达精度的前提下，完美提炼数据分布。"
    ],
    my_experiments: {
      nfe_best: "100",
      metric_100: "0.020461",
      metric_20: "0.029408",
      metric_5: "0.119316",
      metric_1: "0.297290",
      best_hyper: "HxB = 128x3 | Epochs = 1000 | lr = 4.14e-3 | wd = 2.25e-4",
      insights: "在我们的螺旋线海螺测试中，VDM 能够收敛并对齐一维流形结构，NFE=100 下 CD = 0.0204。但我们发现 VDM 的训练收敛难度远高于 DDPM。由于其损失涉及连续时间积分，梯度伴随了更强烈的高频振荡，对学习率（LR）极其敏感（极易 NaN 崩溃）。在 NFE=5 极限少步下，由于自适应 SNR 在边缘离散化后产生了较大的方差，导致生成质量恶化（CD=0.1193），NFE=1 下亦告崩溃。"
    }
  },
  {
    id: "m-vpred",
    year: "2022.02",
    school: "trajectory",
    title: "V-Learning (速度预测扩散模型) —— Salimans & Ho 的少步生成金标准",
    paper: "Progressive Distillation for Fast Sampling of Diffusion Models",
    authors: "Tim Salimans, Jonathan Ho",
    venue: "ICLR 2022",
    link: "https://arxiv.org/abs/2202.00512",
    status: "极速蒸馏内核",
    bibtex: `@inproceedings{salimans2022progressive,
  title={Progressive Distillation for Fast Sampling of Diffusion Models},
  author={Salimans, Tim and Ho, Jonathan},
  booktitle={International Conference on Learning Representations},
  year={2022}
}`,
    bg_breakthroughs: [
      "<b>核心痛点：</b> 在 NFE < 10 的超极限少步采样下，模型去噪时预测噪声（$\\epsilon$）或直接预测无噪点（$x_0$）都会导致数值极值爆炸，引起剧烈颜色崩溃与伪影。",
      "<b>革命性突破：</b> 首次提出了革命性的 <b>$v$-prediction (速度预测)</b> 范式。网络不再预测噪声，转而预测运动速度向量 $v_t = \\alpha_t \\epsilon - \\sigma_t x_0$。此举不仅在数学上清除了极低与极高信噪比边缘的奇点问题，也成为后续“渐进式蒸馏 (Progressive Distillation)”和“流匹配 (Flow Matching)”的物理先祖机制。"
    ],
    math_details: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">速度向量定义 (Velocity Parameterization)</span>
          <p class="text-[11px] text-slate-300">设前向路径为 $x_t = \\alpha_t x_0 + \\sigma_t \\epsilon$，定义切线去噪速度 $v_t$ 为：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $v_t = \\alpha_t \\epsilon - \\sigma_t x_0$
          </div>
          <p class="text-[10px] text-slate-500">这表示切线方向上 $x_0$ 与误差噪声的无缝变分切变插值路径。</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">损失函数与采样还原</span>
          <p class="text-[11px] text-slate-300">直接对速度场进行 $L_2$ 回归，并在采样时通过 $\\hat{v}_t$ 完美还原干净图像：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\hat{x}_0 = \\alpha_t x_t - \\sigma_t v_\\theta(x_t, t) \\quad \\text{and} \\quad \\hat{\\epsilon} = \\sigma_t x_t + \\alpha_t v_\\theta(x_t, t)$
          </div>
        </div>
      </div>
    `,
    original_metrics: [
      "该工作提出的 V-Prediction 直接成为了 Stable Diffusion v2.x 版本的默认核心算法。",
      "基于该架构的 Progressive Distillation，首次在学术界成功实现了仅需 4 步到 8 步的极速高画质生图。"
    ],
    my_experiments: {
      nfe_best: "100",
      metric_100: "0.006168",
      metric_20: "0.010010",
      metric_5: "0.022269",
      metric_1: "0.310459",
      best_hyper: "HxB = 128x3 | Epochs = 1000 | lr = 9.32e-4 | wd = 6.69e-5",
      insights: "<b>实验神迹突破！</b> 在我们的 2D 螺旋窄流形测试中，V-learning (V-prediction) 取得了 <b>整个测试集在 NFE=100 下的最好成绩 (CD = 0.006168)</b>！螺旋点云轮廓无比尖锐、毫无杂点。原因在于速度预测机制在变分空间插值上极其平滑，对一维螺旋线的法向杂波起到了强烈的几何均值剪枝作用，让轨迹完美逼近窄流形。但因为 ODE 路径在离散大跨步下弯曲，在 NFE=1 下依旧无法完美一步跨过弯折，CD退化至 0.310。"
    }
  },
  {
    id: "m-flowmatching",
    year: "2022.10",
    school: "unified",
    title: "Flow Matching (流匹配) —— 直线最优传输大统一，当代工业级霸主",
    paper: "Flow Matching for Generative Modeling / Flow Straight and Fast",
    authors: "Yaron Lipman, Ricky T. Q. Chen, Heli Ben-Hamu, Maximilian Nickel, Matt Le / Xingchao Liu",
    venue: "ICLR 2023",
    link: "https://arxiv.org/abs/2210.02747",
    status: "当代最优传输大一统",
    bibtex: `@inproceedings{lipman2022flow,
  title={Flow Matching for Generative Modeling},
  author={Lipman, Yaron and Chen, Ricky T. Q. and Ben-Hamu, Heli and Nickel, Maximilian and Le, Matt},
  booktitle={International Conference on Learning Representations},
  year={2023}
}`,
    bg_breakthroughs: [
      "<b>核心痛点：</b> 经典扩散模型引入的马尔可夫噪声使得轨迹本质上是完全混乱弯曲（Highly Curved Paths）且充斥高频毛刺噪声的，数学公式推导亦多有赘余。",
      "<b>革命性突破：</b> 融合最优传输理论（Optimal Transport），<b>直接在噪声与真实数据之间拉了一条笔直的几何直线向量场 (Straight Paths)</b>。用平顺、确定、无损的整流速度场学习来颠覆去噪。直线向量路径意味着训练梯度极为平稳稳定，收敛速度飙升。今天 Flux, Stable Diffusion 3, Sora 等核心生图引擎均已全盘转向流匹配机制。"
    ],
    math_details: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-cyan-400 block mb-0.5">最优传输直线插值路径 (OT Straight Paths)</span>
          <p class="text-[11px] text-slate-300">直接定义纯直线概率流，其中 $t \\in [0, 1]$：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $x_t = (1 - t)x_0 + t x_1 \\quad \\text{with} \\quad u_t(x_t) = x_1 - x_0$
          </div>
          <p class="text-[10px] text-slate-500">这在几何学上完美拉直了生成通道，避免了任何多余的扩散随机弯折。</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-cyan-400 block mb-0.5">向量场回归损失 (Flow Matching Loss)</span>
          <p class="text-[11px] text-slate-300">神经网络回归预测的正是笔直速度场本身：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\mathcal{L}_{\\text{FM}}(\\theta) = \\mathbb{E}_{t, x_0, x_1} \\left[ \\| v_\\theta(x_t, t) - (x_1 - x_0) \\|^2 \\right]$
          </div>
        </div>
      </div>
    `,
    original_metrics: [
      "收敛极快：流匹配在大尺度数据集（如 ImageNet 512）上的训练开销不到传统扩散的 30%，生图步数也完美压缩到 10-15 步而指标无损。",
      "数学直观优雅，彻底抹平了连续时间常微分生图和最优传输理论的界限。"
    ],
    my_experiments: {
      nfe_best: "100",
      metric_100: "0.011699",
      metric_20: "0.023146",
      metric_5: "0.107568",
      metric_1: "0.225315",
      best_hyper: "HxB = 192x2 | Epochs = 640 | lr = 4.36e-4 | wd = 1.05e-7",
      insights: "我们的 HPO 证实：流匹配确实大幅拉直了向量场。在对齐算力的自适应配平策略下，它在 NFE=100 下取得 CD=0.0116，在 NFE=20 亦能取得极出色的 CD=0.0231。但 HPO 在 NFE=5 极限低步下，自动激活了<b>大模型少 Epochs 策略</b>（自适应折算模型尺寸为 512x2 巨无霸，仅跑 93 epochs，LR极低），展示出超强表征力。但由于常微分求解器在单步下（NFE=1）仍会将直线做离散大步计算（导致螺旋线稍微散开，CD = 0.225），这揭示了 ODE 近似对 1-NFE 依然是个死结。"
    }
  },
  {
    id: "m-consistency",
    year: "2023.03",
    school: "unified",
    title: "Consistency Models (一致性模型) —— 强悍的 1-Step 秒级生成先驱",
    paper: "Consistency Models",
    authors: "Yang Song (宋飏), Prafulla Dhariwal, Mark Chen, Ilya Sutskever",
    venue: "ICML 2023",
    link: "https://arxiv.org/abs/2303.01469",
    status: "单步秒级生图王者",
    bibtex: `@inproceedings{song2023consistency,
  title={Consistency Models},
  author={Song, Yang and Dhariwal, Prafulla ...},
  booktitle={International Conference on Machine Learning},
  year={2023}
}`,
    bg_breakthroughs: [
      "<b>核心痛点：</b> 扩散和流匹配不论怎么压缩，依然绕不开多步积分迭代的魔咒。单步生成（NFE=1）在数学公式定义上是崩毁的。",
      "<b>革命性突破：</b> 宋飏、Ilya 等人提出 Consistency Models。在逆向轨迹上直接确立一个<b>一致性映射函数</b>，不论粒子处于什么加噪时间点 $t$，网络能将其直接单步、强制、自一致投影到轨迹终点（无噪真实图像 $x_0$）。仅需 1 步前向直接获得高清图像，颠覆了离散数值积分采样的旧范式。由此技术直接繁衍出了 LCM 实时视频生图技术。"
    ],
    math_details: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">一致性自边界约束 (Consistency Property)</span>
          <p class="text-[11px] text-slate-300">强制建立边界映射，其中 $f_\\theta(x, \\epsilon) = x$（当噪声逼近 0 时，投影直接是自己）。</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">EMA 目标网络自一致性回归 (Consistency Loss)</span>
          <p class="text-[11px] text-slate-300">训练网络使得同个轨迹上的任意两点，在一致性函数 $f_\\theta$ 作用下具有相同的终点投影：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\mathcal{L}_{\\text{CD}}(\\theta, \\theta^-) = \\mathbb{E} \\left[ d(f_\\theta(x_{t_{i+1}}, t_{i+1}), f_{\\theta^-}(x_{t_i}, t_i)) \\right]$
          </div>
          <p class="text-[10px] text-slate-500">其中 $\\theta^-$ 为在线网络 $\\theta$ 的 EMA 教师副本，用以维持自一致一致性映射在空间上的超稳边界。</p>
        </div>
      </div>
    `,
    original_metrics: [
      "不需要依赖任何大型预训练模型的教师网络蒸馏，Consistency Models 能够在 1~2 步内输出较高质量、纹理清晰的画面。",
      "单步 FID 指标显著优于以往多种 1-NFE 方案，为实时渲染流水线提供了新的可能性。"
    ],
    my_experiments: {
      nfe_best: "1",
      metric_100: "0.371160",
      metric_20: "0.201568",
      metric_5: "0.107200",
      metric_1: "0.089832",
      best_hyper: "HxB = 128x3 | Epochs = 753 | lr = 9.32e-4 | wd = 6.69e-5",
      insights: "<b>性质反转现象：</b> 我们的 HPO 评测显示，Consistency Models 在 NFE = 1 下取得最佳效果（CD = 0.089832），显著优于 DDPM 在 NFE=1 下的结果（0.315），海螺线骨架在 1 步前向下即可形成。随着推理步数增大（NFE 升到 100），其 CD 指标反而退化至 0.3711。可能原因是：一致性模型专为单步投影训练，若用多步 ODE 求解器级联一致性映射函数，会产生累积投影方向偏离。"
    }
  },
  {
    id: "m-meanflow",
    year: "2025.12",
    school: "meanflow",
    title: "Mean Flows (均值流) —— 何恺明单网络无损单步大一统 (iMF)",
    paper: "Mean Flows: On the Challenges of Fastforward Generative Models",
    authors: "Zhengyang Geng, Yiyang Lu, Zongze Wu, Eli Shechtman, J. Zico Kolter, Kaiming He (何恺明)",
    venue: "arXiv 2025 (NeurIPS Oral)",
    link: "https://arxiv.org/abs/2512.02012",
    status: "单步与多步大圆满大一统",
    bibtex: `@article{geng2025improved,
  title={Improved Mean Flows: On the Challenges of Fastforward Generative Models},
  author={Geng, Zhengyang and Lu, Yiyang and Wu, Zongze and Shechtman, Eli and Kolter, J Zico and He, Kaiming},
  journal={arXiv preprint arXiv:2512.02012},
  year={2025}
}`,
    bg_breakthroughs: [
      "<b>核心痛点：</b> 一致性模型虽然单步出神入化，但训练极繁复不稳（重度依赖 EMA 及目标双网络或教师蒸馏），且多步采样直接退化。有没有可能直接在底层的微分几何上进行大一统，用最普通的单网络自然学出单步无损生图？",
      "<b>革命性突破：</b> 何恺明团队在 NeurIPS 2025 提出 Mean Flows（均值流）。该方法不再局限于工程层面的采样器修补，而是从几何定义上重新建模：放弃计算繁琐的、多步 ODE 中的“瞬时速度”，转而让神经网络直接预测噪声起点 $x_t$ 到无噪终点 $x_1$ 之间的<b>平均速度 (Mean Velocity) $u(x_t, t)$</b>。其均值流恒等式（MeanFlow Identity）使神经网络无需显式计算昂贵积分，通过单网络普通 MSE 回归即可进行参数化学习。在第二代 iMF 中，方法进一步解锁了 CFG 强度自适应，并在单步生成指标上取得较强表现。"
    ],
    math_details: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">平均速度定义 (Mean Velocity Definition)</span>
          <p class="text-[11px] text-slate-300">流匹配追求“瞬时速度 $v_t$”，而 Mean Flows 强迫网络直接学习整个轨迹积分的平均：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $u(x_t, t) = \\mathbb{E} [x_1 - x_0 | x_t]$
          </div>
          <p class="text-[10px] text-slate-500">这表示直接穿透去噪轨迹，顺着平均直方向完美一步拉直映射。</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">均值流恒等式 (MeanFlow Identity)</span>
          <p class="text-[11px] text-slate-300">如何避免繁重积分训练？论文证明了瞬时场与平均场在训练阶段的恒等性：通过普通的 L2 回归，均值自动收敛收缩于均值流目标，不加任何双网络依赖！</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\mathcal{L}_{\\text{MF}}(\\theta) = \\mathbb{E}_{t, x_0, x_1} \\left[ \\| u_\\theta(x_t, t) - (x_1 - x_0) \\|^2 \\right]$
          </div>
        </div>
      </div>
    `,
    original_metrics: [
      "在 ImageNet 256x256 完全不依赖预训练、无任何知识蒸馏的一步生成 (1-NFE) 极限评测中拿下了 <b>1.72 FID 的神级成绩</b>！",
      "彻底宣告了单网络单步生图质量完美反超多步传统扩散模型，掀起了新一轮生成式架构革命。"
    ],
    my_experiments: {
      nfe_best: "20",
      metric_100: "0.090188",
      metric_20: "0.089046",
      metric_5: "0.091873",
      metric_1: "0.107437",
      best_hyper: "HxB = 192x5 | Epochs = 276 | lr = 5.13e-4 | wd = 1.64e-5",
      insights: "<b>惊叹的“全天候稳健大一统”！</b> 在我们的螺旋线 HPO 中，Mean Flow（均值流）拿下了最不可思议的表现：<b>它的性能在所有步数（NFE = 1, 5, 20, 100）下竟然维持高度恒定稳定（CD 恒定在 0.089 ~ 0.107 之间）</b>！在单步 NFE=1 下，它取得了卓越的 CD=0.107，螺旋轮廓完备秒出；而且随着步数增大（NFE=20），它的 CD 不退化反而<b>收紧到 0.0890</b>。它完美兼顾了“单步生图极速”与“多步多阶积分高保真微调”的完美统一，是组会公认的真正数学大圆满大作！"
    }
  },
  {
    id: "m-avgddim",
    year: "2026.05",
    school: "trajectory",
    title: "Avg-DDIM (流形均值加噪隐式模型) —— 我想到的局部流形平滑去噪Idea",
    paper: "Avg-DDIM: Local Manifold Averaging for Denoising Diffusion Implicit Models",
    authors: "Myself (我的尝试工作)",
    venue: "Technical Report 2026",
    link: "#",
    status: "个人尝试的Idea",
    bibtex: `@article{avgddim2026local,
  title={Avg-DDIM: Local Manifold Averaging for Denoising Diffusion Implicit Models},
  author={Myself},
  journal={Technical Report},
  year={2026}
}`,
    bg_breakthroughs: [
      "<b>核心痛点：</b> 传统 DDIM 对每个真实数据 $x_0$ 独立构造去噪方向，但在窄流形或多解区域，同一个 $x_t$ 可能对应多个合理的 $x_0$ 解释。此时“某一个样本的最快方向”并不一定是稳定方向，网络会被不同样本方向反复拉扯，形成高方差、局部震荡的去噪场。",
      "<b>核心思想：</b> <b>我尝试引入 Avg-DDIM 机制</b>：目标不是追逐单样本最快方向，而是寻找让平均损失最低的<b>期望最快方向</b>。由于候选采样和加权平均的成本远低于完整训练中的反复反向传播，Avg-DDIM 将“平均”显式放到采样式目标构造侧：给定 $x_t$ 后，在局部流形附近抽取 $k$ 个候选 $x_0$，用 $q(x_t|x_0^{(i)})$ 的相对概率加权平均方向，从而降低训练多解性和方向冲突。代表配置使用 <b>k=30 + Gaussian candidate sampling (std=0.3)</b>。"
    ],
    math_details: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">概率加权平均目标 (Weighted Average Objective)</span>
          <p class="text-[11px] text-slate-300">给定同一个 $x_t$，用局部候选解释的概率加权平均构造期望噪声方向：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\mathcal{L}_{\\text{Avg-DDIM}}(\\theta) = \\mathbb{E}_{t, x_0, \\epsilon} \\left[ \\| \\epsilon_\\theta(x_t, t) - \\sum_{i=1}^k w_i \\epsilon_i \\|^2 \\right]$
          </div>
          <p class="text-[10px] text-slate-500">其中权重 $w_i \\propto q(x_t | x_0^{(i)}) \\cdot \\mathbb{I}_{\\text{Gauss}}(x_0^{(i)})$ 表示局部候选解释的相对可信度。k=1 时退化为原始 DDIM；k 增大时目标更接近期望方向。</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">局部流形一致性平滑 (Manifold Smoothing)</span>
          <p class="text-[11px] text-slate-300">高斯拒绝采样把候选点限制在当前样本附近，避免跨流形平均。它的作用是把多解方向压成一个更低方差的局部期望，从而减轻训练中的反复拉扯。</p>
        </div>
      </div>
    `,
    original_metrics: [
      "在 2D 螺旋线窄流形上取得了绝对的压倒性优势，尤其在常规步数下大幅刷写了 SOTA 数据。",
      "四个 NFE 桶的评测全面击败了原始 DDIM：NFE=100 倒角距离降低了 39.4%，NFE=20 降低了 20.7%，NFE=5 降低了 15.4%。"
    ],
    my_experiments: {
      nfe_best: "100",
      metric_100: "0.004435",
      metric_20: "0.007737",
      metric_5: "0.018706",
      metric_1: "0.288564",
      best_hyper: "k=30 | Gauss Sampling std=0.3 | HxB=128x3 | lr=9.32e-4 | wd=6.69e-5",
      insights: "<b>期望方向降低多解拉扯！</b> 实验显示，在 2D 螺旋线窄流形上，Avg-DDIM 通过局部候选平均把多个可能的单样本方向合成为更稳定的期望方向。代表配置 k=30 + Gaussian std=0.3 在 NFE=100/20/5 三个桶中全部取得当前最好结果（NFE=100: CD=0.0044，NFE=5: CD=0.0187）。它的边界也很清楚：NFE=1 时仍不如专为一步生成设计的 Consistency / Mean Flow，但相比原始 DDIM 仍降低了单步误差。"
    }
  }
];

// 将数据导出，以便 index.html 可以引入
if (typeof module !== 'undefined' && module.exports) {
  module.exports = milestones;
}
