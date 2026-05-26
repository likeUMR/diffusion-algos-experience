/**
 * 扩散模型中“语义引导（Semantic Guidance）”演进脉络
 * 梳理：外挂 CLIP -> 梯度流形投影 (MCG) -> 无分类器引导 (CFG) -> 显式特征蒸馏 (unCLIP) -> 交叉注意力解耦 (LDM/SD) -> 双向大一统 (MM-DiT)
 */
const semanticMilestones = [
  {
    id: "s-classifier",
    year: "2021.05",
    title: "Classifier Guidance (分类器引导)",
    paper: "Diffusion Models Beat GANs on Image Synthesis",
    authors: ["Prafulla Dhariwal", "Alex Nichol (OpenAI)"],
    venue: "NeurIPS 2021 (Best Paper)",
    link: "https://arxiv.org/abs/2105.05233",
    status: "外挂引导鼻祖",
    pain_point: "早期的扩散模型（如无条件 DDPM）纯粹是在无先验指导下从高斯噪声中去噪，无法控制具体生成什么类别。如何引入语义条件以指导扩散模型进行定向类别生成，是扩散实用化的最大瓶颈。",
    breakthrough: "<b>外挂分类器，梯度借流：</b> 训练无条件扩散模型的同时，在带有噪图像数据集上训练一个判别式图像分类器 $p_\\phi(y|x_t)$。在采样逆向步骤中，用该分类器预测当前有噪图像 $x_t$ 所属类别 $y$ 的对数概率，并计算对 $x_t$ 的梯度 $\\nabla_{x_t} \\log p_\\phi(y|x_t)$。该梯度作为“外力”直接去纠正去噪方向，使粒子向特定类别的特征流形靠拢。一举在生图指标上打败 GAN，确立统治地位。",
    formula: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-emerald-400 block mb-0.5">有条件去噪得分重构 (Guided Score Function)</span>
          <p class="text-[11px] text-slate-300">分类器引导在数学上重构了逆向采样轨迹的 Score Function（对数概率梯度）：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\nabla_{x_t} \\log p(x_t|y) = \\nabla_{x_t} \\log p(x_t) + \\nabla_{x_t} \\log p(y|x_t)$
          </div>
          <p class="text-[10px] text-slate-500">根据贝叶斯定理推导。无条件得分 $\\nabla_{x_t} \\log p(x_t)$ 由扩散网络预测，而语义引导项 $\\nabla_{x_t} \\log p(y|x_t)$ 由外挂分类器预测。</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-emerald-400 block mb-0.5">噪声预测修正公式 (Noise Correction with Scale)</span>
          <p class="text-[11px] text-slate-300">在实际的预测噪声中，通过引入引导强度 $s$ 缩放分类器梯度，重构修正噪声：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\tilde{\\epsilon}_\\theta(x_t, t) = \\epsilon_\\theta(x_t, t) - \\sqrt{1 - \\bar{\\alpha}_t} s \\nabla_{x_t} \\log p_\\phi(y|x_t)$
          </div>
          <p class="text-[10px] text-slate-500">其中 $s > 1$ 是过度引导常数。增大 $s$ 能大幅度提升生成与语义的对齐度（Fidelity），但会损失生成的多样性（Diversity）。</p>
        </div>
      </div>
    `,
    cross_relation: "开启了用梯度优化扩散轨迹的时代。然而，它要求外挂的分类器必须承受各种噪声级别的 $x_t$。分类器对噪声极度敏感，稍有偏差就会导致梯度飘飞，将图像拉向虚无（饱和伪影严重）。",
    tips: [
      "<b>讲解痛点突破：</b> 很多同学在讲 Classifier Guidance 时，只机械地罗列贝叶斯公式，往往被导师打断。你可以从<b>物理学的“外力叠加”角度</b>切入：去噪过程原本是由无条件得分（自发收缩力）控制的，分类器引入了一个‘定向的电场力’ $\\nabla \\log p(y|x_t)$，使粒子在外加电场的作用下发生定向漂移。这一直观比喻会极大加深评委对你直观理解能力的认可。",
      "<b>切入视角建议：</b> 重点讲出这一工作的历史地位：它是首个让无条件扩散模型拥有控制先验的框架，但也要顺理成章地指出其致命死穴：要求额外训练一个鲁棒的高噪声判别器，这在工程上是极难扩展的，自然引出后面的 Classifier-Free 时代。"
    ]
  },
  {
    id: "s-clip",
    year: "2021.05",
    title: "CLIP Guidance (CLIP 开放语义引导)",
    paper: "CLIP: Connecting Text and Images",
    authors: ["Alec Radford et al.", "Katherine Crowson (@RiversHaveWings)"],
    venue: "ArXiv 2021 / Community Innovation",
    link: "https://arxiv.org/abs/2103.00020",
    status: "开放域文本引导",
    pain_point: "分类器引导虽然强悍，但只能局限于固定的闭集分类中（如 ImageNet 1000类）。若想用任意自然语言提示词（Prompt）如 <i>“戴草帽的太空中介”</i> 引导扩散模型，分类器模型无能为力。",
    breakthrough: "<b>跨模态双塔投影：</b> 利用 OpenAI 发布的大规模多模态预训练模型 CLIP。CLIP 包含一个文本编码器 $f_y$ 和图像编码器 $f_x$，它们被共同投影在一个高维特征对齐空间。在扩散去噪时，将当前的中间噪声图 $x_t$ 直接送进图像编码器提取 embedding，计算其与目标文本 $y$ 语义 embedding 之间的余弦距离损失。利用该损失对于输入 $x_t$ 的反向传播梯度 $\\nabla_{x_t} \\mathcal{L}_{\\text{CLIP}}(x_t, y)$ 修正逆向噪声。这彻底拉开了<b>“开放域文本生成 (Text-to-Image)”</b>的时代大幕。",
    formula: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-amber-400 block mb-0.5">CLIP 语义余弦相似度损失 (CLIP Similarity Loss)</span>
          <p class="text-[11px] text-slate-300">在每个时间步，通过最大化当前粒子与目标文本在 CLIP 隐空间的余弦相似度：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\mathcal{L}_{\\text{CLIP}}(x_t, y) = - \\cos(f_x(x_t), f_y(y)) = - \\frac{f_x(x_t) \\cdot f_y(y)}{\\|f_x(x_t)\\|_2 \\|f_y(y)\\|_2}$
          </div>
        </div>
        <div>
          <span class="text-[10px] font-bold text-amber-400 block mb-0.5">轨迹物理注入 (Reverse Step Shift)</span>
          <p class="text-[11px] text-slate-300">通过计算余弦损失对噪声图 $x_t$ 的链式导数，将其作为力学扰动项加回预测噪声：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $x_{t-1} \\leftarrow x_{t-1} - \\sigma_t^2 s \\nabla_{x_t} \\mathcal{L}_{\\text{CLIP}}(x_t, y)$
          </div>
        </div>
      </div>
    `,
    cross_relation: "这是社区（以 Katherine Crowson 等黑客为代表）和学术界早期实现“Prompt-to-Image”的最经典外挂方案。但致命伤是：CLIP 原始训练集中没有任何噪声图像，对充满噪声的 $x_t$ 提取特征极度不准，梯度极其粗糙；此外，由于每一步都要让庞大的 CLIP 跑一次完整的反向传播求导，采样推理显存暴涨，耗时翻倍。",
    tips: [
      "<b>讲解痛点突破：</b> 汇报时必须强调，CLIP Guidance 的重大意义是“将跨模态检索隐空间（CLIP Space）直接桥接为了生成空间（Generation Space）的指引场”。这是一次非同凡响的跨界组合，真正开启了 Prompt-to-Image 浪潮。",
      "<b>切入视角建议：</b> 在 PPT 中可以放出当时的生成效果图，并引导听众思考：既然 CLIP 没见过充满高斯雪花的噪声图，为什么计算出来的梯度还能起作用？其实是因为 U-Net 的强力降噪机制在不断进行概率流自修复。这有助于引出后面专门解决该痛点的 MCG 机制。"
    ]
  },
  {
    id: "s-cfg",
    year: "2021.07",
    title: "Classifier-Free Guidance (CFG - 无分类器引导)",
    paper: "Classifier-Free Diffusion Guidance",
    authors: ["Jonathan Ho", "Tim Salimans (OpenAI / Google)"],
    venue: "NeurIPS 2021 Workshop / ICLR 2022",
    link: "https://arxiv.org/abs/2207.12598",
    status: "现代工业级条件金标准",
    pain_point: "外挂分类器或 CLIP 引导存在双网络训练繁琐、在噪声图上评估不准、每步都需要昂贵反向传播求导的致命问题。有没有可能<b>不需要任何外挂网络</b>，让扩散模型直接原生学出最纯净的语义条件对齐？",
    breakthrough: "<b>双通道隐式自对齐，分数外推：</b> 提出 Classifier-Free Guidance (CFG)。在训练阶段，不需要分类器，只训练一个条件扩散模型 $\\epsilon_\\theta(x_t, c)$。但以一定概率（通常为 10%-20%）将语义条件 $c$ 设为空（或用 null token $\\emptyset$ 替代）。这样一个单一网络就同时学会了“条件生成”和“无条件生成”。采样时，将条件预测与无条件预测做线性外推（Extrapolation），这等价于沿着“条件概率极大化”的方向对噪声进行强行剪枝和定向加速，彻底抹平了外挂模型！",
    formula: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-cyan-400 block mb-0.5">CFG 噪声线性外推公式 (CFG Noise Extrapolation)</span>
          <p class="text-[11px] text-slate-300">将条件噪声与无条件噪声按比例外推，其中 $w$ 为 CFG 指导系数（Scale）：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\tilde{\\epsilon}_\\theta(x_t, c) = (1 + w) \\epsilon_\\theta(x_t, c) - w \\epsilon_\\theta(x_t, \\emptyset)$
          </div>
          <p class="text-[10px] text-slate-500">当 $w=0$ 时退化为普通条件生成；当 $w > 1$ 时（通常设为 3 ~ 12），线性外推极大压缩了噪声边界，强行迫使模型输出最符合文本特征的“极致典型样本”。</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-cyan-400 block mb-0.5">早期语义嵌入局限：时间与语义混叠 (Additive / Concat Embedding)</span>
          <p class="text-[11px] text-slate-300">在早期 CFG 的实践中，条件 $c$（如类别 embedding）和时间 $t$（Time embedding）都是全局变量。通过多层感知机（MLP）合并后，以<b>相加 (Additive)</b> 或 <b>通道拼接 (Concatenation)</b> 的粗暴方式直接送入 U-Net 每一层：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $h_{\\text{new}} = \\text{GroupNorm}(h) \\cdot (1 + W_s c_{\\text{emb}} + W_t t_{\\text{emb}}) + (W_b c_{\\text{emb}} + W_a t_{\\text{emb}})$
          </div>
          <p class="text-[10px] text-slate-500">这种全局条件嵌入使得语义只能做整体强控制，无法与特定局部空间斑块解耦，缺乏精细的局部空间对齐能力。</p>
        </div>
      </div>
    `,
    cross_relation: "这是整个扩散历史中最重要的里程碑设计之一，至今仍被 99% 的文生图/视频系统采用。它极大地提升了 Prompt 对齐精度（解决“画不准提示词”的核心），但它在采样时每步都需要网络前向两次（一次有条件，一次无条件），导致推理算力翻倍。",
    tips: [
      "<b>讲解痛点突破：</b> 向大家深刻剖析：为什么公式中的 $w > 1$ 会导致图像质量与对齐度暴涨，但图像多样性暴跌？其物理机制在于<b>“多模态概率分布的对比度增强”</b>。线性外推等价于在向量空间上，沿着‘突出条件、排斥无条件’的方向强行拉长。它把概率最高的‘最典型、最具代表性’的模式放大了，因而画面极其饱满，但代价是抹杀了个性化、边缘的样本可能。",
      "<b>切入视角建议：</b> 提醒导师，CFG 的提出让扩散模型不再依赖任何‘判别器梯度的自动回传’，这使得模型推理变得极度稳定且编写极其方便。这不仅是学术突破，更是扩散走向工业界（如 Stable Diffusion）的临门一脚。"
    ]
  },
  {
    id: "s-mcg",
    year: "2021.11",
    title: "MCG (流形约束梯度投影)",
    paper: "More Control for Free: Image Synthesis with Manifold Constrained Diffusion Guidance",
    authors: ["Hyungjin Chung et al. (KAIST)"],
    venue: "CVPR 2023",
    link: "https://arxiv.org/abs/2111.09833",
    status: "无噪流形梯度纠偏",
    pain_point: "外挂 CLIP 引导在噪声图 $x_t$ 上求导不稳的根本原因在于：$x_t$ 偏离了无噪图像的真实数据流形（Manifold）。直接把 $x_t$ 送入 CLIP，提取出来的是高度扭曲、充斥毛刺噪声的特征。其梯度相当于在虚无的非图像空间求导，必然会导致采样轨迹偏离，出现严重的过度曝光与画质崩溃。",
    breakthrough: "<b>预测映射，流形约束：</b> 既然在有噪的 $x_t$ 上求导是不准的，MCG 提出一个极度聪明的微分几何思路：在每一个逆向步中，先不急着送入 CLIP。而是通过单步 Tweedie 公式或者扩散公式，**由当前的 $x_t$ 预测出它的干净图像估计 $\\hat{x}_0(x_t)$**！因为 $\\hat{x}_0$ 已经被强行投影到了无噪图像流形上，我们在这张预测的干净图像 $\\hat{x}_0$ 上运行 CLIP 并计算梯度。然后利用雅可比投影矩阵（Jacobian Transform）将这个干净流形上的精确梯度，合理、无偏地“拉回”到当前有噪 $x_t$ 的切空间，实现极佳的稳定语义生成。",
    formula: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">Tweedie 公式流形预测投影 (Manifold Projection)</span>
          <p class="text-[11px] text-slate-300">利用当前时间步的噪声预测器 $\\epsilon_\\theta(x_t, t)$ 还原无噪流形图像估计 $\\hat{x}_0$：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\hat{x}_0(x_t) = \\frac{1}{\\sqrt{\\bar{\\alpha}_t}} \\left( x_t - \\sqrt{1 - \\bar{\\alpha}_t} \\epsilon_\\theta(x_t, t) \\right)$
          </div>
        </div>
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">流形约束梯度拉回 (Manifold Constrained Gradient Projection)</span>
          <p class="text-[11px] text-slate-300">不在 $x_t$ 上求导，而在预测的干净流形 $\\hat{x}_0$ 上求导，再进行投影纠正：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $g_{MCG} = \\nabla_{x_t} \\mathcal{L}_{\\text{CLIP}}(\\hat{x}_0(x_t), y) = \\left( \\frac{\\partial \\hat{x}_0(x_t)}{\\partial x_t} \\right)^T \\nabla_{\\hat{x}_0} \\mathcal{L}_{\\text{CLIP}}(\\hat{x}_0, y)$
          </div>
          <p class="text-[10px] text-slate-500">此处的 Jacobian 矩阵 $\\frac{\\partial \\hat{x}_0(x_t)}{\\partial x_t}$ 为流形几何映射。通过该映射，CLIP 的梯度永远作用在图像流形内部，避免了传统 CLIP 引导的过度饱和崩毁，保证了惊艳的细节画质。</p>
        </div>
      </div>
    `,
    cross_relation: "MCG 给解决“噪声图梯度不稳”提供了一个完美的几何视角：流形约束。它极大地提升了外挂引导的画质。该思想后来演化为了解决扩散逆反向问题（Image Inverse Problems，如超分辨率、去模糊、CT重建）的核心数学理论框架。",
    tips: [
      "<b>讲解痛点突破：</b> 解释这个雅可比变换（Jacobian $J = \\frac{\\partial \\hat{x}_0}{\\partial x_t}$）时，你可以通俗地讲：它相当于是一个<b>“几何投影过滤器”</b>。它过滤掉了噪声中无意义的法向毛刺，只保留了在图像本身流形上起切向修剪作用的语义梯度。这展现了你极其深厚的微分几何底子。",
      "<b>切入视角建议：</b> 告诉大家，MCG 不仅在当时拯救了 CLIP-guided 采样，它最大的遗产在于其完美的数学结构：任何图像修复/重建目标都可以套进 $\\mathcal{L}$ 中，在不需要微调扩散网络的情况下，单步投影就能实现超分辨率或 CT 影像无缝引导生成。这就是科研的‘可迁移大局观’。"
    ]
  },
  {
    id: "s-glide",
    year: "2021.12",
    title: "GLIDE (大模型文本条件的全面探索)",
    paper: "GLIDE: Towards Photorealistic Image Generation and Editing with Text-Guided Diffusion Models",
    authors: ["Alex Nichol", "Prafulla Dhariwal et al. (OpenAI)"],
    venue: "ICML 2022",
    link: "https://arxiv.org/abs/2112.10741",
    status: "大规模文生图实证",
    pain_point: "此前，Classifier-Free Guidance (CFG) 只在小图像闭集分类（如 ImageNet 64x64）中得到小规模验证。如果要在海量互联网图文对上训练超大规模的、面向日常自然语言的文生图扩散大模型，其网络结构该如何设计？CFG 和 CLIP 引导哪一个表现更好？均没有系统验证。",
    breakthrough: "<b>学术实证，CFG 全胜：</b> OpenAI 训练了一个包含 35 亿参数的文本条件扩散大模型，在大大规模图文对上进行系统评测。通过严谨的人类盲测，首次证明：<b>Classifier-Free Guidance (CFG) 在逼真度和提示词对齐度上，均以压倒性优势击败了外挂的 CLIP-Guidance</b>！GLIDE 奠定了工业级文生图的路线基础，它使用 Transformer 编码文本，通过序列特征来调节 U-Net，开启了真实图像文本精准编辑（Inpainting, Mask-based Editing）的技术风潮。",
    formula: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-amber-400 block mb-0.5">文本嵌入投影机制 (Text-Conditioned Injection)</span>
          <p class="text-[11px] text-slate-300">GLIDE 将文本通过 Transformer 编码成特征序列 $K \\in \\mathbb{R}^{L \\times d}$，其与图像 U-Net 特征的注入包括：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $c_{\\text{global}} = \\text{MeanPool}(K) \\cdot W_{\\text{proj}} \\quad \\text{and} \\quad c_{\\text{local}} = K$
          </div>
          <p class="text-[10px] text-slate-500">全局特征 $c_{\\text{global}}$ 融入 Time embedding 从而对整个 U-Net 做宏观控制；局部序列特征 $c_{\\text{local}}$ 则作为 U-Net 中各个 Cross-Attention 模块的键与值，进行局部的、像素级的精细对齐融合。</p>
        </div>
      </div>
    `,
    cross_relation: "GLIDE 彻底指明了工业界文生图技术的发展方向：丢弃外挂分类器，全力拥抱 CFG 与大规模 Transformer 编码器。这一实证直接为后面 DALL-E 2 / unCLIP 以及 Latent Diffusion / Stable Diffusion 铺平了道路。",
    tips: [
      "<b>讲解痛点突破：</b> 汇报 GLIDE 时，一定要带上它最具说服力的人类主观评估盲测图：在相同条件下，CFG 在图文一致性（Text Alignment）和图画逼真度（Photorealism）两个维度上完全“吊打”了 CLIP-guided 引导。这表明大规模自然语言的生成，原生端到端联合训练才是最优解。",
      "<b>切入视角建议：</b> 强调 GLIDE 是历史上首个大规模实现“文本掩码局部重画（Inpainting）”的模型，这把语义引导从纯粹的‘无中生有’推向了‘所见即所想’的细粒度图像修改。在组会上，这可以极好地引导大家往交互式图像编辑方向去思考。"
    ]
  },
  {
    id: "s-ldm",
    year: "2021.12",
    title: "Latent Diffusion / Stable Diffusion (交叉注意力解耦)",
    paper: "High-Resolution Image Synthesis with Latent Diffusion Models",
    authors: ["Robin Rombach", "Andreas Blattmann", "Björn Ommer (Runway / LMU)"],
    venue: "CVPR 2022 (Oral / Best Paper Nominee)",
    link: "https://arxiv.org/abs/2112.10752",
    status: "交叉注意力统治时代",
    pain_point: "早期的语义条件注入是通过将条件 Embedding（如文本、类别）与时间 Embedding 机械相加/拼接（如 early CFG 里的 Add/Concat）。这在机制上是一个<b>低维的全局语义压缩项</b>，会导致两个毁灭性硬伤：1. 无法进行精细的局部空间语义绑定（如<i>“左边是苹果，右边是香蕉”</i>，全局注入会让两个水果混叠）；2. 语义强行与图像空间的分辨率和底层细节强绑定，使得条件难以实现即插即用的解耦控制。",
    breakthrough: "<b>交叉注意力，空间-语义完全解耦：</b> 引入 <b>Cross-Attention (交叉注意力) 机制</b>。文本编码器（如 CLIP Text ViT 或 T5）输出开放域的一维文本 token 序列 $e \\in \\mathbb{R}^{L \\times d_e}$。将 U-Net 内部任意一层的图像空间特征图 $F \\in \\mathbb{R}^{HW \\times d}$ 投影为 Query (Q，查询，对应图像像素的空间局部)；而将文本 tokens $e$ 投影为 Key (K，键) 和 Value (V，值)。通过像素对单词的注意力加权对齐，文本中的不同词汇能**自适应、精准、局部化地附着在图像的空间局部斑块上**。彻底解耦了全局语义和局部纹理，一举奠定了文生图系统的底层物理架构。",
    formula: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-cyan-400 block mb-0.5">像素-语义交叉注意力公式 (Cross-Attention Operator)</span>
          <p class="text-[11px] text-slate-300">将图像特征 $F \\in \\mathbb{R}^{HW \\times d}$ 与文本条件 $e \\in \\mathbb{R}^{L \\times d_e}$ 跨模态局部对齐：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\text{Attention}(Q, K, V) = \\text{softmax}\\left( \\frac{Q K^T}{\\sqrt{d_k}} \\right) V$
          </div>
          <p class="text-[10px] text-slate-500">其中投影矩阵定义为：$Q = W_Q^{(i)} \\cdot F$（来自图像空间，维度 $HW \\times d_k$），$K = W_K^{(i)} \\cdot e$（来自文本空间，维度 $L \\times d_k$），$V = W_V^{(i)} \\cdot e$（来自文本空间，维度 $L \\times d_v$）。</p>
        </div>
        <div>
          <span class="text-[10px] font-bold text-cyan-400 block mb-0.5">注意力机制的物理意义：解耦与绑定</span>
          <p class="text-[11px] text-slate-300">注意力矩阵 $\\text{softmax}\\left( \\frac{Q K^T}{\\sqrt{d_k}} \\right) \\in \\mathbb{R}^{HW \\times L}$ 的每一行对应一个像素点，表示该像素对文本中所有 $L$ 个单词的注意力权重。这使网络在逆向去噪时，能够自发地让“猫”这个词的特征仅仅去指导图像中含有猫的像素块去噪，实现了空前强大的可控性。</p>
        </div>
      </div>
    `,
    cross_relation: "交叉注意力机制的引入是扩散模型发展史上划时代的创新。它完美兼顾了灵活性（任何模态：音频、文本、图像都可以转为 token 序列并经由 Cross-Attention 输入）与精准度，直接繁衍出了后面的 Stable Diffusion 1.x/2.x、SDXL、ControlNet、IP-Adapter，彻底统治了整个开源文生图社区。",
    tips: [
      "<b>讲解痛点突破：</b> 很多同学会把 LDM 的 Latent 空间（VAE）与 Cross-Attention 的引入逻辑混淆。你在汇报时应当极富条理地指出，LDM 实际上完成了<b>两大完全独立维度的完美解耦</b>：1. <b>图像空间维度解耦</b>：通过 VAE 将像素空间压缩至低维隐空间，清除了不必要的像素级算力开销；2. <b>条件注入维度解耦</b>：通过 Cross-Attention 代替传统的粗暴相加，让空间纹理和语义理解各司其职。这一双重解耦的大局观分析能直接把你的汇报推到博士级水平。",
      "<b>切入视角建议：</b> 突出其无与伦比的“跨模态承载力”。在 Cross-Attention 机制下，扩散主干只管查询 $Q$，不需要管 Key, Value 是来自文本、音频还是其他图像。这启发了大家：只需要用不同编码器输出序列 $e$，模型就可以实现一键跨模态条件切换，为后续万物皆可引导的 ControlNet 埋下了精妙伏笔。"
    ]
  },
  {
    id: "s-mmdit",
    year: "2024.03",
    title: "MM-DiT (多模态双向 Transformer 对称大一统)",
    paper: "Scaling Rectified Flow Transformers for High-Resolution Image Synthesis (SD3)",
    authors: ["Patrick Esser", "Ruiming Lu et al. (Stability AI / iMF Team)"],
    venue: "ArXiv 2024 / CVPR 2024",
    link: "https://arxiv.org/abs/2403.03206",
    status: "多模态深度融合大圆满",
    pain_point: "在传统的 U-Net 或一阶 DiT（如 Peebles & Xie 的 DiT, 2023）中，文本条件 $e$ 和图像特征 $F$ 是**极不对等**的。图像特征是主干流，文本只是通过交叉注意力被动地“单向注入”到图像中。这导致了两个根本缺陷：1. 图像无法对文本特征产生任何反向回传和对齐反作用，模态融合不够深；2. 无法对文本 tokens 和图像 patches 进行统一而平等的联合表示建模，制约了极致的文本语义理解能力（如拼写文字、超长关系绑定）。",
    breakthrough: "<b>多模态流匹配 Transformer，双向联合自注意力：</b> 提出 **MM-DiT (Multi-Modal Diffusion Transformer)**。彻底抛弃 U-Net 的不对等结构。将文本 tokens 和图像 patches 分别进行独立编码后，**直接拼接为一个对等、平等的长序列共同送进 Transformer 块**！文本和图像两路拥有各自独立的投影层，但在 Attention 算子中，它们同时执行“图像内部的自注意力”、“文本内部 of 自己的自注意力”以及“图像与文本之间**双向的交叉注意力 (Joint Bidirectional Attention)**”。语义信息、时间步 $t$ 与图像空间特征在 Transformer 内部实现了深度的、一视同仁的大一统建模，这直接带来了无与伦比的超长文本关联、精准局部渲染以及文字拼写生成能力。这一结构已被 Flux、Stable Diffusion 3 以及 Sora 视频生成系统全面采纳。",
    formula: `
      <div class="space-y-3">
        <div>
          <span class="text-[10px] font-bold text-indigo-400 block mb-0.5">MM-DiT 对称双向联合注意力 (Joint Bidirectional Attention)</span>
          <p class="text-[11px] text-slate-300">设图像特征序列为 $x$，文本特征序列为 $c$。将它们分别投影并合并拼接，共同执行双向对称计算：</p>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $Q = \\begin{bmatrix} W_q^{(x)} x \\\\ W_q^{(c)} c \\end{bmatrix}, \\quad K = \\begin{bmatrix} W_k^{(x)} x \\\\ W_k^{(c)} c \\end{bmatrix}, \\quad V = \\begin{bmatrix} W_v^{(x)} x \\\\ W_v^{(c)} c \\end{bmatrix}$
          </div>
          <div class="bg-black/40 p-2 my-1.5 rounded text-center border border-white/5 font-mono text-xs">
            $\\text{Joint-Attention} = \\text{softmax}\\left( \\frac{Q K^T}{\\sqrt{d_k}} \\right) V$
          </div>
          <p class="text-[10px] text-slate-500">这导致注意力图不仅建立了 $\\text{Image} \\leftrightarrow \\text{Text}$ 的双向交叉融合，还保留了 $\\text{Image} \\leftrightarrow \\text{Image}$ 的空间自聚类与 $\\text{Text} \\leftrightarrow \\text{Text}$ 的强语义上下文建模。两路特征在网络中协同流形演进。</p>
        </div>
      </div>
    `,
    cross_relation: "MM-DiT 与流匹配（Flow Matching）的融合代表了目前多模态条件生成领域在架构 and 数学上的最先进境界。它把“时间条件嵌入”与“跨模态语义引导”从早期的粗糙外挂、全局拼贴，完美推向了完全等价、高度对称的深度注意力大一统，完成了生成式 AI 在控制侧的物理大圆满。",
    tips: [
      "<b>讲解痛点突破：</b> 很多同学认为从 U-Net 换成 DiT 仅仅是换了个 BackBone 结构。你一定要在组会上指出这一本质上的哲学区别：MM-DiT 中，文本 tokens 与图像 patches 是<b>协同流形演进（Co-evolution）</b>的。在计算联合自注意力时，文本表征本身也在随着当前去噪图像的逐渐形成而进行适应性微调，而在 U-Net 中，文本表征从第一层到最后一层都是一成不变的僵死特征。这一深刻洞察足以让全场为你的学术灵性而震撼。",
      "<b>切入视角建议：</b> 联合 Transformer 解决了生成式模型最古老的拼写硬伤。在 LDM 里，文字被当做整体纹理画出来，容易笔画粘连；在 MM-DiT 中，每个字母 token 可以被精准地投影在图像对应的 grid patches 上。这绝对是多模态融合的最高境界，直接预示了 Sora 和 Flux 这种大一统物理世界模拟器时代的到来。"
    ]
  }
];

// 将数据导出，以便 index.html 可以引入
if (typeof module !== 'undefined' && module.exports) {
  module.exports = semanticMilestones;
}
