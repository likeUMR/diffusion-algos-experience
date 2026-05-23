/**
 * 扩散模型严格等效算力约束 HPO 横向对比测评数据表
 * 包含：NFE = 100, 20, 5, 1 的最佳超参和倒角距离（Chamfer Distance）表格
 * 已经完整融入 Avg-DDIM 的极限调参最优配置。
 */
const hpoData = {
  100: {
    title: "NFE = 100 常规去噪精度测评",
    images: {
      generation: "results/hpo_nfe_100_generation_overview.png",
      loss: "results/hpo_nfe_100_loss_overview.png",
      metrics: "results/hpo_nfe_100_metrics_overview.png"
    },
    tableHTML: `
      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-400">测评步数:</span>
          <span class="font-bold text-white">NFE = 100</span>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">
          在该段位下，推理步数极度充裕，充分解放了经典的随机马尔可夫链和高阶常微分求解器的收敛极限。
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-[10px] text-left border-collapse border border-white/5">
            <thead>
              <tr class="bg-indigo-950/40 text-slate-400 border-b border-white/5 font-mono">
                <th class="p-1.5">算法</th>
                <th class="p-1.5">最佳尺寸</th>
                <th class="p-1.5">Epochs</th>
                <th class="p-1.5 font-bold text-cyan-400">Chamfer Dist</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 font-mono">
              <tr class="bg-emerald-950/20 text-emerald-400"><td class="p-1.5 font-sans font-extrabold">AVG-DDIM (k=30 Gauss)</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold">0.004435 ★</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">V_LEARNING</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-cyan-400">0.006168</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">DDPM</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-cyan-400">0.007153</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">DDIM</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-cyan-400">0.007316</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">FLOW_MATCHING</td><td class="p-1.5">192x2</td><td class="p-1.5">640</td><td class="p-1.5 font-bold text-cyan-400">0.011699</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">VDM</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-cyan-400">0.020461</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">MEAN_FLOW</td><td class="p-1.5">192x5</td><td class="p-1.5">276</td><td class="p-1.5 font-bold text-cyan-400">0.090188</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">CONSISTENCY</td><td class="p-1.5">192x2</td><td class="p-1.5">480</td><td class="p-1.5 font-bold text-rose-400">0.371160</td></tr>
            </tbody>
          </table>
        </div>
        <div class="text-[10px] text-slate-400 leading-relaxed font-sans pt-1">
          <span class="text-cyan-400 font-bold">硬核透析：</span>
          1. <b>Avg-DDIM (k=30 Gauss std=0.3)</b> 成功登顶 100 步段位绝对冠军（<b>0.004435</b>），证明了局部流形方向平均化在多步确定性去噪下的极致优势。<br>
          2. <b>V-Learning（速度预测）</b> 展现出次席统治力（<b>0.006168</b>），几乎完美拟合了一维螺旋流形。<br>
          3. <b>Consistency Models（一致性模型）</b> 此时因为多步积分反演的投影重叠误差，发生了致命退化崩溃。
        </div>
      </div>
    `
  },
  20: {
    title: "NFE = 20 少步加速采样测评",
    images: {
      generation: "results/hpo_nfe_20_generation_overview.png",
      loss: "results/hpo_nfe_20_loss_overview.png",
      metrics: "results/hpo_nfe_20_metrics_overview.png"
    },
    tableHTML: `
      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-400">测评步数:</span>
          <span class="font-bold text-white">NFE = 20</span>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">
          这是目前最主流的在线加速采样段位，极其看重轨迹的直线最优传输物理性质。
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-[10px] text-left border-collapse border border-white/5">
            <thead>
              <tr class="bg-indigo-950/40 text-slate-400 border-b border-white/5 font-mono">
                <th class="p-1.5">算法</th>
                <th class="p-1.5">最佳尺寸</th>
                <th class="p-1.5">Epochs</th>
                <th class="p-1.5 font-bold text-cyan-400">Chamfer Dist</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 font-mono">
              <tr class="bg-emerald-950/20 text-emerald-400"><td class="p-1.5 font-sans font-extrabold">AVG-DDIM (k=30 Gauss)</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold">0.007737 ★</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">DDIM</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-cyan-400">0.009754</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">V_LEARNING</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-cyan-400">0.010010</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">DDPM</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-cyan-400">0.012836</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">FLOW_MATCHING</td><td class="p-1.5">192x2</td><td class="p-1.5">640</td><td class="p-1.5 font-bold text-cyan-400">0.023146</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">VDM</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-cyan-400">0.029408</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">MEAN_FLOW</td><td class="p-1.5">192x5</td><td class="p-1.5">276</td><td class="p-1.5 font-bold text-cyan-400">0.089046</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">CONSISTENCY</td><td class="p-1.5">192x2</td><td class="p-1.5">480</td><td class="p-1.5 font-bold text-rose-400">0.201568</td></tr>
            </tbody>
          </table>
        </div>
        <div class="text-[10px] text-slate-400 leading-relaxed font-sans pt-1">
          <span class="text-cyan-400 font-bold">硬核透析：</span>
          1. <b>Avg-DDIM</b> 在 NFE=20 依旧完美霸榜（<b>0.007737</b>），比经典 DDIM 提升了 <b>20.7%</b>，大幅减弱了少步采样下的骨架抖动偏离。<br>
          2. <b>DDIM 的确定性去噪</b> 依靠无随机噪声优势超越了 DDPM（<b>0.009754</b>）。<br>
          3. <b>Mean Flows（均值流）</b> 的全天候适应极佳，CD 稳定保持在 0.0890 处。
        </div>
      </div>
    `
  },
  5: {
    title: "NFE = 5 极限少步生图测评",
    images: {
      generation: "results/hpo_nfe_5_generation_overview.png",
      loss: "results/hpo_nfe_5_loss_overview.png",
      metrics: "results/hpo_nfe_5_metrics_overview.png"
    },
    tableHTML: `
      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-400">测评步数:</span>
          <span class="font-bold text-white">NFE = 5</span>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">
          跨入极限少步领域后，绝大多数传统 ODE/SDE 求解器因为巨大的单步长离散误差，去噪路径直接脱轨崩溃。
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-[10px] text-left border-collapse border border-white/5">
            <thead>
              <tr class="bg-indigo-950/40 text-slate-400 border-b border-white/5 font-mono">
                <th class="p-1.5">算法</th>
                <th class="p-1.5">最佳尺寸</th>
                <th class="p-1.5">Epochs</th>
                <th class="p-1.5 font-bold text-cyan-400">Chamfer Dist</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 font-mono">
              <tr class="bg-emerald-950/20 text-emerald-400"><td class="p-1.5 font-sans font-extrabold">AVG-DDIM (k=30 Gauss)</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold">0.018706 ★</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">DDIM</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-cyan-400">0.022123</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">V_LEARNING</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-cyan-400">0.022269</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">DDPM</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-cyan-400">0.027523</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">MEAN_FLOW</td><td class="p-1.5">192x6</td><td class="p-1.5">235</td><td class="p-1.5 font-bold text-cyan-400">0.091873</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">CONSISTENCY</td><td class="p-1.5">128x3</td><td class="p-1.5">753</td><td class="p-1.5 font-bold text-cyan-400">0.107200</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">FLOW_MATCHING</td><td class="p-1.5">512x2</td><td class="p-1.5">93</td><td class="p-1.5 font-bold text-cyan-400">0.107568</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">VDM</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-rose-400">0.119316</td></tr>
            </tbody>
          </table>
        </div>
        <div class="text-[10px] text-slate-400 leading-relaxed font-sans pt-1">
          <span class="text-cyan-400 font-bold">硬核透析：</span>
          1. <b>Avg-DDIM (k=30 Gauss)</b> 依旧保持在 5 步段位统治优势（<b>0.018706</b>），在极其弯折大步长的轨迹积分中凭借超顺滑的流形引导表现胜出。<br>
          2. <b>Mean Flows (均值流)</b> 显露极强稳健性，由于其预测的是全局平均轨迹速度，即使仅用 5 步，宏观去噪方向依然极度准确（CD=<b>0.0918</b>）。<br>
          3. 传统 DDPM/DDIM 的毛刺外溢现象在此开始暴露。
        </div>
      </div>
    `
  },
  1: {
    title: "NFE = 1 零蒸馏单步生成极限大考",
    images: {
      generation: "results/hpo_nfe_1_generation_overview.png",
      loss: "results/hpo_nfe_1_loss_overview.png",
      metrics: "results/hpo_nfe_1_metrics_overview.png"
    },
    tableHTML: `
      <div class="space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-400">测评步数:</span>
          <span class="font-bold text-white">NFE = 1</span>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">
          单步生图：所有依赖离散迭代采样的传统扩散流派在这一大关惨遭大面积团灭，只留下专门为“一步到位”设计的超级新星。
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-[10px] text-left border-collapse border border-white/5">
            <thead>
              <tr class="bg-indigo-950/40 text-slate-400 border-b border-white/5 font-mono">
                <th class="p-1.5">算法</th>
                <th class="p-1.5">最佳尺寸</th>
                <th class="p-1.5">Epochs</th>
                <th class="p-1.5 font-bold text-cyan-400">Chamfer Dist</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 font-mono">
              <tr class="bg-emerald-950/20 text-emerald-400"><td class="p-1.5 font-sans font-extrabold">CONSISTENCY</td><td class="p-1.5">128x3</td><td class="p-1.5">753</td><td class="p-1.5 font-bold">0.089832 ★</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">MEAN_FLOW</td><td class="p-1.5">192x2</td><td class="p-1.5">587</td><td class="p-1.5 font-bold text-cyan-400">0.107437</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">FLOW_MATCHING</td><td class="p-1.5">384x3</td><td class="p-1.5">115</td><td class="p-1.5 font-bold text-rose-400">0.225315</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">AVG_DDIM (k=30 Gauss)</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-rose-400">0.288564</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">VDM</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-rose-400">0.297290</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">V_LEARNING</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-rose-400">0.310459</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">DDPM</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-rose-400">0.315131</td></tr>
              <tr><td class="p-1.5 font-sans font-semibold text-white">DDIM</td><td class="p-1.5">128x3</td><td class="p-1.5">1000</td><td class="p-1.5 font-bold text-rose-400">0.315133</td></tr>
            </tbody>
          </table>
        </div>
        <div class="text-[10px] text-slate-400 leading-relaxed font-sans pt-1">
          <span class="text-cyan-400 font-bold">硬核透析：</span>
          1. <b>Consistency Models（一致性模型）</b> 拿下单步第一（<b>0.0898</b>）！其自边界一致性投影在此立下奇功。<br>
          2. <b>Mean Flows（均值流）</b> 紧随其后拿下 <b>0.1074</b> 的优秀表现。<br>
          3. <b>Avg-DDIM</b> 虽在 NFE=1 下大幅优于原始 DDIM（从 0.3151 减少到 0.2885），但其骨架由于缺乏多步离散积分而难以在 1 步下完全展现。
        </div>
      </div>
    `
  },
  matrix: {
    title: "全局 NFE-算法 HPO 最佳倒角距离（Chamfer Distance）热力矩阵",
    images: {
      generation: "results/hpo_matrix_heatmap.png"
    },
    tableHTML: `
      <div class="space-y-3">
        <div class="flex justify-between items-center text-xs">
          <span class="text-slate-400">热力图全景:</span>
          <span class="font-bold text-cyan-400">Chamfer Distance Matrix</span>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">
          这里汇总了我们在 2D螺旋线一维窄流形上，在<b>严格限制相同计算总 FLOPs</b> 约束下运行 HPO 的全部最佳结果（包含最新的 Avg-DDIM 改进结果）：
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-[9px] text-left border-collapse border border-white/5 text-center font-mono">
            <thead>
              <tr class="bg-indigo-950/40 text-slate-400 border-b border-white/5">
                <th class="p-1 text-left">算法 (Algo)</th>
                <th class="p-1 bg-black/40 font-bold text-cyan-400">100 步</th>
                <th class="p-1 bg-black/40 font-bold text-cyan-400">20 步</th>
                <th class="p-1 bg-black/40 font-bold text-cyan-400">5 步</th>
                <th class="p-1 bg-black/40 font-bold text-cyan-400">1 步</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 text-slate-300">
              <tr class="bg-emerald-950/10 text-emerald-400"><td class="p-1 text-left font-sans font-bold">AVG_DDIM (k=30)</td><td class="p-1 font-bold">0.0044 ★</td><td class="p-1 font-bold">0.0077 ★</td><td class="p-1 font-bold">0.0187 ★</td><td class="p-1">0.2886</td></tr>
              <tr><td class="p-1 text-left font-sans font-bold text-white">V_LEARNING</td><td class="p-1 font-bold text-cyan-400">0.0062</td><td class="p-1">0.0100</td><td class="p-1">0.0223</td><td class="p-1 text-rose-500">0.3105</td></tr>
              <tr><td class="p-1 text-left font-sans font-bold text-white">DDPM</td><td class="p-1">0.0072</td><td class="p-1">0.0128</td><td class="p-1">0.0275</td><td class="p-1 text-rose-500">0.3151</td></tr>
              <tr><td class="p-1 text-left font-sans font-bold text-white">DDIM</td><td class="p-1">0.0073</td><td class="p-1 font-bold text-cyan-400">0.0098</td><td class="p-1">0.0221</td><td class="p-1 text-rose-500">0.3151</td></tr>
              <tr><td class="p-1 text-left font-sans font-bold text-white">FLOW_MATCH</td><td class="p-1">0.0117</td><td class="p-1">0.0231</td><td class="p-1">0.1076</td><td class="p-1 text-rose-500">0.2253</td></tr>
              <tr><td class="p-1 text-left font-sans font-bold text-white">VDM</td><td class="p-1">0.0205</td><td class="p-1">0.0294</td><td class="p-1">0.1193</td><td class="p-1 text-rose-500">0.2973</td></tr>
              <tr class="bg-indigo-950/10"><td class="p-1 text-left font-sans font-bold text-indigo-300">MEAN_FLOW</td><td class="p-1">0.0902</td><td class="p-1">0.0890</td><td class="p-1">0.0919</td><td class="p-1 font-bold text-cyan-400">0.1074</td></tr>
              <tr class="bg-indigo-950/10"><td class="p-1 text-left font-sans font-bold text-indigo-300">CONSISTENCY</td><td class="p-1 text-rose-500">0.3712</td><td class="p-1">0.2016</td><td class="p-1 text-cyan-400">0.1072</td><td class="p-1 bg-emerald-950/20 text-emerald-400 font-bold">0.0898 ★</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = hpoData;
}
