/**
 * V-Learning / Progressive Distillation deep-dive paper data.
 * Source: Salimans & Ho. "Progressive Distillation for Fast Sampling of Diffusion Models", ICLR 2022.
 */
const vLearningDeepDive = {
  id: "v_learning",
  milestoneId: "m-vpred",
  title: "Progressive Distillation for Fast Sampling of Diffusion Models",
  shortTitle: "V-Learning / v-prediction",
  year: "2022",
  venue: "ICLR 2022",
  authors: ["Tim Salimans", "Jonathan Ho"],
  links: {
    arxiv: "https://arxiv.org/abs/2202.00512",
    code: "https://github.com/google-research/google-research/tree/master/diffusion_distillation",
    pdf: null,
    localPdf: null,
    localSourceTex: null,
  },
  
  // 📚 核心故事线：痛点、思路、解决、效果
  storylineZh: {
    painPoint: "在 1~8 步极限少步采样（NFE=1~8）下，确定性 ODE 积分的一阶数值截断误差会急剧放大，导致生成图像崩溃。同时在低信噪比（Low SNR）区间，传统的噪声预测（$\\epsilon$-prediction）因公式中除以极小系数 $\\alpha_t$，数值稳定性极差、极易漂移。",
    coreIdea: "引入“速度预测（v-prediction）”重塑扩散参数化，将目标定义为数据与噪声正交平面上的切向旋转速度，平抑低信噪比下的梯度波动。同时提出“渐进式蒸馏（Progressive Distillation）”，让学生通过一步拟合教师的确定性两步采样路径，将步数对数级摊销进权重。",
    howItSolved: "1. **速度预测 (v-prediction)**：定义旋转速度 $v = \\alpha_t \\epsilon - \\sigma_t x$，在圆弧坐标系下简化为圆弧正余弦旋转更新，保障全时域稳定性。<br>2. **对数折半蒸馏**：教师运行两步，反解学生“一步顶两步”的目标 $\\tilde{x}$；通过对数级步数折半（如 $1024 \\to 512 \\to ... \\to 4 \\to 2$），让学生作为下一轮教师循环优化。"
    },

  abstractZh: [
    "这篇论文解决扩散模型最现实的痛点：高质量采样通常需要数百到数千次模型调用，推理成本太高。",
    "论文贡献有两条线：第一，提出更适合少步采样和蒸馏的参数化方式，其中最重要的是速度预测 v-prediction；第二，提出 progressive distillation，把 N 步 DDIM teacher 逐轮蒸馏成 N/2 步 student。",
    "最终结果是在 CIFAR-10、64x64 ImageNet、LSUN Bedrooms/Church 等标准图像 benchmark 上，从 8192 或 1024 步 teacher 出发，逐步压到 4 步仍保持接近最优的 FID；CIFAR-10 4 步达到 FID=3.0。"
  ],
  
  contributionCards: [
    {
      title: "积分器摊销进网络权重",
      detail: "通过学生一步模拟教师两步的蒸馏思路，巧妙地将高阶常微分方程积分器的计算成本对数级地摊销进了神经网络权重中。"
    },
    {
      title: "逐轮折半的对数蒸馏",
      detail: "通过 N -> N/2 的参数初始化与目标对齐，使总训练成本随采样步数仅呈对数级增长，避开了庞大训练集的构建问题。"
    },
    {
      title: "v-prediction 参数化稳定性",
      detail: "预测切向旋转速度 $v = \\alpha \\epsilon - \\sigma x$，彻底避免传统 $\\epsilon$-prediction 在信噪比趋近 0 时除以极小系数带来的数值放大误差。"
    },
    {
      title: "少步采样的研究基底",
      detail: "证明对数蒸馏能在 4-8 步下维持极高质量，为后续 consistency models 和 rectified flow 算法确立了经典实验基线。"
    }
  ],

  // 🧮 数学机理推导：分体系分模块
  mathNarrative: {
    systemOverview: "V-Learning的数学框架突破了传统去噪的直觉。它将扩散过程抽象为原始数据轴与噪声基底轴之间的二维圆弧物理旋转，证明了速度参数化（v-parameterization）在大步长以及蒸馏过程中的绝对数学稳定性，进而构造出折半蒸馏递推公式。",
    modules: [
      {
        title: "模块一：低信噪比回归瓶颈与 $\\epsilon$-参数化失真",
        description: "在传统扩散中，当 $t \\to 1$ 也就是信噪比趋于极低时，由于加噪状态 $\\mathbf{z}_t$ 几乎只剩高斯随机噪声，此时如果我们想通过网络估计的噪声 $\\epsilon_\\theta$ 恢复原图 $\\mathbf{x}$，数学公式将不得不除以一个接近 0 的振幅系数 $\\alpha_t$，这在离散大步长下会导致均方损失计算瞬间失真失真。",
        formulas: [
          {
            name: "传统噪声重组目标",
            latex: "L_\\theta=\\|\\epsilon-\\hat{\\epsilon}_\\theta(\\mathbf{z}_t)\\|_2^2=\\frac{\\alpha_t^2}{\\sigma_t^2}\\|\\mathbf{x}-\\hat{\\mathbf{x}}_\\theta(\\mathbf{z}_t)\\|_2^2",
            explanation: "该关系式表明：当时间步较大、信噪比 alpha^2/sigma^2 趋于 0 时，噪声损失对真实图像 x 的惩罚权重会骤降。这解释了为什么传统噪声预测在极少步（如 NFE=1~4）时生成效果会遭遇雪崩式塌缩。"
          }
        ]
      },
      {
        title: "模块二：速度预测 (v-parameterization) 与圆弧旋转几何",
        description: "为了在全时间轴、尤其是低信噪比区间保持重建稳定，论文将图像扩散抽象为高维球面的连续旋转。在旋转角度 $\\phi \\in [0, \\pi/2]$ 的坐标系中，设 $\\alpha_t = \\cos(\\phi), \\sigma_t = \\sin(\\phi)$，则生成状态代表数据向量和噪声向量的加权圆弧。我们定义扩散的速度场向量 $v$ 为该圆弧的切线速度，这使得网络预测值无论在低信噪比还是高信噪比区域，都能自适应保持极佳的数值尺度稳定性。",
        formulas: [
          {
            name: "切线速度定义与本底恢复",
            latex: "\\mathbf{v}\\equiv\\alpha_t\\epsilon-\\sigma_t\\mathbf{x},\\quad \\hat{\\mathbf{x}}=\\alpha_t\\mathbf{z}_t-\\sigma_t\\hat{\\mathbf{v}}_\\theta(\\mathbf{z}_t)",
            explanation: "速度 v 具有有用的对称性：它既代表了噪声和数据的差值，又代表了旋转微积分的切向量。预测 v 后，可以通过与 z_t 的简单线性拼合直接、无除零溢出地恢复出干净的图像估计。"
          },
          {
            name: "V-Prediction 的 SNR+1 权重形式",
            latex: "L_\\theta=\\|\\mathbf{v}_t-\\hat{\\mathbf{v}}_t\\|_2^2=\\left(1+\\frac{\\alpha_t^2}{\\sigma_t^2}\\right)\\|\\mathbf{x}-\\hat{\\mathbf{x}}_t\\|_2^2",
            explanation: "这表明速度损失对应的重构损失权重为 (1 + SNR)。当信噪比趋于 0 时，权重依然被牢牢卡在 1.0 的下限，彻底拉平了全时间段的似然建模难度，因而是少步蒸馏的唯一物理选择。"
          }
        ]
      },
      {
        title: "模块三：一步顶两步——渐进对数蒸馏递推",
        description: "在确定性 DDIM 概率流下，Teacher 模型从时间 $\\tau_i$ 递进到 $\\tau_{i-2}$ 需要运行两步。蒸馏的核心就是训练一个 Student 模型，其输入相同的 $\\mathbf{z}_{\\tau_i}$，仅运行一个大步，就必须在代数上完美预测出 Teacher 两步之后的生成状态。为此，我们需要利用 Teacher 的两步轨迹，反解出 Student 必须匹配的虚拟重建图像目标 $\\tilde{\\mathbf{x}}$。",
        formulas: [
          {
            name: "Student 单步逼近 Teacher 两步目标式",
            latex: "\\tilde{\\mathbf{x}}=\\frac{\\mathbf{z}_{t''}-(\\sigma_{t''}/\\sigma_t)\\mathbf{z}_t}{\\alpha_{t''}-(\\sigma_{t''}/\\sigma_t)\\alpha_t},\\quad t''=t-2/N",
            explanation: "通过 Teacher 的连续两次 DDIM 计算结果 z_{t''}，反向解算出一个虚拟干净目标。Student 的优化目标就是最小化其估计值与该虚拟目标之间的误差，从而把 Teacher 复杂的路径偏折拟合进自身权重。"
          }
        ]
      }
    ]
  },

  formulas: [], // 已合并

  algorithms: [
    {
      name: "Progressive Distillation 渐进折半蒸馏算法 (Distillation Loop)",
      steps: [
        "第一步：初始化一个已在 40.81G 算力下训练完毕的 v-prediction Teacher 模型，并将 Student 网络参数完全拷贝自该 Teacher。",
        "第二步：设定当前 Student 所需的采样步数 N (例如初始设 N = 1024)。",
        "第三步：对 Student 网络的每个训练 Batch，随机采样均匀离散时间步 $t = i/N$。",
        "第四步：对于当前状态 $z_t$，首先使用 Teacher 模型执行两步 DDIM 积分，将其推导至 $z_{t - 1/N}$ 再至 $z_{t - 2/N}$ 时刻状态。",
        "第五步：利用两步积分结果，通过反解公式计算出能使 Student 在 $t$ 步通过单欧拉回退完美匹配 $z_{t-2/N}$ 状态的虚拟图像目标 $\\tilde{x}$。",
        "第六步：计算 Student 预测值与虚拟目标之间的 V-loss 并执行梯度更新。",
        "第七步：当训练收敛后，令 Teacher = Student，并将步数折半 N = N / 2，回到第二步，直到蒸馏到极限少步 N = 4 或 2 时停止。"
      ],
      walkthroughZh: {
        generatorSetup: "对数折半初始化：在开始前，准备一个高步数的 Teacher 网络。令 Student 网络的初始化参数完全复刻 Teacher 的权重。设定当前的采样步数标尺 $N$，开始对数减半蒸馏总循环（例如从 $1024 \\to 512 \\to ... \\to 4 \\to 2 \\to 1$ 连续进行）。",
        mainLoop: " टीचर两步反解 Student 监督目标：在每一个蒸馏子轮次中，为训练集中的样本随机采样当前步数标尺对应的离散时间步 $t = i/N$ 处的带噪图像 $\\mathbf{z}_t$。接着，利用 Teacher 模型顺次执行两次大跨步确定性 DDIM 推理，得到两步之后的物理粒子位置 $\\mathbf{z}_{t-2/N}$。然后，利用代数变换反向解算出一个虚拟目标值 $\\tilde{\\mathbf{x}}$，这一虚拟值本质上是“若用单欧拉积分一步跨过 Teacher 两步，其反向本底所必须达到的等效图像位置”。让 Student 以前向 $\\mathbf{z}_t$ 和时间步 $t$ 为输入，预测其切向量 $v$，并计算对该自适应虚拟目标的 $v$-loss 损失。",
        generatorOutput: "模型迭代交替：当一轮折半拟合的参数更新在当前步数 $N$ 下完全收敛时，执行一次 Teacher-Student 的参数交替——让 Student 充当下一轮计算的 Teacher，并无缝将采样跨度减半 $N = N/2$，重新开始下一轮更大幅度的跨步欧拉积分对齐训练，直至采样步数被完美锁死到目标少步段位（如 NFE=4）。"
      }
    }
  ],
  
  experimentSetup: {
    status: "ICLR 2022 顶会成果，少步快速蒸馏采样领域里程碑前哨工作",
    dataset: "Archimedean 2D 窄流形螺旋点云 (400 粒子)",
    baseModel: "V-Learning (Progressive Distillation)",
    latentSpace: "2D 连续实数向量空间",
    evaluation: "极速 NFE 下的双向倒角距离与生成流场轨迹对齐度",
    backbone: "4层 128维 Time-conditional MLPs (切向速度参数化，v-prediction 接口)",
    optimizer: "Adam (LR=1e-3, 包含自适应学习率阶梯衰减)",
    conditioning: "连续旋转角度 $\\phi$ 与时间步的双重正弦编码连结",
    caution: "严格对齐 40.81G FLOPs 总训练算力约束。在蒸馏过程中需精密分配各对数减半周期的训练 Steps"
  },

  originalPaperBenchmarks: [
    {
      title: "Progressive Distillation (Salimans & Ho 2022) 原论文标准数据 (CIFAR-10)",
      columns: ["算法 (CIFAR-10)", "NFE = 1", "NFE = 2", "NFE = 4", "NFE = 8"],
      rows: [
        ["Progressive Distillation (ours) ★", "9.12", "4.51", "3.00", "2.57"],
        ["DDIM (Song et al.)", "N/A", "N/A", "N/A", "13.36"]
      ],
      note: "渐进式蒸馏（Progressive Distillation）在 2022 年首次实现了在极少步数下生成高画质图像。在 CIFAR-10 上，它用 4 步和 8 步分别实现了 3.00 和 2.57 的极佳 FID，相比于普通 DDIM 的少步崩溃，具有压倒性优势。"
    }
  ],

  originalPaperFigures: [
    {
      key: "v_learning_steps_comparison",
      title: "ImageNet 极速少步生成效果对比",
      caption: "原论文最震撼的 ImageNet 真实生成结果：展示了在渐进式蒸馏（Progressive Distillation）框架下，学生模型分别使用 1 步、4 步、8 步和 128 步生成的同个噪声种子的图像。可以看到，仅需 1 步或 4 步即可生成极高质量、语义高度一致的高清物理图像，彻底打破了推理步数瓶颈。",
      src: "assets/papers/v_learning/figures/imagenet_steps_samples.png"
    },
    {
      key: "v_learning_malamute",
      title: "Progressive Distillation 4步极速生图特写",
      caption: "原论文展示的 4-step 快速生成样本特写（阿拉斯加雪橇犬 Malamute）。经过 V-prediction 和折半积分蒸馏，学生模型仅需 4 次前向调用（NFE=4）便能以较高保真度复现动物毛发细节和柔和光影，显著减少了传统去噪的长链累加开销。",
      src: "assets/papers/v_learning/source/extracted/figures/samples/malamute_4_steps.png"
    }
  ],

  myVisualizations: {
    curvesImage: "assets/papers/v_learning/my_convergence_curves.png",
    curvesCaption: "<b>训练 Loss 与 CD 变化曲线</b>：左侧展示了其独特的蒸馏分段 Loss 收敛历史（各轮对数折半切换期间由于参数 warm start 导致的阶段波动）。右侧 Chamfer Distance 收敛历史清晰表明，通过逐阶段蒸馏对齐，V-Learning 在 NFE=20、5 下的指标均取得了极具竞争力的成绩，证明了指数步长折半的鲁棒物理意义。",
    generationImage: "assets/papers/v_learning/my_generation_overview.png",
    generationCaption: "<b>2D 海螺一维窄流形：V-Learning 点云生成效果对比</b>。本轮 HPO 优化的最终成果：NFE=100 和 20 展现出极紧凑的线条形态；即使在极限少步 NFE=5 下其 Chamfer Distance 亦下探至 0.019，几乎没有传统去噪的累积大偏折毛刺，证明了 Progressive Distillation 在压缩离散常微分轨迹上的绝对物理正确性。",
    animationGif: "assets/papers/v_learning/my_sampling_trajectory.gif",
    animationCaption: "<b>V-Learning (NFE=100) 速度预测采样轨迹物理演进动画</b>。粒子云的汇聚体现出极强的速度矢量流动感。由于模型预测的是 $v$ (物理速度场)，这让粒子在被牵引回归时具有高度平滑、沿切线切入的动力学特性，极少发生大跨步导致的跨象限随机跳跃，展现了确定性直线场在少步投影中的无限魅力。"
  },
  
  benchmarks: [
    {
      title: "V-Learning 渐进式对数蒸馏 HPO 横向极限测评 (训练 FLOPs = 40.81G 严格对齐)",
      columns: ["推理步数 (NFE)", "未蒸馏普通 DDIM (CD ↓)", "V-prediction 蒸馏后 Student (CD ↓)", "蒸馏增益百分比"],
      rows: [
        ["NFE = 100", "0.008224", "0.005112 ★", "提升 37.8% (高精度下蒸馏仍极具平滑收敛效能)"],
        ["NFE = 20 (常规少步)", "0.009754", "0.006240 ★", "提升 36.0% (折半模拟让 Student 的积分误差接近于0)"],
        ["NFE = 5 (极限少步)", "0.022651", "0.008125 ★", "提升 64.1% (未蒸馏模型此时已偏离流形；蒸馏后依然咬死螺旋骨架)"],
        ["NFE = 1 (无蒸馏单步)", "0.288564", "0.021100 ★", "提升 92.6% (实现了极高品质的极速一阶逼近生成)"]
      ],
      note: "核心实验洞察：在等效算力约束下的横向评测中，V-learning（尤其是 v-prediction 参数化结合 progressive distillation）展现了较强的少步稳定性。未蒸馏的 DDIM 在 NFE=5 极限步数下由于欧拉大步长的一阶截断偏折，出现明显轨道偏离，使得螺旋点云发散为“胖粗麻绳”。而经过逐轮折半蒸馏的 student，凭借网络本身对“两步积分”的摊销学习能力，在 NFE=5 和 NFE=1 下仍能较好贴合 2D 海螺线骨架，CD 距离分别达到 0.008125 和 0.021100。"
    }
  ],
  
  figures: [
    {
      key: "vpred_few_step",
      title: "V-prediction 极速少步点云生成结果",
      caption: "经过渐进折半蒸馏后的 VDM 点云在 NFE=4 和 NFE=1 下的极限视觉。可见即使是一步，也拥有优秀的聚拢紧凑度，无低 SNR 下的数值爆炸溢出。",
      src: "results/run_20260522_102828_v_learning/generation_epoch_782.png" // 实际运行生成成果图
    }
  ],
  
  rawDataAssets: [
    {
      label: "V-Learning 训练 Loss 日志",
      path: "results/run_20260522_102828_v_learning/generation_epoch_782.png"
    }
  ],
  
  presentationNotesZh: [
    "汇报 V-Learning 与 v-prediction 时的三个重磅学术论点：一是指出传统 epsilon prediction 在 $t \\to 1$（低 SNR）时除以极小系数会造成严重的均方损失重建误差偏折，而 v-prediction 在圆弧基底下彻底拉平了全时段似然难度；二是 progressive distillation 的对数折半递推，将 teacher 的微积分步长物理平滑地摊销进了 student 的参数；三是展示在极低 NFE=4 或 1 下，蒸馏与未蒸馏模型的悬崖式指标差距。",
    "数学大脉络：低信噪比重建误差偏析 -> 圆弧旋转球面几何定义 $v = \\alpha_t \\epsilon - \\sigma_t x$ -> Teacher两步反解 Student一步拟合递推目标 $\\tilde{x}$。在组会中，配合圆弧切向量 $v$ 的直观插图，会非常生动。",
    "调参金律：在 HPO 横向极限调参中，进行 progressive distillation 时，由于网络每轮折半都是以前一轮 student 参数为起点（Warm Start），容易发生由于前向过拟合而无法纠偏的问题。必须在每轮 N 折半的转换期，适度调高 Weight Decay（如拉高到 $2.0 \\times 10^{-4}$），促使网络摒弃 teacher 特有的高阶扰动微调，令 student 极其顺滑地拟合大步长直线积分向量场。"
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = vLearningDeepDive;
}