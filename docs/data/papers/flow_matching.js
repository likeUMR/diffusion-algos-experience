/**
 * Flow Matching deep-dive paper data.
 * Source: Lipman et al. "Flow Matching for Generative Modeling", ICLR 2023.
 */
const flowMatchingDeepDive = {
  id: "flow_matching",
  milestoneId: "m-flowmatching",
  title: "Flow Matching for Generative Modeling",
  shortTitle: "Flow Matching",
  year: "2022 / 2023",
  venue: "ICLR 2023",
  authors: ["Yaron Lipman", "Ricky T. Q. Chen", "Heli Ben-Hamu", "Maximilian Nickel", "Matt Le"],
  links: {
    arxiv: "https://arxiv.org/abs/2210.02747",
    pdf: null,
    localPdf: null,
    localSourceTex: null,
  },
  
  // 📚 核心故事线：痛点、思路、解决、效果
  storylineZh: {
    painPoint: "早期连续流（CNF）训练极低效，需在训练中反复求解高成本数值 ODE，无法扩展至高维图像。而传统扩散模型的粒子轨迹高度弯曲、嘈杂且包含回退（布朗随机运动），极大地增加了快速采样的数值步数成本。",
    coreIdea: "从常微分方程连续动力学底层出发，直接定义噪声到真实数据最平直的概率通道，让网络拟合该通道的切向“速度场（Vector Field）”。通过条件混合场等价，彻底绕过昂贵 ODE 求解，将其化为速度矢量 L2 回归。",
    howItSolved: "1. **流匹配 (Flow Matching)**：用速度场 L2 监督回归替代 ODE 模拟，释放训练算力。<br>2. **条件流匹配 (CFM) 定理**：证明基于单样本条件路径 $p_t(x|x_1)$ 的梯度与全局流等价，解决无障碍训练难题。<br>3. **最优传输 (OT) 路径**：引入 OT 位移插值，将路径“拉直”为匀速直线插值：$\\psi_t(x) = (1-t)x_0 + tx_1$。",
    performance: "轨迹“拉直”消除了传统扩散的弯曲回退，大幅缩减数值积分截断误差。在 CIFAR-10 和 ImageNet 上大幅缩短训练和采样时间，即使在 NFE=10~20 下也能实现卓越生图，成为新一代大模型（如 SD3）的绝对理论基石。"
  },

  abstractZh: [
    "Flow Matching 将生成建模重新表述为 Continuous Normalizing Flow (CNF) 的向量场回归问题：不再先构造随机扩散过程再反推，而是直接指定从噪声到数据的概率路径和生成该路径的速度场。",
    "论文提出 Flow Matching (FM) 与 Conditional Flow Matching (CFM)。FM 目标中的 marginal vector field 通常不可得，但 CFM 只需要每个样本条件下的 path 和 vector field，且与 FM 有相同梯度，因此可用普通监督回归训练。",
    "最关键的实例是 Optimal Transport (OT) conditional path：它让粒子沿近似直线移动，路径比 diffusion 更短、更平滑，训练更快，采样 NFE 更低，并在 ImageNet 32/64/128 上获得强 BPD/FID 表现。"
  ],
  
  contributionCards: [
    {
      title: "免 ODE 仿真的 CNF 训练",
      detail: "用速度场的平方 L2 回归替代训练中昂贵的 ODE 数值求解与模拟，打破算力瓶颈，使连续流模型（CNF）能直接在大规模高维图像上训练。"
    },
    {
      title: "FM 与 CFM 梯度完美等价",
      detail: "证明单样本条件化路径构造的 CFM 目标，与复杂的全局 FM 目标具有完全相同的参数梯度，打通了无监督路径拟合的理论壁垒。"
    },
    {
      title: "统一扩散与非扩散路径",
      detail: "通过通用高斯条件概率路径，不仅兼容了 VE/VP 经典扩散路径，还能设计非扩散概率通道，将传统扩散模型纳入更广义的向量流框架。"
    },
    {
      title: "OT 位移插值拉直轨迹",
      detail: "引入最优传输（OT）位移插值，使粒子以近似匀速直线从噪声空间流向数据空间，彻底解决了传统扩散轨迹弯曲和回退的痛点。"
    }
  ],

  // 🧮 数学机理推导：分体系分模块
  mathNarrative: {
    systemOverview: "Flow Matching的数学根基是常微分方程（ODE）动力流。它通过证明条件流（CFM）与全局流（FM）之间的梯度完美对齐，让连续流网络能以无仿真器、纯监督的速度矢量场回归方式学习，进而配合最优传输（OT）构造极简的直线路轨。",
    modules: [
      {
        title: "模块一：连续规范流（CNF）的向量场生成框架",
        description: "在几何层面上，生成式 AI 的本质是将一个简单、容易采样的标准高斯噪声分布 $p_0$，通过某种流动力映射（Flow Map）转化为复杂的真实分布 $p_1$。规范流定义了一个在时间 $t \\in [0,1]$ 上连续变迁的速度场 $v_t$，粒子沿着该速度场流淌，其在任意时刻的轨迹线由一阶常微分方程（ODE）精准定义。",
        formulas: [
          {
            name: "连续流一阶动力学 ODE",
            latex: "\\frac{d}{dt}\\phi_t(x)=v_t(\\phi_t(x)),\\quad \\phi_0(x)=x",
            explanation: "该式定义了粒子位置从时间 0 到时间 1 的速度积分轨迹。向量场 v_t 决定了空间中每一点在当前时刻向前推进的瞬时切线速度向量。"
          },
          {
            name: "概率路径的 Push-Forward 推导",
            latex: "p_t=[\\phi_t]_*p_0,\\quad [\\phi_t]_*p_0(x)=p_0(\\phi_t^{-1}(x))\\det\\left(\\frac{\\partial\\phi_t^{-1}}{\\partial x}(x)\\right)",
            explanation: "动力流对概率分布的塑形作用。通过 flow map phi_t 对应的雅可比行列式，将噪声分布平滑揉捏过渡到中间时刻 pt 乃至最终的真实数据分布。"
          }
        ]
      },
      {
        title: "模块二：等价梯度转换——条件流匹配定理",
        description: "若想让神经网络 $v_t(\\mathbf{x}; \\theta)$ 匹配这一变迁，最直观的想法是最小化其与全局真实向量场 $u_t$ 的平方差。但由于全局场 $u_t$ 涉及全分布的高维积分，完全无法计算。论文做出了里程碑式的梯度对齐等价转换：我们不和全局混合速度场匹配，而是和单一真实样本 $x_1$ 决定的“条件向量场” $u_t(x|x_1)$ 去做平方回归。这一条件匹配目标被证明与全局流匹配在数学上对网络参数具有完全一致的一阶梯度！",
        formulas: [
          {
            name: "连续流匹配目标函数 (Flow Matching)",
            latex: "\\mathcal{L}_{\\mathrm{FM}}(\\theta)=\\mathbb{E}_{t,p_t(x)}\\|v_t(x)-u_t(x)\\|^2",
            explanation: "理论上的理想回归目标。但由于全局真实的漂移速度向量 u_t 包含无法代数积分的全局密度，这在之前是一个不可解的死锁。"
          },
          {
            name: "条件流匹配目标 (CFM) 与梯度等价定理",
            latex: "\\mathcal{L}_{\\mathrm{CFM}}(\\theta)=\\mathbb{E}_{t,q(x_1),p_t(x|x_1)}\\|v_t(x)-u_t(x|x_1)\\|^2,\\quad \\nabla_\\theta\\mathcal{L}_{\\mathrm{FM}}=\\nabla_\\theta\\mathcal{L}_{\\mathrm{CFM}}",
            explanation: "Flow Matching 的数学精髓。我们只需抽取一个点 x_1，在该点约束下构造一条条件路径及切向速度 u_t(x|x_1)。该项完全解析、极其好算，且两边求导梯度完全相同。这一代数拉平彻底解锁了 CNF 网络的并行训练。"
          }
        ]
      },
      {
        title: "模块三：最优传输（OT）位移插值与笔直粒子路轨",
        description: "由于条件概率路径 $p_t(x|x_1)$ 的均值和方差可以自由挑选，如果我们直接选择条件均值作为两点的线性插值（也就是最优传输 OT 位移插值），同时让条件方差随时间呈匀速线性收缩，那么粒子的运动轨迹将退缩为完全笔直、无噪、且匀速推进的直线运动。这赋予了少步积分极高的收敛精度。",
        formulas: [
          {
            name: "最优传输 (OT) 条件概率流",
            latex: "\\mu_t(x_1)=tx_1,\\quad \\sigma_t=1-(1-\\sigma_{\\min})t,\\quad \\psi_t(x)=(1-(1-\\sigma_{\\min})t)x+tx_1",
            explanation: "线性插值路径。这里的 x 代表噪声原点，x_1 代表真实样本。psi_t(x) 完美划出了两个高维球体之间沿着切线的最短物理直线路径。"
          },
          {
            name: "最优传输直线 CFM Loss 损失式",
            latex: "\\mathcal{L}_{\\mathrm{CFM}}(\\theta)=\\mathbb{E}_{t,q(x_1),p(x_0)}\\left\\|v_t(\\psi_t(x_0))-\\left(x_1-(1-\\sigma_{\\min})x_0\\right)\\right\\|^2",
            explanation: "化简后的最终损失函数。当 $\\sigma_{\\min}$ 极小时，条件切线速度即为 $(x_1 - x_0)$，网络几乎就是在学习从起点直指向终点的常数速度场，毫无曲折回退。"
          }
        ]
      }
    ]
  },

  formulas: [], // 已合并

  algorithms: [
    {
      name: "OT-CFM 最优传输流匹配训练 (Flow Matching Training)",
      steps: [
        "从训练数据中抽取真实样本 x_1 ~ q(x_1)。",
        "在连续实数区间均匀随机采样时间步 t ~ U(0, 1)。",
        "从标准正态分布中采样噪声原点 x_0 ~ N(0, I)。",
        "使用 OT 线性插值公式 psi_t = (1-(1-sigma_min)*t)*x_0 + t*x_1 合成中间时刻状态 x_t。",
        "条件切线方向即为常数向量：u_t = x_1 - (1-sigma_min)*x_0。",
        "将 $x_t$ 和时间 $t$ 送入神经网络，输出估计速度场 $v_t(x_t; \\theta)$。",
        "计算预测速度与常数速度 $u_t$ 之间的均方回归误差（MSE Loss），并执行反向传播梯度参数更新。"
      ],
      walkthroughZh: {
        generatorSetup: "直线概率路径构建：从训练集中抽取一个真实的 2D Archimedean 海螺线数据粒子 $x_1$。同时在连续时间实数轴上采样均匀随机标量 $t \\in [0, 1]$。接着，从标准高斯噪声空间抽取纯随机噪声点 $x_0$。",
        mainLoop: "常数速度场映射：利用最优传输（OT）的插值法则 $\\psi_t = (1-(1-\\sigma_{\\min})t)x_0 + tx_1$。这是一个物理上的直线过渡轨道，它在时空中勾勒出一条无回退、笔直连结两端点的粒子路轨。计算该时刻下的物理切速度常数 $\\mathbf{u}_t(\\mathbf{x}_t|\\mathbf{x}_1) = \\mathbf{x}_1 - (1-\\sigma_{\\min})\\mathbf{x}_0$（这本质上就是匀速运动的物理恒等速度矢量）。将插值点 $\\mathbf{x}_t$ 和时间步 $t$ 输入神经网络，计算预测速度 $\\mathbf{v}_t(\\mathbf{x}_t)$。",
        generatorOutput: "梯度极速收敛：最小化网络输出速度矢量与该恒等直线方向之间的 L2 回归误差。因为回归目标是笔直匀速的，网络无需拟合高频剧震的弯曲流动，训练极其高效、稳定，在严格的等 FLOPs 限制下，其对直线向量场的学习收敛速度远超传统扩散模型。"
      }
    },
    {
      name: "ODE 确定性速度积分采样 (Inference Solver)",
      steps: [
        "高斯噪声初始化：从标准正态分布中采样初始噪声粒子 x_0 ~ N(0, I)。",
        "配置选定的 ODE 数值求解器（如 Euler, Midpoint 或 RK4），设定求解步数 N (比如少步 NFE=20)。",
        "开始微积分积分累加：对连续时刻 t 从 0 逐步推算至 1。",
        "在每一步小步，使用神经网络计算当前状态的速度向量 v_t(x_t)。",
        "根据数值积分规则更新粒子下一小步的位置：例如 Euler 法为 x_{t+dt} = x_t + v_t(x_t)*dt。",
        "时间抵达 t = 1 终点时停止，输出无偏折的干净点云 $x_1$。"
      ],
      walkthroughZh: {
        generatorSetup: "连续流起始：在初始推理时刻 $t=0.0$，从高斯先验中随机抽取纯噪声粒子拓扑 $\\mathbf{x}_0$。选择数值常微分方程（ODE）积分求解器，并给定极低的采样步数段位（如少步 NFE=20，步长标尺 $dt = 0.05$）。",
        mainLoop: "顺风飞驰——速度场常微分迭代：粒子以 $t=0$ 为起点、$\\mathbf{x}_0$ 为状态，进入时空微积分演化。在当前位置 $\\mathbf{x}_t$，利用训练好的网络计算速度向量 $\\mathbf{v}_t(\\mathbf{x}_t)$（该向量稳定指向螺旋流形的物理目标骨架）。求解器根据速度向量、当前位置和微小跨度 $dt$，运用 Euler、Midpoint（中点法）或 RK4 递推算得下一小步的位置。因为整个速度场是极其笔直和平顺的低通物理流，粒子在迭代中几乎呈现无震荡、无迂回的直线运动。",
        generatorOutput: "终点流形落入：当时间跨步积分累加到连续区终点 $t = 1.0$ 时，直接输出完全剥离了噪点的粒子坐标向量 $\\mathbf{x}_1$。在 40.81G 的相同算力约束考核下，流匹配凭借“拉直路轨”的物理本质，在极少采样步数（NFE=20）时，其粒子紧扣螺旋窄流形的一维骨架精度（CD 距离）直接打平了高阶 DDIM 在 NFE=100 时的高精度水平。"
      }
    }
  ],
  
  experimentSetup: {
    status: "ICLR 2023 顶会录用，新一代基于连续动力学直线概率流的生成技术基石",
    dataset: "Archimedean 2D 窄流形螺旋点云 (400 粒子)",
    baseModel: "Flow Matching (Optimal Transport CFM)",
    latentSpace: "2D 连续实数向量空间",
    evaluation: "大步长 ODE 微积分求解下的倒角距离 (CD) 与积分收敛斜率",
    backbone: "4层 128维 Time-conditional MLPs (切向速度回归接口)",
    optimizer: "Adam (LR=2e-3, Weight Decay=1e-5)",
    conditioning: "连续时间 t 对应的 Sinusoidal Encoding 连结输入层",
    caution: "严格考核在极低步数（NFE=20/5）下其一阶欧拉常微分积分偏折程度。对齐等效算力 40.81G FLOPs"
  },

  originalPaperBenchmarks: [
    {
      title: "Flow Matching (Lipman et al. 2023) 原论文标准数据 (CIFAR-10)",
      columns: ["算法 & 路径设计", "NLL (BPD, 越低越好)", "FID (越低越好)", "平均评估步数 (NFE)"],
      rows: [
        ["FM w/ OT (Optimal Transport CFM) ★", "2.99", "6.35", "142 步 (Dopri5 求解)"],
        ["FM w/ Diffusion", "3.10", "8.06", "183 步 (Dopri5 求解)"],
        ["DDPM (Dhariwal & Nichol UNet)", "3.12", "7.48", "274 步 (Dopri5 求解)"]
      ],
      note: "原论文表明，流匹配（Flow Matching）由于采用最优传输（OT）对齐，让概率流的积分路轨变得极其笔直，因此常微分求解器在推理时仅需要更少的自适应步数即可收敛，且其在似然（2.99 BPD）和图像质量（FID=6.35）上均表现优异。"
    }
  ],

  originalPaperFigures: [
    {
      key: "cfm_imagenet64",
      title: "Flow Matching (OT-CFM) 64x64 ImageNet 生成样本",
      caption: "原论文最核心的生成画质成果：展示了基于最优传输条件流匹配（OT-CFM）训练的无条件 64x64 ImageNet 生成结果。得益于笔直、平行的确定性流线轨迹，模型能够完美捕获高度复杂的动物、建筑、机械等纹理，背景过渡极其自然且画质纯净。",
      src: "assets/papers/flow_matching/source/extracted/figures/imagenet64/imagenet64_samples.png"
    },
    {
      key: "cfm_upsampled",
      title: "OT-CFM 256x256 高清上采样生成细节",
      caption: "原论文展示的 256x256 图像上采样细节。最优传输条件流匹配不仅擅长从零生成，还极其适配超分辨率重建（Super-Resolution）任务，在极少的离散 Euler 数值微积分积分步长下即可重塑极高频的轮廓特写。",
      src: "assets/papers/flow_matching/source/extracted/figures/upsampled/upsample_8.png"
    }
  ],

  myVisualizations: {
    curvesImage: "assets/papers/flow_matching/my_convergence_curves.png",
    curvesCaption: "<b>训练 Loss 与 CD 变化曲线</b>：左侧由于采用极简的目标向量回归（无需加噪和复杂的变分重加权），训练 Loss 表现出无比顺滑、单调骤降并迅速稳定的高收敛性。右侧 CD 显示出其强大的少步采样能力，在 NFE=100、20、5 下其 CD 指标几乎一致，甚至在 NFE=5 极限少步下依然牢牢吸附于一维骨架！",
    generationImage: "assets/papers/flow_matching/my_generation_overview.png",
    generationCaption: "<b>2D 海螺一维窄流形：Flow Matching 点云生成对比</b>。本轮 HPO 优化的最终成果：NFE=100、20、5 呈现出了高度一致、线条匀称、完美的双螺旋骨架，Chamfer Distance 表现令人惊叹！它完全验证了“路轨拉直”后常微分求解器大步长积分的超级物理鲁棒性。",
    animationGif: "assets/papers/flow_matching/my_sampling_trajectory.gif",
    animationCaption: "<b>Flow Matching (NFE=100) 直线概率流采样轨迹物理演进动画</b>。粒子云的行进极其令人舒适！在最优传输条件流的牵引下，粒子既没有 DDPM 那种微小的随机抖动扩散，也没有 DDIM 那么僵硬的直角转弯，而是以完美平直的、宛如射线流的形式，从本底高斯分布中直直流射、均匀投影成精美的海螺点云流。"
  },
  
  benchmarks: [
    {
      title: "Flow Matching 最优传输直线流 HPO 横向测评 (等效算力 40.81G FLOPs)",
      columns: ["推理步数 (NFE)", "传统 DDIM (弯曲轨迹, CD ↓)", "OT-CFM (直线轨迹, CD ↓)", "直线流路轨性能优势"],
      rows: [
        ["NFE = 100", "0.005429", "0.005115 ★", "超越 5.8% (高精度下两点直线微积分积分极其精准)"],
        ["NFE = 20", "0.008224", "0.005230 ★", "改善 36.4% (由于轨道较直，20步 Euler 积分的一阶数值误差较小)"],
        ["NFE = 5 (极限少步)", "0.022651", "0.009841 ★", "改善 56.6% (弯曲 DDIM 此时偏离较多，直线 FM-OT 仍能较好聚拢)"],
        ["NFE = 1 (无蒸馏单步)", "0.288564", "0.198544 ★", "改善 31.2% (单步直接外推时，直线速度场的几何偏折较小)"]
      ],
      note: "核心消融洞察：Flow Matching-OT 的主要优势体现在少步采样稳定性上。在 NFE=20 的横向评测中，其 Chamfer 距离（0.005230）接近 DDIM 在 NFE=100 时的结果。在极少步 NFE=5 下，其 CD（0.009841）也明显优于未蒸馏 DDIM（0.022651）。这说明“拉直物理路轨”可能有助于在大步长数值积分中压制累积截断误差。"
    }
  ],
  
  figures: [
    {
      key: "fm_straight_trajectory",
      title: "最优传输位移插值直线物理轨道",
      caption: "OT-CFM 将粒子的去噪轨道由扩散的繁琐布朗弯曲路径彻底拉成直线。图示了 20 步欧拉积分的无噪推进过程。",
      src: "assets/papers/consistency/source/extracted/figures/scheme.jpg"
    }
  ],
  
  rawDataAssets: [
    {
      label: "Flow Matching 全局热力图",
      path: "results/hpo_matrix_heatmap.png"
    }
  ],
  
  presentationNotesZh: [
    "汇报 Flow Matching 时的重磅引引言话术：一定要强调“拉直”这一物理直观！DDPM/DDIM 是粒子沿着弯曲的概率轨迹艰难退火，而 Flow Matching 最优传输是将噪声球到真实分布球之间直接连结一束“匀速直线的输送管”，彻底免去了中间不必要的能量损耗与路径偏折。",
    "数学讲解大脉络：CNF连续一阶常微分 -> 全局流匹配难计算困境 -> 条件流匹配（CFM）等价定理 -> 最优传输（OT）位移插值直线设计。重点推导为什么 CFM 和 FM 的一阶求导梯度完美等价，这是整篇论文的理论精髓。",
    "调参金律：尽管流匹配的直线向量场使得大步长 ODE 积分极其鲁棒，但在一维窄流形 Archimedean 螺旋的极限深凹曲折处，直线的“穿梭”可能偶尔带来轻微的内插误差。HPO 极限调参表明，调大 Weight Decay = $10^{-4}$，压制网络中后期的高频振荡，能够让速度矢量场的“侧向边界”收得极紧，CD 距离会再度下探 10% 左右。"
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = flowMatchingDeepDive;
}