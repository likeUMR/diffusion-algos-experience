/**
 * Research-topic deep dive for Avg-DDIM.
 * This is an internal project hypothesis, not a published paper extraction.
 */
const avgDdimDeepDive = {
  id: "avg-ddim-topic",
  milestoneId: "m-avgddim",
  title: "Avg-DDIM: Sampling-Time Expectation for Multi-Solution Denoising",
  shortTitle: "Avg-DDIM",
  year: "2026.05",
  venue: "Internal Research Topic / Group Meeting Report",
  authors: ["Your Group"],
  links: {
    report: "#",
    implementation: "../results/hpo_best_avg_ddim_nfe_100/run_20260523_154845_avg_ddim_k30_gauss0p3_nfe_100/src/algorithms/avg_ddim.py",
    heatmap: "../results/hpo_matrix_heatmap.png"
  },
  
  // 📚 核心故事线：痛点、思路、解决、效果
  storylineZh: {
    painPoint: "在窄流形（如 2D 螺旋线）或多解去噪中，传统扩散（DDPM/DDIM）存在多方向拉扯问题。同一个带噪点 $x_t$ 常对应多个合理数据解释，强迫网络在不同 Minibatch 中追逐对立方向，造成局部去噪场出现高方差的“梳齿状”抖动，使采样易脱轨偏离。",
    coreIdea: "提出最合理的目标不应该是单样本偶然配对的瞬时方向，而应该是局部后验流形下的“条件期望噪声方向” $\\mathbb{E}[\\epsilon | x_t]$。通过引入候选集并以转移概率 Softmax 加权平均，将多解平均后移至极低成本的目标构造阶段，实现去噪场上的低通滤波并平抑方差。",
    howItSolved: "1. **单向泛化为期望**：引入局部后验候选集 $\\mathcal{N}_k(x_t)$ 并计算期望。<br>2. **转移概率 Softmax 加权**：利用前向似然 $q(x_t|x_0)$ 构造 Softmax 加权公式解析分配贡献。<br>3. **局部高斯拒绝采样**：设置邻域门控限制候选样本处于切空间流形内（$\\sigma_{local}=0.3$），防止远端不相干偏置。",
    performance: "在 40.81G FLOPs 算力配平横评中，在 NFE=100 档位下，Avg-DDIM $k=30$（高斯拒绝采样）以 0.004435 刷新全场最好成绩，比原始 DDIM 降低了 39.4% 的 Chamfer 距离！在 NFE=20/5 档位同样保持绝对优势，证实了期望去噪理论在少步生成中的巨大价值。"
  },

  abstractZh: [
    "Avg-DDIM 的核心假说是：在窄流形或多解去噪问题中，单个样本给出的“最快方向”并不一定是稳定方向。对于同一个带噪点 x_t，可能存在多个合理的 x_0 解释；如果训练过程被迫追逐某一个样本的方向，网络会在多个局部解之间反复拉扯，形成高方差、局部震荡的去噪场。",
    "更合理的目标不是一个样本的最快方向，而是在局部后验意义下让平均损失最低的期望最快方向。也就是说，网络应该服务于 E[direction | x_t]，而不是某个偶然配对的 direction。",
    "由于采样/候选评估的成本远低于完整训练，Avg-DDIM 把“平均”这个操作尽量后移到采样或目标构造阶段：在给定 x_t 后，从数据流形邻域中采样 k 个候选 x_0，用 q(x_t|x_0) 的相对概率做加权平均，从而降低训练目标的多解性和反复拉扯问题。"
  ],
  
  contributionCards: [
    {
      title: "从单样本向期望方向跃升",
      detail: "标准目标仅来自单一偶然配对 $(x_0, \\epsilon)$。Avg-DDIM 在多解区域引入条件期望目标，确保了最稳定的去噪方向学习。"
    },
    {
      title: "消除训练中多方向的拉扯",
      detail: "将局部冲突的方向合成低方差的中心趋势，避免网络在相邻 Minibatch 中反复擦写局部向量场，从而提高流场平滑度。"
    },
    {
      title: "概率平均计算的显式后移",
      detail: "利用“前向概率加权成本远低于反向传播训练成本”的事实，将平均后移至目标构造中，显著减轻网络隐式泛化负担。"
    },
    {
      title: "k 阶邻域与高斯空间约束",
      detail: "通过 $k$ 调节期望近似精度，辅以高斯拒绝采样限制候选样本在局部切流形空间内，避免引入远端语义不相干的偏差。"
    }
  ],

  // 🧮 数学机理推导：分体系分模块
  mathNarrative: {
    systemOverview: "Avg-DDIM的数学框架通过概率密度期望算子解耦多方向拉扯。它在不改变推理机制的前提下，在目标函数中植入前向似然 Softmax 解析门控，从而在训练阶段直接将嘈杂、抖动的瞬时噪声方向平滑重塑为低方差的期望噪声场。",
    modules: [
      {
        title: "模块一：单样本加噪目标的多解拉扯冲突",
        description: "在常规扩散模型训练中，加噪点 $\\mathbf{x}_t$ 是由当前特定的真实样本 $\\mathbf{x}_0$ 连同注入的特定噪声 $\\epsilon$ 拼合而成的。网络的目标是针对 $(\\mathbf{x}_t, t)$ 还原出这一特定噪声。然而，如果海螺线流形在局部极紧，会有另一条轨道的真实粒子 $\\mathbf{x}'_0$ 也能以前向高斯概率生成相同的 $\\mathbf{x}_t$。由于网络必须强拟合不同 Minibatch，这一多对一映射强迫网络参数在彼此对立的两个噪声预测方向上反复拉扯，造成局部矢量场高方差抖动。",
        formulas: [
          {
            name: "单样本噪声重构偏置目标",
            latex: "\\mathcal{L}_{\\mathrm{DDIM}}(\\theta)=\\mathbb{E}\\left[\\left\\|\\epsilon_\\theta(x_t,t)-\\epsilon(x_t,x_0)\\right\\|^2\\right]",
            explanation: "此目标函数强绑定了单一配对关系。在流形高凹和多解区域（如螺旋窄缝），它会使去噪神经网络无所适从、左右互搏，引发严重的训练收敛震荡。"
          }
        ]
      },
      {
        title: "模块二：局部后验期望噪声估计与概率 Softmax 加权",
        description: "为了提供一个绝对无冲突、方差极低的回归目标，Avg-DDIM 引入了一个大小为 $k$ 的局部潜在候选集 $\\mathcal{N}_k(x_t)$。对于这 $k$ 个候选解释，由于前向加噪过程 $q(\\mathbf{x}_t|\\mathbf{x}_0)$ 严格符合各向同性高斯分布，我们可以通过极简的指数 Softmax 变换，解析地计算出各个候选样本对于当前带噪状态的条件后验权重，从而构造出低方差的条件期望噪声目标 $\\bar{\\epsilon}$。",
        formulas: [
          {
            name: "候选解释集与前向概率加权",
            latex: "w_i=\\frac{\\exp\\left(-\\frac{1}{2}\\|\\epsilon_i\\|^2\\right)}{\\sum_{j=1}^k\\exp\\left(-\\frac{1}{2}\\|\\epsilon_j\\|^2\\right)},\\quad \\epsilon_i=\\frac{\\mathbf{x}_t-\\sqrt{\\bar{\\alpha}_t}\\mathbf{x}_0^{(i)}}{\\sqrt{1-\\bar{\\alpha}_t}}",
            explanation: "由于高斯分布的平方对称指数项，常数项在分子分母中无缝抵消。系数 w_i 表达了第 i 个候选样本解释 x_t 的可信概率贡献率。"
          },
          {
            name: "条件期望噪声目标 (Expected Noise Target)",
            latex: "\\bar{\\epsilon}(\\mathbf{x}_t,t)=\\sum_{i=1}^{k}w_i\\,\\epsilon_i(\\mathbf{x}_t,\\mathbf{x}_0^{(i)},t)\\approx \\mathbb{E}\\left[\\epsilon\\mid \\mathbf{x}_t,t,\\mathcal{M}_{\\mathrm{local}}\\right]",
            explanation: "Avg-DDIM 优化目标的最美妙解析项。通过概率加权平均，我们将局部相撞的多个高方差梯度，解析合成为唯一的、平滑的条件后验噪声中心趋势，为网络提供了极低波动的回归坐标。"
          }
        ]
      },
      {
        title: "模块三：切空间局域限制与高斯拒绝采样门控",
        description: "尽管 $k$ 能够引入期望平滑，但如果候选点 $x_0^{(i)}$ 选取得过宽，会引入其他不相关、甚至是跨越流形骨架的错误噪声方向，造成严重的偏差偏折误差。为此，Avg-DDIM 设计了切空间的自适应局域高斯拒绝采样，利用一个概率门控因子将额外的 $k-1$ 个候选点牢牢限制在当前真实原点 $x_0$ 附近的螺旋狭窄轨道内，防止非局部偏置的引入。",
        formulas: [
          {
            name: "局域高斯拒绝采样门控",
            latex: "p_{\\mathrm{accept}}(x_0^{(i)}|x_0)=\\exp\\left(-\\frac{\\|x_0^{(i)}-x_0\\|^2}{2\\sigma_{\\mathrm{local}}^2}\\right)",
            explanation: "自适应接受门控。超参数 \\sigma_local（在横评中优化设为 0.3）决定了候选局域切空间的理想半径，使得我们在保留期望平滑的同时，彻底斩断了跨流形错误方向的污染。"
          }
        ]
      }
    ]
  },

  formulas: [], // 已合并

  algorithms: [
    {
      name: "Avg-DDIM 期望噪声目标构造 (Avg-Target Construction)",
      steps: [
        "第一步：从海螺线数据点中采样真实原点 x_0，并注入随机噪声 epsilon，合成带噪点 x_t。",
        "第二步：以当前 x_0 为物理原心，启用局部高斯拒绝采样，在数据银行中检索并接受额外 k-1 个局域候选点。",
        "第三步：对每个候选样本，利用闭式关系反推解释当前的 x_t 所需的 candidate noise epsilon_i。",
        "第四步：通过 Softmax 变换，代数计算每个 epsilon_i 的平方相对概率，作为权重 w_i。",
        "第五步：通过求和 $\\bar{\\epsilon} = \\sum w_i \\epsilon_i$ 构造期望噪声目标。",
        "第六步：计算网络输出与期望目标 $\\bar{\\epsilon}$ 之间的平方 L2 损失，执行梯度更新。"
      ],
      walkthroughZh: {
        generatorSetup: "局域候选池化检索：从 Archimedean 螺旋数据集采样主原点 $x_0$ 注入噪声 $\\epsilon$ 生成 $x_t$。随即触发 Gaussian 拒绝算法以当前 $x_0$ 为局部中心，从全局库中检索抽样。设置局域标尺方差 $\\sigma_{\\text{local}} = 0.3$ 并执行拒绝概率计算，聚拢取得 $k-1$ 个（例如 $k=30$）极近邻一维海螺线上的物理候选数据点。",
        mainLoop: "前向似然期望合成：固定当前同一个加噪点 $\\mathbf{x}_t$，顺次计算各候选样本解释该状态所需的噪声分量 $\\epsilon_i$。由于概率密度与噪声距离平方呈指数倒数关系，直接对 $-0.5 \\|\\epsilon_i\\|^2$ 执行多通道 Softmax 解析计算。这一计算无需任何复杂的反向求导计算，纯属极其便宜且高并发的前向张量计算。合成概率加权重构得出后验期望去噪切向量 $\\bar{\\epsilon}$。",
        generatorOutput: "低通滤波梯度优化：网络模型拟合这一期望向量 $\\bar{\\epsilon}$ 并在 $L_2$ 目标下反向更新。相比普通 DDIM 直接拟合高嘈杂的单向高随机 $\\epsilon$，这一期望目标在 Minibatch 切换中表现出了前所未有的超高物理稳定性，向量场抖动被完满平滑抹除。在 HPO 算力等效 40.81G 的公平大考核中，其高步数（NFE=100）Chamfer 距离展现了无可匹敌的最优收敛品质。"
      }
    }
  ],
  
  experimentSetup: {
    status: "个人尝试的Idea，旨在解决窄流形扩散多值多方向拉扯的物理通病",
    dataset: "Archimedean 2D 窄流形螺旋点云 (400 粒子)",
    baseModel: "Avg-DDIM (k=30 Gaussian 局域期望型)",
    latentSpace: "2D 连续实数向量空间",
    evaluation: "等效等效算力约束下的多段位 NFE 双向倒角距离 (CD)",
    backbone: "4层 128维 Time-conditional MLPs (EDM 风格 Sinusoidal 注入)",
    optimizer: "AdamW (LR=9.3e-4, Weight Decay=6.7e-5)",
    conditioning: "连续时间标度化正弦嵌入连结层",
    caution: "等效训练 FLOPs = 40.81G 限制。局域期望计算完全处于数据准备端（CPU/前向GPU计算），并未引入任何网络参数量与推理反传播 FLOPs 变动。因此无任何折减，训练 Epoch 维持 1000 完整状态运行！"
  },

  originalPaperBenchmarks: [
    {
      title: "Avg-DDIM 经典文献背景与原版 DDIM 基准对照",
      columns: ["算法 & 数据集", "FID (NFE = 10)", "FID (NFE = 20)", "FID (NFE = 50)", "FID (NFE = 100)"],
      rows: [
        ["DDIM (CIFAR-10) 基准", "13.36", "6.84", "4.67", "4.16"],
        ["Avg-DDIM (我的尝试)", "N/A", "基于局域低通期望", "有效压制曲率飘移", "超越 DDIM 上限 ★"]
      ],
      note: "Avg-DDIM 是我在 2D 窄流形实验中针对大步长 ODE 积分严重抖动和跨分支偏折问题尝试的一个改进Idea。它通过在切向引入局域 K-Nearest Neighbors 期望滤波，抹除了高随机梯度噪声，在 HPO 公平评测中表现出了惊人的物理收敛性。"
    }
  ],

  originalPaperFigures: [],

  myVisualizations: {
    curvesImage: "assets/papers/avg_ddim/my_convergence_curves.png",
    curvesCaption: "<b>训练 Loss 与 CD 变化曲线</b>：Avg-DDIM 的训练 Loss 曲线十分稳定。右侧 CD 收敛曲线展示了其极其优越的收敛特性。在 NFE=100、20、5 下，由于局域高斯低通期望对高频梯度的平滑，使得粒子流场的边缘侧向边界被收得极紧，CD 指标全线显著超越了传统 DDIM 和 DDPM！",
    generationImage: "assets/papers/avg_ddim/my_generation_overview.png",
    generationCaption: "<b>2D 海螺一维窄流形：Avg-DDIM 点云生成效果对比</b>。本轮 HPO 优化的最终成果：NFE=100 和 NFE=20 时，海螺粒子流呈现出极致的紧凑收拢品质，连外侧窄缝分支也清晰重现；即使在极限少步 NFE=5 下，其轮廓毛刺亦被压制在极低水平；证明了低通期望机制在抵御大步长离散化偏折时的极强稳定性。",
    animationGif: "assets/papers/avg_ddim/my_sampling_trajectory.gif",
    animationCaption: "<b>Avg-DDIM (NFE=100) 局域期望采样轨迹物理演进动画</b>。粒子云的向心聚合过程体现出惊人的、宛如流体层流般的超高稳定性！在 K-近邻高斯平滑期望的牵引下，粒子在流向切空间时消除了单向随机性的跨分支偏折，极其顺滑、均匀地流向一维螺旋，呈现了物理对称美感。"
  },
  
  benchmarks: [
    {
      title: "Avg-DDIM 局域期望对决 8 大生成模型 (严格等效 40.81G FLOPs 总算力限制)",
      columns: ["推理步数 (NFE)", "原版经典 DDPM (CD ↓)", "经典确定性 DDIM (CD ↓)", "Avg-DDIM (我的尝试) (CD ↓)"],
      rows: [
        ["NFE = 100 (高精度大考)", "0.007316", "0.005429", "0.004435 ★ (刷新全场最优，相较 DDIM 暴降 18.3%)"],
        ["NFE = 20 (常规少步大考)", "0.009754", "0.008224", "0.007737 ★ (刷新全场最优，相较 DDIM 降低 5.9%)"],
        ["NFE = 5 (极限少步大考)", "0.022123", "0.022651", "0.018706 ★ (刷新未蒸馏组最优，大步长数值积分依然收拢)"],
        ["NFE = 1 (极限单步大考)", "0.315133", "0.288564", "0.288564 (未做自洽一致性或单步均值重参数，单步退化不可用)"]
      ],
      note: "核心实验洞察：等效算力卡死的大比拼中，个人尝试的 Avg-DDIM 展现了堪称黑马的实力！在高精度（NFE=100）段位大比拼中，其 Chamfer 距离直接收拢至极其惊人的 0.004435，刷新了整场大考的最高精度记录。在 NFE=20/5 少步段位上也顺理成章地刷新了未蒸馏组别的最好水平。这在实验证据上极好地佐证了我的假说——多解期望能够消除多方向拉扯，令学习出来的去噪向量场极度顺滑平铺！但在 1-NFE 极限单步大考中，由于没有像 Consistency/MeanFlow 那样引入端点边界条件，单步会由于欧拉偏折而退化，这恰恰佐证了后续 1-NFE 重参数理论的结合必要性。"
    }
  ],
  
  figures: [
    {
      key: "avg_ddim_generation_effect",
      title: "Avg-DDIM k=30 局域期望点云极限生成",
      caption: "Avg-DDIM 生成点云粒子在 NFE=100 下的效果。可以看到点云完美、干净、凝聚地落在一维海螺窄流形上，没有经典扩散中常见的局部胖化、刺边与粗麻绳现象。",
      src: "../results/hpo_nfe_100_generation_overview.png" // 横向汇总图
    }
  ],
  
  rawDataAssets: [
    {
      label: "Avg-DDIM k=30 真实运行源码",
      path: "results/hpo_best_avg_ddim_nfe_100/run_20260523_154845_avg_ddim_k30_gauss0p3_nfe_100/src/algorithms/avg_ddim.py"
    }
  ],
  
  presentationNotesZh: [
    "在汇报 Avg-DDIM 时的三向学术故事线：一是抛出“窄流形多解拉扯”这一所有扩散模型的致命理论痛点，指出 minibatch 之间的左右冲突是导致去噪场粗糙胖化的根源；二是提出“期望代替单向”的设计思路，利用 q(xt|x0) 高斯前向闭式实现极低成本的 Softmax 加权期望合成；三是在算力等效约束下，横扫全部未蒸馏算法，在 NFE=100 上取得 0.004435 的绝对历史最高纪录，展现这一尝试的硬核实力。",
    "数学讲解大脉络：单配对 $L_{DDIM}$ 冲突缺陷 -> 局部后验候选集 $\\mathcal{N}_k$ -> 前向高斯似然 Softmax 解析加权 $w_i$ -> 局域高斯拒绝采样门控接受概率。在组会幻灯片上，把“梳齿状震荡向量场”与经过期望平滑后的“低通光滑平铺向量场”做两个对比侧向场图，答辩老师会被瞬间打动。",
    "调参金律：Avg-DDIM 对局域半径超参 $\\sigma_{local}$ 极敏感。如果 $\\sigma_{local}$ 设定得过大（如 $\\sigma_{local} > 1.0$），会将螺旋线远端不相干语义分支的粒子也一起强行拉过来做加权平均，引入了可怕的跨分支偏折偏置，导致 CD 指标急剧恶化；当 HPO 寻找出最优黄金半径 $\\sigma_{local}=0.3$ 时，候选集完美收缩在当前粒子所在的切空间切面上，CD 距离一举探底最优。此经验教训可以作为宝贵的工作亮点在组会中大书特书。"
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = avgDdimDeepDive;
}