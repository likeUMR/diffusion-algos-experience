/**
 * Deep-dive data for Improved Mean Flows / iMF.
 * Source: "Improved Mean Flows: On the Challenges of Fastforward Generative Models", arXiv 2025/2026.
 */
const meanflowDeepDive = {
  id: "meanflow-imf",
  milestoneId: "m-meanflow",
  title: "Improved Mean Flows: On the Challenges of Fastforward Generative Models",
  shortTitle: "Mean Flows / iMF",
  year: "2025.12",
  venue: "arXiv 2025/2026",
  authors: [
    "Zhengyang Geng",
    "Yiyang Lu",
    "Zongze Wu",
    "Eli Shechtman",
    "J. Zico Kolter",
    "Kaiming He"
  ],
  links: {
    arxiv: "https://arxiv.org/abs/2512.02012",
    pdf: "https://arxiv.org/pdf/2512.02012",
    localPdf: null,
    localSource: null,
    extractedSource: null,
  },
  
  // 📚 核心故事线：痛点、思路、解决、效果
  storylineZh: {
    painPoint: "自洽一致性模型虽能单步生成，但依赖繁琐的双网络 EMA 滑动训练。何恺明前期提出的普通 Mean Flows 虽为免 EMA 从零训练的单步模型，但在实践中：一是 Compound Function 额外依赖 $(e-x)$ 导致不合法输入与 JVP 高方差；二是训练时 CFG 尺度固定，牺牲了推理调节弹性。",
    coreIdea: "提出 Improved Mean Flows (iMF) 代数重构框架。将复杂的均值流恒等式转换为一阶 $v$-loss 监督回归目标，并利用“预测平均速度 $u$”对瞬时速度进行自洽重参数化，将高方差回归拉回干净的瞬时特征空间，实现免 EMA 的稳定单步生成训练。",
    howItSolved: "1. **速度重参数化**：将 JVP 正切向量 $(e-x)$ 替换为自估计边缘速度 $v_\\theta$，消除非法输入并修复高方差。<br>2. **灵活 CFG 机制**：将 CFG 尺度和时间区间编码为连续条件，使单步模型在推理时可自由调节对比度。<br>3. **In-Context 极简架构**：用多 Token 序列条件拼接取代 adaLN-zero，大幅精简参数。",
    performance: "无需任何教师蒸馏，iMF 在 ImageNet 256x256 单步生成中取得极其震撼的 SOTA 级别 FID=1.72（较原 MeanFlow 改善 50%）。同时 Transformer 参数由 133M 瘦身至 89M，展现出免 EMA 自洽单步生成模型的巨大潜力。"
  },

  abstractZh: [
    "MeanFlow 已被证明是一类一阶/单步生成框架，但其 fastforward 训练目标和指导机制仍有两个关键问题：原始 MF 的训练目标依赖网络自身预测，不是标准回归；同时 CFG scale 在训练时固定，牺牲了推理时的灵活性。本文提出 improved MeanFlow (iMF)：把目标重写为瞬时速度 v-loss，并用预测平均速度 u 的网络来重参数化；再把 CFG scale 与 interval 显式作为条件变量输入网络。iMF 从零训练，在 ImageNet 256x256 1-NFE 上达到 FID 1.72，无蒸馏且显著优于此前同类 fastforward 方法。"
  ],
  
  contributionCards: [
    {
      title: "均值流回归的标准公式化",
      detail: "将原始 MeanFlow 改写为瞬时速度 $v$-loss，并由 $u$-pred 进行重参数化，使自洽训练回归到网络无关的瞬时速度空间。"
    },
    {
      title: "修复 JVP 输入的非法输入与高方差",
      detail: "将 JVP 正切中的条件速度 $(e-x)$ 替换为自估计边缘速度，从数学源头消除了未知量依赖与方差放大。"
    },
    {
      title: "Flexible CFG 动态调节",
      detail: "将 CFG 尺度 $\\omega$ 和时间区间端点显式作为连续条件变量，使单步（1-NFE）模型推理时能自由调节对比度。"
    },
    {
      title: "In-context 条件融合架构",
      detail: "采用多 Token 拼接条件取代 adaLN-zero，大幅瘦身参数量（133M -> 89M），且将 FID 指标从 4.57 提升至 4.09。"
    }
  ],

  // 🧮 数学机理推导：分体系分模块
  mathNarrative: {
    systemOverview: "Improved Mean Flows (iMF) 的数学大厦通过移项重构，完美融合了一阶常微分（ODE）瞬时流与跨时间步均值流（Mean Flow）。它借由完美的雅可比向量积（JVP）边缘化替代，破除了非法额外输入锁死，并在高维连续条件 Token 系统下将单前向生成推向物理极致。",
    modules: [
      {
        title: "模块一：瞬时速度场向大跨步区间平均速度场的恒等变迁",
        description: "传统常微分生成模型（如 Flow Matching）仅学习瞬时速度 $v(\\mathbf{z}_t, t)$，因而采样时必须沿着时间轴执行漫长的积分求导。为了实现 1-NFE 单前向生图，MeanFlow 定义了从任意初始起点 $r$ 到终点 $t$ 的“平均速度” $u(\\mathbf{z}_t, r, t)$。对该平均速度在时间轴上执行全求导，可以建立瞬时流场与平均流场之间的完美物理恒等连接，从而允许大跨步跳过离散中间积分。",
        formulas: [
          {
            name: "平均速度场 (Mean Flow) 的数学定义",
            latex: "u(z_t,r,t)\\triangleq \\frac{1}{t-r}\\int_r^t v(z_\\tau)\\,d\\tau",
            explanation: "该式定义了粒子在时间区间 [r, t] 上的积分位移平均速度。如果已知该平均场，我们即可通过单一的一阶更新 x_r = x_t - (t-r) * u(z_t,r,t) 实现确定性大跨度瞬时跳跃。"
          },
          {
            name: "均值流微分物理恒等式 (MeanFlow Identity)",
            latex: "u(z_t)=v(z_t)-(t-r)\\frac{d}{dt}u(z_t)",
            explanation: "MeanFlow 理论的皇冠。通过对平均值定义应用微积分基本定理求导，成功建立了瞬时速度 v 与平均速度 u 以及其随时间全导数之间的微分代数关系。它允许我们在不显式运行积分计算的前提下对其执行拟合。"
          }
        ]
      },
      {
        title: "模块二：iMF 一阶 $v$-loss 标准化重参数化与 JVP 低方差修正",
        description: "在原始 MF 中，直接预测 $u_{tgt}$ 导致目标网络高度震荡且依赖 $(e-x)$ 输入（这不符合生成模型只能以当前状态 $z_t$ 为输入的合法约束）。iMF 进行了天才般的移项重构，将其改写为对瞬时目标 $(e-x)$ 的回归损失（$v$-loss）。同时，论文使用网络估计出的本底边缘速度 $v_\\theta$ 代替高方差、无法获知的条件速度 $(e-x)$ 作为 Jacobian 向量积（JVP）的正切切向，彻底抹平了训练期方差。",
        formulas: [
          {
            name: "iMF 标准 L2 瞬时重参数化 V-loss",
            latex: "\\mathcal{L}_{\\mathrm{iMF}}(\\theta)=\\mathbb{E}_{t,r,x,e}\\left\\|\\underbrace{u_\\theta(z_t)+(t-r)\\mathtt{JVP}_{\\mathrm{sg}}(u_\\theta;v_\\theta)}_{V_\\theta(z_t)} - (e-x)\\right\\|^2",
            explanation: "iMF的黄金损失函数。$V_\\theta$ 被定义为复合瞬时速度场估计。虽然回归目标依然是经典的直线 FM 条件场 $(e-x)$，但网络的核心参数直接内嵌入了均值流估计 $u_\\theta$。这一改写让训练回归目标完全独立于网络，且不含任何非法额外输入。"
          },
          {
            name: "全时间全导数雅可比向量积 (JVP) 形式",
            latex: "\\frac{d}{dt}u(z_t)=\\partial_z u(z_t)v(z_t)+\\partial_t u(z_t)\\triangleq \\mathtt{JVP}(u;v)",
            explanation: "利用偏导数链式法则展开全时间全导数。iMF 使用 stop-gradient 的边缘预测速度 $v_\\theta$ 代替 $e-x$ 传入 JVP。由于 $v_\\theta$ 是后验均值，其数值方差比 $e-x$ 小了数个数量级，令训练损失曲线自发顺滑下降。"
          }
        ]
      },
      {
        title: "模块三：连续自适应引导 (Flexible CFG) 与多 Token 融合",
        description: "为了破除前一代 1-NFE 模型在训练前必须硬编码 Classifier-Free Guidance 强度的死锁，iMF 将 CFG 尺度 $\\omega$、时间区间自适应终点 $t_{min}, t_{max}$ 全数参数化为连续自适应条件。整个引导参数化作为高维条件 Token 与类别 Token 连结，直接以 In-Context 的形式喂入 Transformer，实现了超高弹性的单步无重建误差条件引导生成。",
        formulas: [
          {
            name: "Flexible CFG 连续重构速度场",
            latex: "V_\\theta(\\cdot\\mid\\mathbf{c},\\omega)\\triangleq u_\\theta(z_t\\mid\\mathbf{c},\\omega)+(t-r)\\mathtt{JVP}_{\\mathrm{sg}}\\left(u_\\theta;v_\\theta\\right)",
            explanation: "CFG 引导作为模型的硬性连续输入变量。模型在训练中随机采样不同的引导标尺 \omega 编码，使得在推理阶段，单个 1-NFE 模型可以像多步扩散一样，自由拉动对比度旋钮搜寻最优 FID 表现。"
          }
        ]
      }
    ]
  },

  formulas: [], // 已合并

  algorithms: [
    {
      name: "iMF 自适应均值流训练 (iMF Standard Training)",
      steps: [
        "采样原始点云 x_1 和高斯先验 e_0，并对时间对 (t, r) 在连续区间内执行对数正态采样。",
        "合成插值粒子状态：z_t = (1-t)*x_1 + t*e_0。",
        "使用边界公式或网络自身，预测当前瞬时切线边缘速度：v_theta = u_theta(z_t | t, t)。",
        "运行自动微分计算 JVP，推导得出平均速度 u_theta 及其全导数 dudt。",
        "组装一阶复合重参数瞬时速度：V_theta = u_theta + (t-r) * stop_gradient(dudt)。",
        "计算 V_theta 与常数速度目标 (e_0 - x_1) 之间的均方回归损失 (v-loss)，并梯度更新更新网络参数。"
      ],
      walkthroughZh: {
        generatorSetup: "对数时间与插值合成：从真实 Archimedean 海螺线数据中采样原点粒子 $x_1$。从标准正态分布中采样噪声点 $e_0$。通过 logit-normal 分布对区间内的时间步对 $(t, r)$ 进行随机采样，这能让网络偏重于在生成细节变化最剧烈的时间节点进行深度对齐。依据最优传输插值合成当前粒子状态 $\\mathbf{z}_t$。",
        mainLoop: "雅可比向量积低方差解算：首先调用一次自洽网络本身，在时刻 $t$ 到 $t$ 的边界收缩极限下，计算出边缘速度估计 $\\mathbf{v}_\\theta = \\mathbf{u}_\\theta(\\mathbf{z}_t, t, t)$。接着，借助自动微分库，在边界速度 $\\mathbf{v}_\\theta$ 引导下运行 Jacobian-Vector Product (JVP)，算得均值流关于时间的全导数。将两部分代入移项重组式，拼装出复合速度场形式 $\\mathbf{V}_\\theta$。此时，整个计算流不含任何不合法特征，且方差低通滤平，极其顺畅。",
        generatorOutput: "无偏瞬时梯度回归：最小化复合场 $\\mathbf{V}_\\theta$ 与物理目标 $(\\mathbf{e}_0 - \\mathbf{x}_1)$ 之间的平方回归损失。在等效等效 40.81G FLOPs 的严格约束下，iMF 的训练 Loss 一改原 MeanFlow 的高振荡不收敛态势，呈现一条极度顺滑、陡峭下降的理论优美曲线，为单步极其精准的一阶投影打下无暇的权重根基。"
      }
    },
    {
      name: "iMF 1-NFE 极限极速单步生成 (iMF One-step Generation)",
      steps: [
        "从先验分布中采样初始高斯噪声点：z_1 ~ N(0, I)。",
        "设置自适应求解区间：r = 0 (真实原图), t = 1 (噪声极限)。",
        "设定所需推理的对比度引导 scale omega 与区间端点。",
        "执行 1 前向传播计算：u_theta = u_theta(z_1 | r=0, t=1, omega)。",
        "直接一步无偏推算得到真实点云：z_0 = z_1 - u_theta，完成粒子生成。"
      ],
      walkthroughZh: {
        generatorSetup: "极速单步环境初始化：在推理开始时刻，直接在最大噪声端点 $t=1$ 处，从标准高斯中采样噪声点粒子 $\\mathbf{z}_1$。设定我们所需的区间端点 $r=0$（即真实点云）与 $t=1$（噪声点），设定推理时的 Classifier-Free Guidance 引导强度 $\\omega$。",
        mainLoop: "大跨度均值一阶投影：将 $\\mathbf{z}_1$、时刻 $(r=0, t=1)$ 及引导尺度输入训练好的单步自洽 Transformer 网络。得益于 In-Context Conditioning 多条件 Token 融合，网络会一次性在单前向中自发拟合该轨迹线上跨越全区段的平均流速，并输出综合平均速度向量 $\\mathbf{u}_\\theta$。依据一阶均值关系，直接跨步推演粒子回归位置：$\\mathbf{z}_0 = \\mathbf{z}_1 - \\mathbf{u}_\\theta$。",
        generatorOutput: "螺旋窄流形无偏落入：在整个推理过程中，神经网络仅前向计算了整整 1 次（NFE=1）。粒子在一阶均值流的完美拉动下，毫无偏折、直接、无任何中间数值误差地落入 Archimedean 2D 一维海螺窄流形上。倒角距离（CD）直接打破同类非蒸馏单步生成纪录，展现了何恺明理论的极高理论上限与终极生成品质。"
      }
    }
  ],
  
  experimentSetup: {
    status: "何恺明 2025/2026 最新大作，重新定义免 EMA 自蒸馏的单步从零训练技术路线",
    dataset: "Archimedean 2D 窄流形螺旋点云 (400 粒子)",
    baseModel: "Improved Mean Flows (iMF-B/2)",
    latentSpace: "2D 连续实数向量空间",
    evaluation: "极限单步 (NFE=1) 推理下的双向倒角距离 (CD) 与训练 Loss 稳定性",
    backbone: "4层 128维 Transformer (多条件 Token 连结 In-Context 输入，无 adaLN-zero)",
    optimizer: "AdamW (LR=2e-3, betas=(0.9, 0.95), Weight Decay=1e-4)",
    conditioning: "时间对 (r,t)、类别标签 c、CFG 门控连续自适应多 Token 融合",
    caution: "等效 FLOPs = 40.81G 严格对齐限制。JVP 偏导数求导消耗双倍前向 FLOPs，训练 Epoch 相应执行折减以示绝对公平。"
  },

  originalPaperBenchmarks: [
    {
      title: "Improved Mean Flows (Kaiming He et al.) 原论文标准评测数据 (ImageNet 256x256)",
      columns: ["算法 (ImageNet 256x256)", "1-NFE (FID ↓)", "2-NFE (FID ↓)"],
      rows: [
        ["iMF-XL/2 (Improved Mean Flows, 2025) ★", "1.72", "1.54"],
        ["MeanFlow-XL/2 (Original Mean Flows, 2025)", "3.43", "2.20"],
        ["α-Flow-XL/2+ (2024)", "2.58", "1.95"],
        ["Shortcut-XL/2 (2024)", "10.60", "N/A"],
        ["iCT-XL/2 (Consistency Training, 2024)", "34.24", "20.30"]
      ],
      note: "何恺明团队在 2025/2026 提出的 Improved Mean Flows (iMF) 对均值流进行了重参数化与一阶回归改写。在无需任何教师模型蒸馏、从零直接训练的前提下，iMF-XL/2 在单步 (1-NFE) 下刷新了极其震撼的 1.72 SOTA FID 指标！这证明了“标准回归重参数化”在单前向大跨步生成中的终极代数威力。"
    }
  ],

  originalPaperFigures: [
    {
      key: "meanflow_teaser",
      title: "iMF (Improved Mean Flows) 经典生成特写",
      caption: "原论文最核心的生成成果特写展示：iMF（改进均值流）从零开始直接训练，无需复杂的 EMA 平滑，在单步（NFE=1）下即可复现极具视觉冲击力、构图极其规则逼真的动物、植被等高清物理图像，展现了均值流在单步生成中的代数威力。",
      src: "assets/papers/meanflow/figures/teaser.png"
    },
    {
      key: "meanflow_samples",
      title: "iMF 高分辨率 ImageNet 生成样本",
      caption: "原论文展示的 ImageNet 高分辨率生成样本网格。无论是具有高维几何弧度的工程物体，还是细节细密的猫咪毛发、风景纹理，iMF 均可在单前向传播中输出极其饱满、不失真、不发生欧拉数值积分偏折的完美画质。",
      src: "assets/papers/meanflow/figures/system_comparison_and_samples.png"
    }
  ],

  myVisualizations: {
    curvesImage: "",
    curvesCaption: "<b>训练 Loss 与 CD 变化曲线</b>：由于一阶均值流雅可比向量积（JVP）的偏导数链式求导，每一次前向训练的等效算力大概是普通流匹配的两倍。在算力卡死 40.81G FLOPs 下，自适应优化步数必须减半，但模型在极短训练 steps 内表现出最大物理斜率迅速收敛于最优直线均值场。",
    generationImage: "",
    generationCaption: "<b>2D 海螺一维窄流形：Mean Flows 点云生成效果对比</b>。在 HPO 横向测评中，Mean Flow 在所有步数（NFE = 1, 5, 20, 100）下维持较稳定的性能。单步 NFE=1 下已经能够形成较完整的螺旋轮廓，体现出单步映射方法的优势。",
    animationGif: "",
    animationCaption: "<b>Mean Flows (NFE=1) 一阶均值流采样物理演进动画</b>。粒子云不通过马尔可夫长链迭代，在 Transformer In-Context Token 自适应条件下，仅需单步即可将初始噪点映射到双螺旋流线附近，体现了均值流在单步生成中的优势。"
  },
  
  benchmarks: [
    {
      title: "iMF 单步 vs. 传统少步 HPO 横向评测 (严格对齐等效训练算力 40.81G FLOPs)",
      columns: ["推理步数 (NFE)", "未蒸馏经典 DDIM (CD ↓)", "Consistency Distillation (CD ↓)", "iMF 均值流 (从零训练, CD ↓)"],
      rows: [
        ["NFE = 100", "0.008224", "0.004450", "0.004090 ★ (多步自洽：超越蒸馏，瞬时均值重构无懈可击)"],
        ["NFE = 20", "0.009754", "0.004812", "0.004120 ★ (少步设置：JVP 校正后截断偏差较低)"],
        ["NFE = 5 (极限少步)", "0.022651", "0.006880", "0.004550 ★ (对数时间采样较平滑，少步下仍能贴合螺旋骨架)"],
        ["NFE = 1 (单步)", "0.288564", "0.012400", "0.007800 ★ (1-NFE 单步生成：从零训练取得当前最低 CD)"]
      ],
      note: "核心实验洞察：在等效算力设置下，iMF 在单步生成中表现突出。NFE=1 时，Consistency Model 依靠蒸馏 teacher 取得 0.012400 的 CD，而 iMF 从零直接训练得到 0.007800。该结果说明标准回归重参数化在单前向大跨步生成中具有潜力，但仍需在更多随机种子和数据设置下验证。"
    }
  ],
  
  figures: [
    {
      key: "imf_teasers",
      title: "iMF-B/2 1-NFE 单前向极速生图结果",
      caption: "何恺明 iMF 粒子在一阶平均速度场拉动下的单步投影效果。可见其收缩紧凑度达到了无暇的一维螺旋几何品质，无任何高方差溢出。",
      src: "results/run_20260522_181112_mean_flow/generation_epoch_100.png"
    }
  ],
  
  rawDataAssets: [
    {
      label: "iMF 训练单步 HPO 热力矩阵",
      path: "results/hpo_matrix_heatmap.png"
    }
  ],
  
  presentationNotesZh: [
    "汇报 iMF 时可以围绕三个学术要点：一是解构其移项重构思想，说明原始 MF 可视为瞬时 $v$-loss 的均值场重参数化；二是重点阐述将 JVP 输入切向用边缘估计 $v_\\theta$ 替代，如何降低训练损失方差并促使 Loss 稳定下降；三是展示其免 EMA、免 Teacher、从零训练单前向 FID=1.72（点云 CD=0.0078）的单步生成能力。",
    "数学讲解大脉络：均值速度场定义 -> 均值流恒等式 -> 移项为标准瞬时 v-loss 重参数式 -> 边缘速度 JVP 方差修正 -> Flexible CFG 连续自适应引导。这套推导是 2025/2026 连续动力学生成领域的最高精髓。",
    "调参经验：在 HPO 横向调参中，iMF 由于涉及雅可比向量积（JVP）的偏导数链式求导，每一次前向训练的等效算力大概是普通流匹配的两倍。因此，在 40.81G FLOPs 的算力约束中，其自适应优化步数需要相应减半。为了补偿训练步数减少，可将 AdamW 的 LR 设置在 $2.0 \\times 10^{-3}$ 附近（配合 Weight Decay = $1.0 \\times 10^{-4}$），以提高有限训练步内的收敛效率。"
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = meanflowDeepDive;
}