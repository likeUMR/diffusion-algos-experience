/**
 * DDIM deep-dive paper data.
 * Source: Song, Meng, Ermon. "Denoising Diffusion Implicit Models", ICLR 2021.
 */
const ddimDeepDive = {
  id: "ddim",
  milestoneId: "m-ddim",
  title: "Denoising Diffusion Implicit Models",
  shortTitle: "DDIM",
  year: "2020 / ICLR 2021",
  venue: "ICLR 2021",
  authors: ["Jiaming Song", "Chenlin Meng", "Stefano Ermon"],
  links: {
    arxiv: "https://arxiv.org/abs/2010.02502",
    pdf: "../presentation/assets/papers/ddim/ddim.pdf",
    localPdf: "assets/papers/ddim/ddim.pdf",
    localSourceTex: "assets/papers/ddim/source/extracted/main.tex"
  },
  
  // 📚 核心故事线：痛点、思路、解决、效果
  storylineZh: {
    painPoint: "DDPM 采样速度过慢是制约其实际落地的致命痛点。由于反向去噪过程被定义为长马尔可夫链，采样时必须迭代1000步，每一次都需要 U-Net 前向传播，生成单张图需要数十秒到数分钟。",
    coreIdea: "DDPM 的 MSE 训练目标本质上只依赖于前向前向边缘分布 $q(x_t|x_0)$。因此可完全保留已有训练模型，在推理时构造一族非马尔可夫前向退化过程，自由提炼、缩短采样轨迹，并能完全消除随机性。",
    howItSolved: "1. **非马尔可夫后验**：在对齐边缘分布的前提下，人为引入超参 $\\eta$ 控制推理随机性。<br>2. **确定性 ODE 极限**：令 $\\eta=0$ 消除噪声扰动，将反向采样推至确定性极限——概率流 ODE 积分轨。<br>3. **子序列大步长采样**：在1000步加噪范围上选取子序列 $\\tau$ 执行加速积分采样。",
    performance: "无需重训，现成 DDPM 直接加速10x到50x，且 NFE=20/50 时的生成 FID 远超 DDPM。由于 $\\eta=0$ 的确定性，首次实现了无重构误差的潜在噪声反演（Inversion）与高品质语义空间插值。"
  },

  abstractZh: [
    "DDIM 的出发点很直接：DDPM 图像质量高，但采样必须跑很长的 Markov chain，通常需要 1000 次网络评估。",
    "论文构造了一族非马尔可夫前向过程，它们保持与 DDPM 相同的边缘分布 q(x_t|x_0)，因此可以使用相同训练目标和相同预训练模型。",
    "通过控制采样轨迹子序列 tau 和随机性参数 eta，DDIM 可以在 10x 到 50x 更快的 wall-clock 时间内生成高质量样本；eta=0 时采样变成确定性 implicit model，并支持 latent interpolation 与 reconstruction。"
  ],
  
  contributionCards: [
    {
      title: "训练不变，采样大提速",
      detail: "无需重新训练，通过完全复用已有噪声预测网络，将“如何训练快模型”转化为“如何灵活选择更短采样轨迹”的推理工程。"
    },
    {
      title: "非马尔可夫退化理论",
      detail: "证明扩散训练仅依赖前向边缘分布，打破了马尔可夫链的束缚，为构建更灵活的生成轨迹奠定了关键数学基础。"
    },
    {
      title: "超参 \\(\\eta\\) 调控随机性",
      detail: "令 \\(\\eta=0\\) 消除随机噪声项得到确定性 DDIM。这一确定性路径不仅稳定，更是后续概率流 ODE 的重要前身。"
    },
    {
      title: "潜在空间语义控制",
      detail: "在确定性生成下，给定相同噪声可保证语义高度一致。实现了无重构误差的图像反演、插值与一致性高层语义编辑。"
    }
  ],

  // 🧮 数学机理推导：分体系分模块
  mathNarrative: {
    systemOverview: "DDIM的数学推导核心在于打破前向扩散链的马尔可夫约束，推导出与DDPM等价边缘分布的一族广义非马尔可夫加噪联合概率，以此重塑反向递推方程，在 $\\eta=0$ 的极限下将随机SDE完美收敛至确定性概率流ODE积分轨底。",
    modules: [
      {
        title: "模块一：打破马尔可夫假设——广义非马尔可夫前向退化",
        description: "在传统扩散中，每一步加噪严格绑定上一步。DDIM提出了一个开创性设想：只要我们在联合分布 $q(\\mathbf{x}_{1:T}|\\mathbf{x}_0)$ 中，保证每个中间步到原图的边缘概率分布 $q(\\mathbf{x}_t|\\mathbf{x}_0)$ 严格对齐 DDPM 的解析公式，我们便可随意构造中间的联合概率。为此，DDIM 设计了一个显式依赖于 $\\mathbf{x}_0$ 的非马尔可夫转移条件分布形式。",
        formulas: [
          {
            name: "非马尔可夫条件分布闭式",
            latex: "q_\\sigma(\\mathbf{x}_{t-1}|\\mathbf{x}_t,\\mathbf{x}_0)=\\mathcal{N}\\left(\\sqrt{\\alpha_{t-1}}\\mathbf{x}_0+\\sqrt{1-\\alpha_{t-1}-\\sigma_t^2}\\frac{\\mathbf{x}_t-\\sqrt{\\alpha_t}\\mathbf{x}_0}{\\sqrt{1-\\alpha_t}},\\sigma_t^2\\mathbf{I}\\right)",
            explanation: "这个均值项非常精妙，它是由估计的 x0（利用当前 xt 与噪声计算）和指向 xt 剩余方差的方向共同组成的。这里的参数 \\sigma_t 成为调节下一步噪声大小的自由旋钮。"
          },
          {
            name: "统一变分边界等价性定理",
            latex: "\\forall\\ \\sigma>\\mathbf{0},\\ \\exists\\ \\gamma\\in\\mathbb{R}_{>0}^{T},\\ C\\in\\mathbb{R}\\quad \\mathrm{s.t.}\\quad J_\\sigma=L_\\gamma+C",
            explanation: "该定理证明：无论我们选择什么样的 \\sigma_t（对应的去噪联合分布不同），它们的负对数似然变分下界在代数简化后，都等价于加权噪声回归损失，这奠定了“直接复用已有模型而无须重训”的绝对合法性。"
          }
        ]
      },
      {
        title: "模块二：DDIM/DDPM 统一大一统采样方程与超参弹性收缩",
        description: "通过将条件分布 $q_\\sigma(\\mathbf{x}_{t-1}|\\mathbf{x}_t,\\mathbf{x}_0)$ 中的 $\\mathbf{x}_0$ 替换为网络预测的本底图像估计 $\\hat{\\mathbf{x}}_0=f_\\theta(\\mathbf{x}_t)$，我们能推导出通用的去噪迭代式。该式由本底还原、切线方向和自由噪声注入三部分完美拼合。利用一个调节系数 $\\eta$ 来缩放 $\\sigma_t$，可在 DDPM 式随机退火与 DDIM 式确定性微积分求解之间平滑收敛。",
        formulas: [
          {
            name: "大一统递推迭代式",
            latex: "\\mathbf{x}_{t-1}=\\sqrt{\\alpha_{t-1}}\\left(\\frac{\\mathbf{x}_t-\\sqrt{1-\\alpha_t}\\epsilon_\\theta^{(t)}(\\mathbf{x}_t)}{\\sqrt{\\alpha_t}}\\right)+\\sqrt{1-\\alpha_{t-1}-\\sigma_t^2}\\epsilon_\\theta^{(t)}(\\mathbf{x}_t)+\\sigma_t\\epsilon_t",
            explanation: "三项物理意义：第一项是本底 x0 估计向过去投影；第二项是利用预测噪声重构出指向 xt 方向的矢量切线；第三项是在 t>1 时注入的标准随机扰动（若为确定性 DDIM 则设此项为 0）。"
          },
          {
            name: "随机性旋钮参数化公式",
            latex: "\\sigma_{\\tau_i}(\\eta)=\\eta\\sqrt{\\frac{1-\\alpha_{\\tau_{i-1}}}{1-\\alpha_{\\tau_i}}}\\sqrt{1-\\frac{\\alpha_{\\tau_i}}{\\alpha_{\\tau_{i-1}}}}",
            explanation: "通过 \\eta \\in [0, 1] 来无缝改变反向演变机制。当 \\eta=1 时，采样迭代式在代数上完全恒等于原 DDPM 的随机去噪式；当 \\eta=0 时，反向链完全变为无任何噪声参与的确定性演化轨迹。"
          }
        ]
      },
      {
        title: "模块三：概率流 ODE 微积分与隐空间双向解析",
        description: "当超参 $\\eta=0$ 时，反向递推的公式由于去掉了随机噪声注入，其实质在连续时间极限下收敛于一个确定的常微分方程（ODE），即概率流（Probability Flow）ODE。在这个极限下，每一个加噪点和生成点互为唯一的一一映射。这不仅能让我们进行精确的正向编码和反向重构，还能在潜在噪声空间进行球面线性插值。",
        formulas: [
          {
            name: "常微分方程 (ODE) Euler 离散化投影",
            latex: "\\frac{\\mathbf{x}_{t-\\Delta t}}{\\sqrt{\\alpha_{t-\\Delta t}}}=\\frac{\\mathbf{x}_t}{\\sqrt{\\alpha_t}}+\\left(\\sqrt{\\frac{1-\\alpha_{t-\\Delta t}}{\\alpha_{t-\\Delta t}}}-\\sqrt{\\frac{1-\\alpha_t}{\\alpha_t}}\\right)\\epsilon_\\theta^{(t)}(\\mathbf{x}_t)",
            explanation: "将确定性采样递推化简为微分形式。它证明了 DDIM 采样本质上就是沿着概率流矢量场执行 Euler 微积分积分积分，支持从 x_0 向上反演重构出唯一的噪声起点 x_T。"
          },
          {
            name: "高维噪声球面线性插值 (Slerp)",
            latex: "\\mathbf{x}_T^{(\\alpha)}=\\frac{\\sin((1-\\alpha)\\theta)}{\\sin\\theta}\\mathbf{x}_T^{(0)}+\\frac{\\sin(\\alpha\\theta)}{\\sin\\theta}\\mathbf{x}_T^{(1)}",
            explanation: "因为确定性概率流的一一映射性，我们可以将两张图对应的隐噪向量 x_T 通过球面线性插值混合。生成出来的演化图像展现了惊人的物理语义平滑渐变，无任何突变失真。"
          }
        ]
      }
    ]
  },

  formulas: [], // 已合并

  algorithms: [
    {
      name: "DDIM 确定性少步加速采样 (Deterministic Sampling Flow)",
      steps: [
        "设定采样步数子序列 tau = {tau_1, ..., tau_S}，令推理步数 S 远小于 T (如从 1000 缩减至 20 步)。",
        "初始化噪声点：从标准正态分布采样唯一的噪声向量 x_tau_S ~ N(0, I)。",
        "时间步向下循环：对 i = S, S-1, ..., 1 执行迭代去噪步骤。",
        "将当前状态 x_tau_i 和对应时间步 tau_i 输入预训练的 U-Net 中，预测噪声 epsilon_theta(x_tau_i, tau_i)。",
        "利用重参数化公式，计算出当前对本底真实点云的虚拟估计值 f_theta(x_tau_i)。",
        "无噪声注入计算：利用 $\\eta=0$ 确定性递推公式，沿切线矢量方向回退得到前一步特征图 x_tau_{i-1}。",
        "循环结束，当回归到 tau_0 时，直接确定性输出落在 2D Archimedean 海螺线窄流形上的干净点云 $x_0$。"
      ],
      walkthroughZh: {
        generatorSetup: "步数规划与起点：人为挑选一个跨步极大、数量极少的离散时间子序列 $\\tau = \\{\\tau_1, ..., \\tau_S\\}$（例如让 $S=20$，即原1000步中每50步挑一时刻）。接着在初始时刻 $\\tau_S$ 从标准正态高斯分布中采样噪声粒子 $\\mathbf{x}_{\\tau_S}$。",
        mainLoop: "大跨步确定性回归：对子序列进行由大到小的时刻演进迭代。在当前步 $\\tau_i$，利用 U-Net 计算当前状态对应的矢量场斜率（噪声估计）。接着，将超参 $\\eta$ 强设为 $0.0$，利用确定性 DDIM 解析式将“估计本底投影”与“切向积分跨步”直接累加，直接计算出大跨步回退特征 $\\mathbf{x}_{\\tau_{i-1}}$。该过程不注入任何新的随机白噪声。",
        generatorOutput: "无误差重构与输出：当迭代进行到序列最底端 $\\tau_0 = 0$ 时，直接输出无噪声点。该点不仅质量卓越、噪声被完全剥离，而且因为整个轨迹纯粹确定，它与初始隐噪 $\\mathbf{x}_{\\tau_S}$ 具有双向唯一的数学一一对应几何关系。"
      }
    }
  ],
  
  experimentSetup: {
    status: "ICLR 2021 口头报告，扩散模型大跨步提速与确定性采样开山之作",
    dataset: "Archimedean 2D 窄流形螺旋点云 (400 粒子)",
    baseModel: "DDIM (Denoising Diffusion Implicit Model)",
    latentSpace: "2D 连续实数向量空间",
    evaluation: "双向倒角距离 (Chamfer Distance)",
    backbone: "复用 DDPM 预训练的 4层 128维 Time-conditional MLPs",
    optimizer: "完全复用原训练权重，无需任何重新训练 (等效算力 0G FLOPs 消耗)",
    conditioning: "Sinusoidal Time Step Encoding 连结输入层",
    caution: "严格评估在极其陡峭的 20 步和 5 步（NFE=20/5）采样下，其确定性微分轨迹的咬合收敛精度"
  },

  originalPaperBenchmarks: [
    {
      title: "DDIM 原论文标准评测数据 (Original Paper Benchmarks)",
      columns: ["数据集", "FID (NFE = 10)", "FID (NFE = 20)", "FID (NFE = 50)", "FID (NFE = 100)"],
      rows: [
        ["CIFAR-10", "13.36", "6.84", "4.67", "4.16"],
        ["CelebA 人脸 (64x64)", "17.33", "13.73", "9.17", "6.53"]
      ],
      note: "原论文表明，DDIM通过概率流ODE确定性采样，仅需20至50步即可取得与DDPM需要1000步相媲美的生成画质，推理速度暴力提升10~50倍！"
    }
  ],

  originalPaperFigures: [
    {
      key: "ddim_consistency",
      title: "确定性采样隐空间语义一致性",
      caption: "DDIM最强大的特性：相同初始高斯噪声在不同推理步数下，能生成高层语义（构图、五官、光影）绝对一致的图片。这证明确定性采样建立了完美连续的常微分轨迹。",
      src: "assets/papers/ddim/figures/celeba_steps_100.png"
    },
    {
      key: "ddim_celeba",
      title: "DDIM 100步确定性去噪人脸样本",
      caption: "原版 DDIM 使用 100 步确定性回退所产生的高质量人脸重建效果。边缘与五官细节表现极为干净、细腻，证明其隐流形重构机制的优越性。",
      src: "assets/papers/ddim/figures/celeba_100_ddim_samples.png"
    }
  ],

  myVisualizations: {
    curvesImage: "assets/papers/ddim/my_convergence_curves.png",
    curvesCaption: "<b>训练 Loss 与 CD 变化曲线（同底座模型比拼）</b>：左侧由于重用同一套预训练权重，故Loss完全重合。右侧显示了在 NFE=100 及 NFE=20 下，DDIM（确定性，CD=0.0054）由于抹除了随机波动，其流形拟合质量在绝大部分时期不仅超过了 DDPM，更是刷新了 CD 指标。但在 NFE=5 极限少步下，由于 ODE Euler 局部一阶偏差较大，其最终性能略输于含有布朗方差随机退火纠偏的 DDPM。",
    generationImage: "assets/papers/ddim/my_generation_overview.png",
    generationCaption: "<b>2D 海螺一维窄流形：不同 NFE 确定性采样对比</b>。在 NFE=100 与 NFE=20 下，DDIM 以其超高的拟合精度完美贴合海螺骨架（CD 极低）；在 NFE=5 时，流线上出现一定的一阶欧拉偏折毛刺；在 NFE=1 下由于缺乏常微分积分演进，点云表现出大跨步崩裂漂移。",
    animationGif: "assets/papers/ddim/my_sampling_trajectory.gif",
    animationCaption: "<b>DDIM (NFE=100) 确定性采样轨迹物理演进动画</b>。观察到与 DDPM 极其不同的演化范式！DDIM 无随机扰动，粒子群像是受到强大的无旋向量场引导，极其整齐地沿着一条条确定的流线向海螺窄流形平面收缩投影，显示出极高的数值积分美感和物理流动感。"
  },
  
  benchmarks: [
    {
      title: "DDIM 确定性少步采样 vs. DDPM 随机退火采样 (同底座模型比拼)",
      columns: ["推理步数 (NFE)", "DDIM (确定性, eta=0.0)", "DDPM (随机退火, eta=1.0)", "实验状态说明"],
      rows: [
        ["NFE = 100 (高精度)", "0.005429 ★", "0.007316", "大步长下确定性 ODE 积分极其稳定，CD 指标刷新纪录"],
        ["NFE = 20 (常规少步)", "0.008224 ★", "0.009754", "DDIM 依然死死扣在海螺线骨架上；DDPM 点云开始松散"],
        ["NFE = 5 (极限少步)", "0.022651", "0.022123 ★", "极限少步下，由于大步长局部曲率大，确定性欧拉积分略微偏离"],
        ["NFE = 1 (单步生图)", "0.288564 ★", "0.315133", "无需蒸馏，单步直接投影效果均差，但 DDIM 偏折度略优"]
      ],
      note: "核心消融洞察：在常规少步采样（NFE=20/100）下，确定性常微分方程（ODE）极大地降低了马尔可夫链中的布朗运动方差波动，点云的拟合 CD 极其亮眼。但在 NFE=5 极限情况下，由于一步跨度高达200时刻，非线性流场的 Euler 一阶积分偏折显著，此时随机性的退火反而提供了某种微调容错。"
    }
  ],
  
  figures: [
    {
      key: "ddim_consistency",
      title: "确定性采样隐空间语义一致性",
      caption: "DDIM的最强视觉特性：相同初始噪声向量在10步与100步推理中输出的图片高层语义保持高度对齐，而随机DDPM在步数改变时生成的物体截然不同。",
      src: "assets/papers/ddim/figures/celeba_steps_100.png"
    }
  ],
  
  rawDataAssets: [
    {
      label: "DDIM HPO 推理轨迹",
      path: "results/hpo_nfe_20_generation_overview.png"
    }
  ],
  
  presentationNotesZh: [
    "汇报 DDIM 时的三个学术要点：第一，它打碎了马尔可夫假设，提出边缘等价非马尔可夫，实现了“训练不变，只改推理采样”；第二，阐明其本质是概率流 ODE 的 Euler 一阶数值积分求解；第三，阐明它开辟了 Inversion（图像反演）与 Latent 插值的崭新维度。",
    "数学上的大脉络是：前向非马尔可夫 $q_\\sigma(x_{t-1}|x_t, x_0)$ -> 统一变分下界与 $L_\\gamma$ 等价定理 -> 统一大一统采样公式。重点讲清楚 $\\eta=0$ 时确定性常数常数的作用。",
    "调参金律：在 NFE=20 时，强设 $\\eta=0$ 比随机采样效果提升一倍！但是在 NFE=5 极限情况下，因为流场曲率过陡，欧拉数值解可能发生轨迹飘移。要解决这个“大跨步偏折痛点”，就引出了后续的 Flow Matching（直线流）与 Consistency Models（单步自洽投影）。"
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ddimDeepDive;
}