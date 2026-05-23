/**
 * DDPM deep-dive paper data.
 * Source: Ho, Jain, Abbeel. "Denoising Diffusion Probabilistic Models", NeurIPS 2020.
 */
const ddpmDeepDive = {
  id: "ddpm",
  milestoneId: "m-ddpm",
  title: "Denoising Diffusion Probabilistic Models",
  shortTitle: "DDPM",
  year: "2020",
  venue: "NeurIPS 2020",
  authors: ["Jonathan Ho", "Ajay Jain", "Pieter Abbeel"],
  links: {
    arxiv: "https://arxiv.org/abs/2006.11239",
    pdf: "../presentation/assets/papers/ddpm/ddpm.pdf",
    code: "https://github.com/hojonathanho/diffusion",
    localPdf: "assets/papers/ddpm/ddpm.pdf",
    localSourceTex: "assets/papers/ddpm/source/extracted/main.tex"
  },
  
  // 📚 核心故事线：痛点、思路、解决、效果
  storylineZh: {
    painPoint: "2020年前，GAN虽生图质量高但训练不稳定、易模式崩溃；VAE、Flows数学严谨但图像模糊。传统扩散模型被视为纯理论框架，生成效果差且缺乏简化的训练目标。",
    coreIdea: "将生成定义为从高斯噪声逐步反演到真实分布的马尔可夫链。避开一步构建高维分布的难题，通过1000步极微小的去噪步在平滑轨迹上引导样本塑形，降低训练难度并保证多样性。",
    howItSolved: "1. **简化目标 (L_simple)**：引入噪声预测参数化（$\\epsilon$-prediction），将复杂的变分下界简化为预测噪声的简单 MSE 损失。<br>2. **骨干网络**：设计了带正弦时间编码、自注意力和群组归一化的高度优化 U-Net。<br>3. **随机去噪**：推理时基于解析后验均值回退，并引入受控高斯扰动进行退火去噪。",
    performance: "首次证明扩散模型在无条件生图（CIFAR-10）上可超越 GAN，取得 FID=3.17、IS=9.46。视觉质量实现跨越式突破，奠定了现代扩散模型的统治地位。"
  },

  abstractZh: [
    "DDPM 将生成过程定义为一个从高斯噪声逐步反演到数据分布的马尔可夫链，并用变分推断训练这个反向链。",
    "论文的核心工程突破是把复杂的变分下界训练，重写为预测噪声 epsilon 的简单 MSE 目标，从而稳定训练大规模 U-Net。",
    "在 unconditional CIFAR-10 上，DDPM 获得 IS=9.46 和 FID=3.17，首次证明扩散概率模型可以在图像质量上正面对抗 GAN。"
  ],
  
  contributionCards: [
    {
      title: "高质量图像生成的新范式",
      detail: "打破此前扩散模型仅用于似然估计的局限，证明合理的参数化和目标优化，能生成媲美乃至超越 GAN 的高质量图像。"
    },
    {
      title: "噪声预测参数化 (\\epsilon-prediction)",
      detail: "让网络预测前向前向加入的噪声 $\\epsilon$，不直接预测反向均值，在数学上将去噪方向与 Score Matching 物理理论完美统一。"
    },
    {
      title: "极简的 L_simple 训练目标",
      detail: "去掉复杂的变分权重项，直接优化噪声预测 MSE。虽牺牲了严格似然估计，但显著提升了图像生成品质与训练稳定性。"
    },
    {
      title: "渐进式去噪的语义显现机制",
      detail: "揭示去噪中语义由粗到细（Coarse-to-Fine）的显现机制，并从率失真（Rate-Distortion）角度赋予变分项有损压缩的合理解释。"
    }
  ],

  // 🧮 数学机理推导：分体系分模块
  mathNarrative: {
    systemOverview: "DDPM的数学体系建立在马尔可夫链与变分推断的基础上。通过定义确定性的前向加噪过程，推导出任意时间步的闭式边缘概率；再通过变分下界分解，将逆向去噪过程参数化为高斯转换，最终通过噪声估计将高维概率匹配简化为实用的深度网络回归目标。",
    modules: [
      {
        title: "模块一：前向高斯噪声扩散链与任意时刻闭式解析",
        description: "前向过程是一个固定的、不含可学习参数的马尔可夫链。它逐步在图像中添加极其微小的高斯噪声。通过积分展开，我们能够不经过中间步骤，直接写出从原始图像 $x_0$ 采样任意时刻加噪状态 $x_t$ 的闭式边缘分布，这使得训练时可以对时间步进行随机采样并行优化。",
        formulas: [
          {
            name: "前向扩散链单步转移",
            latex: "q(\\mathbf{x}_t|\\mathbf{x}_{t-1}) := \\mathcal{N}(\\mathbf{x}_t;\\sqrt{1-\\beta_t}\\mathbf{x}_{t-1},\\beta_t\\mathbf{I})",
            explanation: "定义了如何从前一个状态 x_{t-1} 加入微量噪声过渡到 x_t。系数 \\sqrt{1-\\beta_t} 用于轻微收缩图像均值，防止方差在无限累加中爆炸。"
          },
          {
            name: "任意时间步的边缘概率分布",
            latex: "q(\\mathbf{x}_t|\\mathbf{x}_0)=\\mathcal{N}(\\mathbf{x}_t;\\sqrt{\\bar{\\alpha}_t}\\mathbf{x}_0,(1-\\bar{\\alpha}_t)\\mathbf{I}), \\quad \\alpha_t:=1-\\beta_t,\\ \\bar{\\alpha}_t:=\\prod_{s=1}^{t}\\alpha_s",
            explanation: "前向扩散链的最美妙结论。由于高斯分布的线性累加性，我们可以直接跳过前 t-1 步，用 x_0 闭式表达出 x_t。这奠定了非迭代快速训练的数学根基。"
          }
        ]
      },
      {
        title: "模块二：变分下界（VLB）分解与条件后验闭式计算",
        description: "为了训练反向链，我们写出负对数似然 $-\\log p_{\\theta}(x_0)$ 的变分下界（VLB）。经过代数展开，该目标可分解为三个部分：终端时刻的先验对齐、每一步的条件后验高斯转换的KL散度、以及最终重建项。由于前向过程是高斯的，给定原图 $x_0$ 时，前向后验也是解析高斯，这使得KL散度可以精确计算。",
        formulas: [
          {
            name: "变分下界（VLB）三项式分解",
            latex: "\\mathbb{E}_q\\left[D_{KL}(q(\\mathbf{x}_T|\\mathbf{x}_0)\\|p(\\mathbf{x}_T))+\\sum_{t>1}D_{KL}(q(\\mathbf{x}_{t-1}|\\mathbf{x}_t,\\mathbf{x}_0)\\|p_\\theta(\\mathbf{x}_{t-1}|\\mathbf{x}_t))-\\log p_\\theta(\\mathbf{x}_0|\\mathbf{x}_1)\\right]",
            explanation: "将复杂的全局极大似然估计，拆解为对 T 个离散时间步上的局部高斯过渡进行精确匹配。每一项都是两个高斯分布之间的KL散度。"
          },
          {
            name: "前向过程的条件后验高斯",
            latex: "q(\\mathbf{x}_{t-1}|\\mathbf{x}_t,\\mathbf{x}_0)=\\mathcal{N}(\\mathbf{x}_{t-1};\\tilde{\\boldsymbol{\\mu}}_t(\\mathbf{x}_t,\\mathbf{x}_0),\\tilde{\\beta}_t\\mathbf{I}), \\quad \\tilde{\\beta}_t=\\frac{1-\\bar{\\alpha}_{t-1}}{1-\\bar{\\alpha}_t}\\beta_t",
            explanation: "在已知真实起点 x_0 的情况下，逆向回退一步的后验概率依然是严格的高斯分布，其均值 \\tilde{\\mu}_t 和方差 \\tilde{\\beta}_t 可以用 x_0 和 x_t 解析表达。"
          }
        ]
      },
      {
        title: "模块三：噪声估计重参数化与简化训练目标",
        description: "要让网络拟合反向高斯分布的均值 $\\boldsymbol{\\mu}_\\theta$，Ho等人提出了突破性的重参数化方法。与其直接预测均值，不如让网络预测前向过程加入的原始噪声 $\\epsilon$。将此代入VLB后，去掉复杂的系数权重，即可得到著名的简化均方误差损失 $L_{simple}$，极大地稳定了训练。",
        formulas: [
          {
            name: "反向均值的噪声重参数化",
            latex: "\\boldsymbol{\\mu}_\\theta(\\mathbf{x}_t,t)=\\frac{1}{\\sqrt{\\alpha_t}}\\left(\\mathbf{x}_t-\\frac{\\beta_t}{\\sqrt{1-\\bar{\\alpha}_t}}\\boldsymbol{\\epsilon}_\\theta(\\mathbf{x}_t,t)\\right)",
            explanation: "这表明网络预测的噪声 \\epsilon_\\theta 可以解析地转换回反向均值。这把网络的目标从模糊的“图像重建”变为了清晰的“本底噪声估计”。"
          },
          {
            name: "L_simple 简化训练损失",
            latex: "L_{\\mathrm{simple}}(\\theta):=\\mathbb{E}_{t,\\mathbf{x}_0,\\boldsymbol{\\epsilon}}\\left[\\left\\|\\boldsymbol{\\epsilon}-\\boldsymbol{\\epsilon}_\\theta(\\sqrt{\\bar{\\alpha}_t}\\mathbf{x}_0+\\sqrt{1-\\bar{\\alpha}_t}\\boldsymbol{\\epsilon},t)\\right\\|^2\\right]",
            explanation: "DDPM的核心数学贡献。去掉了对噪声极不敏感的变分系数，转化为干净的噪声预测 MSE。这是几乎所有现代扩散模型的实际优化准则。"
          }
        ]
      },
      {
        title: "模块四：反向采样递推与图像重建",
        description: "在推理生成阶段，我们从纯高斯噪声 $x_T$ 出发，使用网络估计的均值进行递进式回退。除了最后一步外，每一步回退都会人为注入由解析后验方差决定的高斯随机噪声，这是一种极佳的随机退火与流形塑形过程。",
        formulas: [
          {
            name: "反向一步采样迭代递推式",
            latex: "\\mathbf{x}_{t-1}=\\frac{1}{\\sqrt{\\alpha_t}}\\left(\\mathbf{x}_t-\\frac{\\beta_t}{\\sqrt{1-\\bar{\\alpha}_t}}\\boldsymbol{\\epsilon}_\\theta(\\mathbf{x}_t,t)\\right)+\\sigma_t\\mathbf{z}, \\quad \\mathbf{z}\\sim\\mathcal{N}(\\mathbf{0},\\mathbf{I})",
            explanation: "在推理时，基于当前噪声点和模型预测的噪声回退一步，并注入高斯噪声 z 进行随机探索。随着时间步逐渐趋近于 0，样本细节被逐渐雕琢出来。"
          }
        ]
      }
    ]
  },

  formulas: [], // 已合并到 mathNarrative 中

  algorithms: [
    {
      name: "DDPM 训练过程 (Training Workflow)",
      steps: [
        "从真实数据集中采样一个批次的图像原点 x0 ~ q(x0)。",
        "在 1 到 T 之间均匀随机抽取离散时间步 t ~ U(1, T)。",
        "采样一个与图像维度相同的标准高斯噪声向量 epsilon ~ N(0, I)。",
        "计算带噪样本 x_t = sqrt(alpha_bar_t)*x0 + sqrt(1-alpha_bar_t)*epsilon。",
        "将 x_t 和时间步 t 输入 U-Net 网络，输出估计噪声 epsilon_theta(x_t, t)。",
        "计算预测噪声与真实注入噪声的均方误差损失 MSE，并更新网络参数。"
      ],
      walkthroughZh: {
        generatorSetup: "数据准备：从数据集中采样一个批次的真实样本 $x_0$。时间采样：为批次中的每个样本在区间 $\{1, ..., T\}$ 中独立且均匀地随机采样一个时间步 $t$，这能保证网络能对所有退化阶段进行均衡学习。",
        mainLoop: "加噪合成：从标准正态分布中抽取纯随机噪声 $\\epsilon$。然后利用闭式公式 $\\sqrt{\\bar{\\alpha}_t}x_0 + \\sqrt{1-\\bar{\\alpha}_t}\\epsilon$ 将噪声与真实数据线性混合，制作成带噪特征图 $x_t$。网络计算：将带噪图像 $x_t$ 与对应的时间步 $t$ 送入 U-Net 网络，让其估计出其中包含的噪点 $\\epsilon_\\theta(x_t, t)$。",
        generatorOutput: "损失结算与梯度更新：计算网络估计出的噪声与注入的真实噪声 $\\epsilon$ 之间的均方误差损失（MSE），并执行反向传播和梯度下降更新模型参数，促使网络学会从任何噪点中识别出‘去噪切线方向’。"
      }
    },
    {
      name: "DDPM 采样推理过程 (Sampling Process)",
      steps: [
        "从标准正态高斯分布中采样初始纯噪声状态 x_T ~ N(0, I)。",
        "开始时间倒流循环：对 t = T, T-1, ..., 1 执行迭代去噪步骤。",
        "在每一步，将当前状态 x_t 和时间步 t 送入 U-Net，预测当前含有的本底噪声。",
        "利用公式推导得到的反向均值公式，回退计算出前一步的干净均值位置。",
        "当 t > 1 时，生成一个纯正态随机向量 z ~ N(0, I)，按比例注入反向方差扰动，增加随机物理扩散力；当 t = 1 时置扰动为0。",
        "完成全部 T 步退火演化，最终返回生成的纯净点云图像 x_0。"
      ],
      walkthroughZh: {
        generatorSetup: "空间初始化：在初始时刻 $t = T$（通常为1000步），从标准正态分布中随机生成纯净的高斯噪声粒子 $x_T$，作为逆向采样的起点拓扑。",
        mainLoop: "去噪回退循环：从 $t = T$ 逐步递减迭代至 $t = 1$。在每一个迭代步中，将当前特征 $x_t$ 和时刻 $t$ 输入训练好的 U-Net 网络，预测出噪声方向。接着，使用 DDPM 逆向公式计算出高斯后验均值，并在 $t > 1$ 时，计算解析后验方差 $\\sigma_t$，人为引入随机噪声扰动 $\\mathbf{z} \\sim \\mathcal{N}(\\mathbf{0}, \\mathbf{I})$ 来提供随机退火探索力。",
        generatorOutput: "数据输出：当时间步递减到 $t = 1$ 时，执行最后一步无噪声注入的纯确定性回退计算，输出去噪完全的特征图 $x_0$，即为成功落在 2D 一维海螺线螺旋流形上的真实重建点云。"
      }
    }
  ],
  
  experimentSetup: {
    status: "NeurIPS 2020 顶会成果，现代扩散模型训练母式",
    dataset: "Archimedean 2D 窄流形螺旋点云 (400 粒子)",
    baseModel: "DDPM (Denoising Diffusion Probabilistic Model)",
    latentSpace: "2D 连续实数向量空间",
    evaluation: "双向倒角距离 (Chamfer Distance)",
    backbone: "Time-conditional MLPs (Sinusoidal Embedding, 4层 128维)",
    optimizer: "Adam (LR=2e-3, Weight Decay=1e-5)",
    conditioning: "Sinusoidal Time Step Encoding 连结输入层",
    caution: "严格对齐训练算力 40.81G FLOPs 限制，调优其时间步 beta schedule"
  },

  originalPaperBenchmarks: [
    {
      title: "DDPM 原论文标准评测数据 (Original Paper Benchmarks)",
      columns: ["数据集", "FID (越低越好)", "NLL (bits/dim)", "推理步数 (NFE)"],
      rows: [
        ["CIFAR-10", "3.17", "3.75", "1000 步"],
        ["LSUN Bedroom (256x256)", "4.90", "N/A", "1000 步"],
        ["LSUN Church (256x256)", "7.89", "N/A", "1000 步"],
        ["LSUN Cat (256x256)", "19.75", "N/A", "1000 步"]
      ],
      note: "原版 DDPM 基于 1000 步马尔可夫链。虽然 FID 表现极佳，但由于需要串行 1000 次模型前向计算，推理耗时较高，限制了工业级实时落地。"
    }
  ],

  originalPaperFigures: [
    {
      key: "ddpm_cifar10",
      title: "DDPM 原文 CIFAR-10 样本",
      caption: "原论文中展示的 CIFAR-10 无条件 1000 步高质量生成样本网格。模型成功拟合了极其复杂的自然图像像素分布，且无模式崩溃。",
      src: "assets/papers/ddpm/figures/cifar10_samples.png"
    },
    {
      key: "ddpm_celeba",
      title: "DDPM 原文 CelebA 人脸样本",
      caption: "原论文在 256x256 高分辨率 CelebA 人脸数据集上的优秀生成细节，展现出极强的平滑曲面重建和语义生成能力。",
      src: "assets/papers/ddpm/figures/celebahq_samples.png"
    }
  ],

  myVisualizations: {
    curvesImage: "assets/papers/ddpm/my_convergence_curves.png",
    curvesCaption: "<b>训练 Loss 与 Chamfer Distance (CD) 变化曲线</b>：左侧 Denoising MSE 几乎完全一致（因为配平 FLOPs），右侧显示不同 NFE 下 CD 变化。可见 NFE=100 收敛最快、最终 Chamfer Distance 最佳（达到 0.0073），而 NFE=5 和 NFE=1 产生了严重的累积轨迹离散化偏折，指标大幅退化。",
    generationImage: "assets/papers/ddpm/my_generation_overview.png",
    generationCaption: "<b>2D 海螺一维窄流形：不同 NFE 点云生成对比</b>。展示本轮 HPO 优化的最终成果。NFE=100 骨架高度收拢贴合海螺线；NFE=20 偶有毛刺但轮廓清晰；NFE=5 产生弥散、胖化；NFE=1 彻底崩溃为高斯噪点，证明了 DDPM 在单步/极少步下的绝对失效。",
    animationGif: "assets/papers/ddpm/my_sampling_trajectory.gif",
    animationCaption: "<b>DDPM (NFE=100) 采样轨迹物理演进动画</b>。从初始各项同性高斯随机粒子云开始，随着 100 步的逆向随机去噪，粒子受到向心力与马尔可夫布朗力叠加作用，逐渐在切空间收紧，最终极其丝滑地在窄流线上塑造成完美的双螺旋流形骨架。"
  },
  
  benchmarks: [
    {
      title: "DDPM 点云生成效果 (对齐严格训练算力 40.81G FLOPs)",
      columns: ["推理步数 (NFE)", "Chamfer Distance", "训练等效 Epochs", "最佳 Hyper-parameters"],
      rows: [
        ["NFE = 100 (高精度)", "0.007316", "1000 Epochs", "beta_start=1e-4, beta_end=0.02, linear"],
        ["NFE = 20 (常规少步)", "0.009754", "1000 Epochs", "beta_start=1e-4, beta_end=0.02, linear"],
        ["NFE = 5 (极限少步)", "0.022123", "1000 Epochs", "beta_start=1e-4, beta_end=0.02, linear"],
        ["NFE = 1 (单步生图)", "0.315133", "1000 Epochs", "无法单步，图像退化为纯高斯噪点"]
      ],
      note: "在相同算力下，由于 DDPM 强依赖马尔可夫长链的布朗运动噪声退火，少步采样（NFE=5）时其轨迹偏折严重，指标出现显著退化；NFE=1 时完全不可用。"
    }
  ],
  
  figures: [
    {
      key: "ddpm_cifar10",
      title: "DDPM 论文图像生成成果",
      caption: "在2020年，DDPM首次以高质量、无模式崩溃的生成图像震惊学界，拉开了扩散模型赶超GAN的时代大幕。",
      src: "assets/papers/ddim/figures/cifar10_1000_ddpm_samples.png"
    }
  ],
  
  rawDataAssets: [
    {
      label: "DDPM HPO 训练日志",
      path: "results/hpo_nfe_100_generation_overview.png"
    }
  ],
  
  presentationNotesZh: [
    "讲 DDPM 时不要只说“加噪再去噪”。核心是三向故事脉络：痛点在于GAN的不稳定与似然估算难，思路在于马尔可夫平滑过度，解决核心在于噪声重参数化（epsilon-prediction）与 L_simple 简化，效果是在图像质量上首次具备了与 GAN 正面硬刚的实力。",
    "数学上的大脉络是：前向高斯链 -> 闭式任意步表达 -> VLB分解 -> 前向条件后验闭式高斯 -> 噪声参数化 L_simple。这一套链条是后面所有改进扩散（DDIM、Flow Matching等）的出发点。",
    "调参金律：一维窄流形上，DDPM 在 NFE=100 时效果极佳，但如果减少 NFE，由于马尔可夫链的步长大、随机扰动过高，会造成螺旋点云严重“胖化（毛刺多）”，说明其无法自适应大步长采样。"
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = ddpmDeepDive;
}