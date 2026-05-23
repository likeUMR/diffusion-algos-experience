/**
 * 组会汇报演进大视窗 • UI HTML 模板生成器
 * 负责各大学术面板及卡片组件（论文贡献、数学公式推导、算法流程、实验表格、汇报锦囊等）的动态 HTML 生成
 */

function formatInlineMath(value) {
  if (typeof value !== 'string') return value ?? '';

  return value
    .split(/(\$[^$]*\$)/g)
    .map(part => {
      if (part.startsWith('$') && part.endsWith('$')) return part;
      return part.replace(/\\[a-zA-Z]+(?:\{[^{}]*\}|_[A-Za-z0-9{}\\]+|\^[A-Za-z0-9{}\\]+)*/g, match => `$${match}$`);
    })
    .join('');
}

// 8. 抽象并生成各个部分的 HTML 片段
function getAbstractHTML(deepDive, style) {
  // 获取故事线
  const painPoint = formatInlineMath((deepDive.storylineZh && deepDive.storylineZh.painPoint) || "暂无描述");
  const coreIdea = formatInlineMath((deepDive.storylineZh && deepDive.storylineZh.coreIdea) || "暂无描述");
  const howItSolved = formatInlineMath((deepDive.storylineZh && deepDive.storylineZh.howItSolved) || "暂无描述");
  const performance = formatInlineMath((deepDive.storylineZh && deepDive.storylineZh.performance) || "暂无描述");

  const storylineHTML = `
    <div class="glass-panel rounded-2xl p-5 border border-white/5 relative overflow-hidden space-y-4">
      <div class="absolute -top-3 -left-3 w-16 h-16 ${style.themeGlow} rounded-full blur-xl pointer-events-none"></div>
      <div class="flex items-center gap-2 border-b border-white/5 pb-3">
        <i data-lucide="compass" class="w-4 h-4 ${style.textAccent}"></i>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">学术故事脉络与研究核心 (Storyline)</span>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 痛点 -->
        <div class="bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl hover:border-rose-500/20 transition duration-300">
          <div class="flex items-center gap-1.5 text-rose-400 font-bold text-xs mb-1.5">
            <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> 🔴 之前痛点与瓶颈 (Pain Point)
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed text-justify">${painPoint}</p>
        </div>
        
        <!-- 思路 -->
        <div class="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl hover:border-amber-500/20 transition duration-300">
          <div class="flex items-center gap-1.5 text-amber-400 font-bold text-xs mb-1.5">
            <i data-lucide="lightbulb" class="w-3.5 h-3.5"></i> 💡 核心设计思路 (Core Intuition)
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed text-justify">${coreIdea}</p>
        </div>
        
        <!-- 解决 -->
        <div class="bg-cyan-500/5 border border-cyan-500/10 p-3.5 rounded-xl hover:border-cyan-500/20 transition duration-300">
          <div class="flex items-center gap-1.5 text-cyan-400 font-bold text-xs mb-1.5">
            <i data-lucide="wrench" class="w-3.5 h-3.5"></i> 🛠️ 技术如何解决 (How It Solved)
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed text-justify">${howItSolved}</p>
        </div>
        
        <!-- 效果 -->
        <div class="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl hover:border-emerald-500/20 transition duration-300">
          <div class="flex items-center gap-1.5 text-emerald-400 font-bold text-xs mb-1.5">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> 🏆 最终效果表现 (Performance)
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed text-justify">${performance}</p>
        </div>
      </div>
    </div>
  `;

  // 渲染学术贡献
  const contributionsHTML = deepDive.contributionCards.map((card, idx) => `
    <div class="bg-[#0b1120]/50 border border-white/5 p-4 rounded-xl hover:${style.borderHover} hover:bg-slate-900/40 transition duration-300 group">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-6 h-6 rounded-lg ${style.bgAccent10} ${style.textAccent} flex items-center justify-center font-mono font-bold text-xs border ${style.borderAccent20}">
          ${idx + 1}
        </span>
        <h4 class="text-xs font-extrabold text-white transition">${formatInlineMath(card.title)}</h4>
      </div>
      <p class="text-[11px] text-slate-400 leading-relaxed">${formatInlineMath(card.detail)}</p>
    </div>
  `).join('');

  const contributionsPanelHTML = `
    <div class="glass-panel rounded-2xl p-5 border border-white/5 relative overflow-hidden space-y-4">
      <div class="absolute -top-3 -right-3 w-16 h-16 ${style.themeGlow} rounded-full blur-xl pointer-events-none"></div>
      <div class="flex items-center gap-2 border-b border-white/5 pb-3">
        <i data-lucide="award" class="w-4 h-4 ${style.textAccent}"></i>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">核心学术突破 / Key Contributions</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${contributionsHTML}
      </div>
    </div>
  `;

  return `
    <div class="animate-fadeIn space-y-6">
      <!-- Row 1: Academic Storyline -->
      ${storylineHTML}
      
      <!-- Row 2: Key Contributions -->
      ${contributionsPanelHTML}
    </div>
  `;
}

function getMathHTML(deepDive, style) {
  // 如果当前论文数据支持 mathNarrative 推推导脉络，则以脉络模块展示
  if (deepDive.mathNarrative && deepDive.mathNarrative.modules) {
    const overviewHTML = `
      <div class="bg-[#0b1120]/50 border border-white/5 p-4 rounded-xl mb-6 relative overflow-hidden">
        <div class="absolute -top-3 -right-3 w-16 h-16 ${style.themeGlow} rounded-full blur-xl pointer-events-none"></div>
        <div class="flex items-center gap-2 mb-1.5">
          <i data-lucide="info" class="w-4 h-4 ${style.textAccent}"></i>
          <span class="text-xs font-bold text-white uppercase tracking-wider">数学推导体系与脉络总览</span>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed text-justify font-sans">${formatInlineMath(deepDive.mathNarrative.systemOverview)}</p>
      </div>
    `;

    const modulesHTML = deepDive.mathNarrative.modules.map((mod, modIdx) => {
      const formulasHTML = mod.formulas.map((formula, formIdx) => `
        <div class="bg-black/35 border border-white/5 p-4 rounded-xl space-y-3 hover:${style.borderHover} transition duration-300 relative overflow-hidden">
          <div class="flex items-center justify-between border-b border-white/5 pb-2">
            <div class="flex items-center gap-1.5">
              <span class="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${style.bgAccent10} ${style.textAccent} border ${style.borderAccent20}">
                EQ.0${formIdx + 1}
              </span>
              <span class="text-xs font-bold text-slate-200">${formatInlineMath(formula.name)}</span>
            </div>
          </div>
          
          <!-- KaTeX Block -->
          <div class="bg-[#020408]/90 border border-white/5 px-4 py-4 rounded-lg text-center text-xs overflow-x-auto font-mono text-slate-100 shadow-inner select-all">
            $${formula.latex}$$
          </div>
          
          <!-- Explanation -->
          <p class="text-[11px] text-slate-400 leading-relaxed text-justify font-sans">
            ${formatInlineMath(formula.explanation)}
          </p>
        </div>
      `).join('');

      return `
        <div class="space-y-4">
          <!-- Module Title & Progress Indicator -->
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 rounded-full ${style.bgAccent10} ${style.textAccent} border ${style.borderAccent20} flex items-center justify-center font-mono text-xs font-bold shrink-0">
              0${modIdx + 1}
            </div>
            <div class="space-y-0.5">
              <h4 class="text-xs font-extrabold text-white flex items-center gap-2">
                ${formatInlineMath(mod.title)}
              </h4>
              <p class="text-[11px] text-slate-400 leading-relaxed text-justify font-sans">${formatInlineMath(mod.description)}</p>
            </div>
          </div>
          
          <!-- Formulas in this Module -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pl-9">
            ${formulasHTML}
          </div>
          
          <!-- Separation connection line, hide for last -->
          ${modIdx === deepDive.mathNarrative.modules.length - 1 ? '' : `
            <div class="flex items-center justify-center py-2">
              <div class="w-0.5 h-6 bg-gradient-to-b from-${style.textAccent.split('-')[1]}-500/30 to-transparent"></div>
            </div>
          `}
        </div>
      `;
    }).join('');

    return `
      <div class="glass-panel rounded-2xl p-5 border border-white/5 relative overflow-hidden animate-fadeIn">
        <div class="flex items-center justify-between border-b border-white/5 pb-3 mb-5">
          <div class="flex items-center gap-2">
            <i data-lucide="calculator" class="w-5 h-5 ${style.textAccent}"></i>
            <div>
              <h3 class="text-sm font-bold text-white">核心学术数学推导与演进脉络</h3>
              <p class="text-[10px] text-slate-500">结合独立的公式和论文，为您梳理出严谨、连贯的数学演进脉络与体系讲解</p>
            </div>
          </div>
        </div>
        
        ${overviewHTML}
        <div class="space-y-6">
          ${modulesHTML}
        </div>
      </div>
    `;
  }

  // 降级：仅列举模式
  if (!deepDive.formulas || deepDive.formulas.length === 0) {
    return `<div class="text-center py-12 text-slate-500">此文献暂无公式数据。</div>`;
  }

  const formulasHTML = deepDive.formulas.map((formula, idx) => `
    <div class="glass-panel rounded-2xl p-5 border border-white/5 relative overflow-hidden hover:${style.borderHover} transition duration-300">
      <div class="absolute -top-3 -right-3 w-16 h-16 ${style.themeGlow} rounded-full blur-xl pointer-events-none"></div>
      
      <div class="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono ${style.bgAccent10} ${style.textAccent} border ${style.borderAccent20}">
            EQ.0${idx + 1}
          </span>
          <h4 class="text-xs font-bold text-white">${formatInlineMath(formula.name || formula.label || "未命名")}</h4>
        </div>
      </div>

      <!-- KaTeX Equation Block -->
      <div class="bg-[#020408]/90 border border-white/5 px-4 py-5 rounded-xl text-center text-sm overflow-x-auto font-mono text-slate-100 shadow-inner">
        $${formula.latex}$$
      </div>

      <!-- Explanation -->
      <div class="mt-3.5 space-y-1 font-sans">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">物理及几何机制解读:</span>
        <p class="text-[11px] text-slate-400 leading-relaxed text-justify">
          ${formatInlineMath(formula.explanation || formula.explanationZh)}
        </p>
      </div>
    </div>
  `).join('');

  return `
    <div class="grid grid-cols-1 gap-6 animate-fadeIn">
      <div class="glass-panel rounded-2xl p-5 border border-white/5 relative overflow-hidden">
        <div class="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <i data-lucide="calculator" class="w-5 h-5 ${style.textAccent}"></i>
            <div>
              <h3 class="text-sm font-bold text-white">核心学术数学公式</h3>
              <p class="text-[10px] text-slate-500">论文核心推导公式列举</p>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${formulasHTML}
        </div>
      </div>
    </div>
  `;
}

function getAlgorithmHTML(deepDive, style) {
  if (!deepDive.algorithms || deepDive.algorithms.length === 0) {
    return `<div class="text-center py-12 text-slate-500">此文献暂无算法流程数据。</div>`;
  }

  // 保证 activeAlgoIndex 不越界
  if (activeAlgoIndex >= deepDive.algorithms.length) {
    activeAlgoIndex = 0;
  }

  const selectedAlgo = deepDive.algorithms[activeAlgoIndex];

  // 算法多选项卡
  const algoTabsHTML = deepDive.algorithms.map((algo, idx) => {
    const isActive = idx === activeAlgoIndex;
    const tabClass = isActive 
      ? `${style.bgAccent10} ${style.textAccent} border-${style.textAccent.split('-')[1]}-500/30 font-bold`
      : 'text-slate-400 hover:text-slate-200 border-transparent';
    return `
      <button onclick="switchActiveAlgo(${idx})" class="w-full text-left px-3 py-2 rounded-lg border text-xs transition duration-300 truncate flex items-center justify-between ${tabClass}">
        <span>${formatInlineMath(algo.name || algo.title)}</span>
        <i data-lucide="chevron-right" class="w-3.5 h-3.5 opacity-60"></i>
      </button>
    `;
  }).join('');

  // 步骤
  const stepsHTML = selectedAlgo.steps.map((step, idx) => `
    <li class="flex items-start gap-2.5">
      <span class="w-5 h-5 rounded-full ${style.bgAccent10} ${style.textAccent} border ${style.borderAccent20} flex items-center justify-center font-mono text-[9px] font-bold mt-0.5 shrink-0">
        ${idx + 1}
      </span>
      <span class="text-xs text-slate-300 leading-relaxed">${formatInlineMath(step)}</span>
    </li>
  `).join('');

  // 自然语言描述执行流程
  let walkthroughHTML = '';
  if (selectedAlgo.walkthroughZh) {
    const wt = selectedAlgo.walkthroughZh;
    walkthroughHTML = `
      <div class="glass-panel rounded-xl p-5 border border-white/5 flex-1 flex flex-col justify-between h-full min-h-[360px] bg-slate-950/20 relative overflow-hidden">
        <div class="absolute -top-3 -right-3 w-16 h-16 ${style.themeGlow} rounded-full blur-xl pointer-events-none"></div>
        
        <div class="space-y-4">
          <div class="flex items-center gap-1.5 border-b border-white/5 pb-2.5 text-xs font-bold text-white">
            <i data-lucide="info" class="w-4 h-4 ${style.textAccent}"></i>
            <span>算法执行具体过程 (自然语言精细解构)</span>
          </div>
          
          <div class="space-y-3 text-[11px] text-slate-300 leading-relaxed">
            <!-- 准备与输入 -->
            <div class="bg-black/35 p-3 rounded-lg border border-white/5">
              <span class="text-cyan-400 font-bold block mb-1">📥 准备阶段与初始输入:</span>
              <p class="text-slate-400">${formatInlineMath(wt.generatorSetup || "配置基础参数，包括骨架网络模型、时间步计划表以及数据通道初始设置。")}</p>
            </div>
            
            <!-- 核心执行循环 -->
            <div class="bg-black/35 p-3 rounded-lg border border-white/5">
              <span class="text-amber-400 font-bold block mb-1">🔁 核心执行迭代循环:</span>
              <p class="text-slate-400">${formatInlineMath(wt.mainLoop || "执行前向加噪或确定性/随机性回退递推。计算网络预测方向并执行每一步状态修正。")}</p>
            </div>
            
            <!-- 结果输出 -->
            <div class="bg-black/35 p-3 rounded-lg border border-white/5">
              <span class="text-emerald-400 font-bold block mb-1">📤 输出结算与流形映射:</span>
              <p class="text-slate-400">${formatInlineMath(wt.generatorOutput || "返回最终生成的完整采样点，并将其归一化、去噪后映射到目标螺旋狭窄流形上。")}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    // 默认降级文案
    walkthroughHTML = `
      <div class="glass-panel rounded-xl p-5 border border-white/5 flex-1 flex flex-col justify-between h-full min-h-[360px] bg-slate-950/20">
        <div class="space-y-4">
          <div class="flex items-center gap-1.5 border-b border-white/5 pb-2.5 text-xs font-bold text-white">
            <i data-lucide="info" class="w-4 h-4 ${style.textAccent}"></i>
            <span>算法执行具体过程 (自然语言解读)</span>
          </div>
          
          <div class="space-y-3 text-[11px] text-slate-300 leading-relaxed">
            <div class="bg-black/35 p-3 rounded-lg border border-white/5">
              <span class="text-indigo-400 font-bold block mb-1">💡 算法宏观机制:</span>
              <p class="text-slate-400">该算法在物理运行阶段，首先初始化计算空间（如标准高斯噪声分布空间或从训练数据集中采样真实样本）。接着，算法根据时间步规划，逐步在流场中进行微分递推或噪声拟合，最终通过平滑的逆向去噪轨道回归到真实点云分布上。</p>
            </div>
            
            <div class="bg-black/35 p-3 rounded-lg border border-white/5">
              <span class="text-cyan-400 font-bold block mb-1">🛠️ 精细化步骤执行:</span>
              <p class="text-slate-400">在每一个具体离散时间步：网络会以当前样本状态和时间步编码为输入，估计其当前的切线方向或噪声分量。算法利用该预测值执行递进式更新，稳定推导至下一个更清晰的中间状态，直至采样完毕。</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fadeIn">
      <!-- Left: List of Algorithms -->
      <div class="md:col-span-3 space-y-3">
        <div class="glass-panel rounded-xl p-4 border border-white/5 space-y-2">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">选择算法模块</span>
          <div class="space-y-1">
            ${algoTabsHTML}
          </div>
        </div>
      </div>

      <!-- Right Algorithm Content Dashboard -->
      <div class="md:col-span-9 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Steps Column -->
        <div class="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-4">
              <i data-lucide="list-checks" class="w-4 h-4 ${style.textAccent}"></i>
              <h3 class="text-xs font-bold text-white">${formatInlineMath(selectedAlgo.name || selectedAlgo.title)} 运行机制步骤</h3>
            </div>
            <ul class="space-y-3.5">
              ${stepsHTML}
            </ul>
          </div>
        </div>

        <!-- Walkthrough Column -->
        <div class="flex flex-col">
          ${walkthroughHTML}
        </div>
      </div>
    </div>
  `;
}

function getExperimentSetupHTML(setup) {
  if (!setup) return '';
  const keyNames = {
    status: '研究状态 / Status',
    dataset: '实验数据 / Dataset',
    baseModel: '底座算法 / Base Model',
    latentSpace: '表征空间 / Latent Space',
    evaluation: '物理评测指标 / Evaluation',
    backbone: '网络骨架 / Backbone',
    optimizer: '优化参数 / Optimizer',
    conditioning: '条件输入机制 / Conditioning',
    caution: '限制与考量 / Caution'
  };

  const itemsHTML = Object.entries(setup).map(([key, val]) => {
    const name = keyNames[key] || key;
    return `
      <div class="bg-black/20 border border-white/5 px-3.5 py-2.5 rounded-lg space-y-1">
        <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">${name}</span>
        <span class="text-[11px] text-slate-200 leading-relaxed font-sans block">${formatInlineMath(val)}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="glass-panel rounded-2xl p-5 border border-white/5 space-y-3 shrink-0">
      <div class="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-1">
        <i data-lucide="settings-2" class="w-4 h-4 text-indigo-400"></i>
        <h3 class="text-xs font-bold text-white">等效 FLOPs 约束 HPO 物理评测环境</h3>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        ${itemsHTML}
      </div>
    </div>
  `;
}

function getBenchmarksHTML(benchmarks, style) {
  if (!benchmarks || benchmarks.length === 0) {
    return `<div class="bg-black/20 border border-white/5 rounded-xl p-4 text-slate-500 text-xs text-center">暂无实验表格数据。</div>`;
  }

  return benchmarks.map(table => {
    const headersHTML = table.columns.map(col => `<th class="p-2 border-b border-white/5 text-center">${formatInlineMath(col)}</th>`).join('');
    
    const rowsHTML = table.rows.map(row => {
      // 判定是否是我的尝试 AVG_DDIM
      const isSota = row.some(cell => typeof cell === 'string' && (cell.includes('★') || cell.toLowerCase().includes('avg-ddim') || cell.toLowerCase().includes('avg_ddim') || cell.toLowerCase().includes('imf')));
      const rowClass = isSota 
        ? `${style.bgAccent10} text-${style.textAccent.split('-')[1]}-300 font-bold`
        : 'text-slate-300 hover:bg-white/5';
      
      const cellsHTML = row.map((cell, idx) => {
        const isBestCell = typeof cell === 'string' && cell.includes('★');
        const cellClass = idx === 0 ? 'text-left font-sans font-semibold' : 'font-mono text-center';
        return `
          <td class="p-2 ${cellClass} ${isBestCell ? 'text-emerald-400 font-extrabold' : ''}">
            ${formatInlineMath(cell)}
          </td>
        `;
      }).join('');

      return `<tr class="border-b border-white/5 transition duration-200 ${rowClass}">${cellsHTML}</tr>`;
    }).join('');

    return `
      <div class="bg-[#040711]/40 border border-white/5 rounded-xl p-4 space-y-2.5 flex-1">
        <span class="text-xs font-bold text-slate-300 block font-sans">${formatInlineMath(table.title)}</span>
        <div class="overflow-x-auto">
          <table class="w-full text-[10px] text-left border-collapse border border-white/5">
            <thead>
              <tr class="bg-indigo-950/20 text-slate-400 font-sans">
                ${headersHTML}
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${rowsHTML}
            </tbody>
          </table>
        </div>
        ${table.note ? `<p class="text-[9px] text-slate-500 font-mono leading-relaxed mt-1">* 注：${formatInlineMath(table.note)}</p>` : ''}
      </div>
    `;
  }).join('');
}

function getOriginalBenchmarksHTML(benchmarks, style) {
  if (!benchmarks || benchmarks.length === 0) {
    return `
      <div class="bg-black/20 border border-white/5 rounded-xl p-4 text-slate-500 text-xs text-center flex flex-col justify-center items-center h-full min-h-[150px]">
        <i data-lucide="info" class="w-5 h-5 text-slate-600 mb-1"></i>
        暂无原文实验指标，参考通用学术基准。
      </div>
    `;
  }

  return benchmarks.map(table => {
    const headersHTML = table.columns.map(col => `<th class="p-2 border-b border-white/5 text-center font-sans font-bold text-[10px] text-slate-400">${formatInlineMath(col)}</th>`).join('');
    const rowsHTML = table.rows.map(row => {
      const cellsHTML = row.map((cell, idx) => {
        const isBestCell = typeof cell === 'string' && cell.includes('★');
        const cellClass = idx === 0 ? 'text-left font-sans font-semibold text-slate-300' : 'font-mono text-center text-slate-400';
        return `
          <td class="p-2 ${cellClass} ${isBestCell ? 'text-emerald-400 font-extrabold' : ''}">
            ${formatInlineMath(cell)}
          </td>
        `;
      }).join('');
      return `<tr class="border-b border-white/5 transition duration-200 hover:bg-white/5">${cellsHTML}</tr>`;
    }).join('');

    return `
      <div class="bg-black/30 border border-white/5 rounded-xl p-4 space-y-2 h-full flex flex-col justify-between">
        <div>
          <span class="text-xs font-bold text-slate-300 block font-sans mb-1.5 flex items-center gap-1.5">
            <i data-lucide="award" class="w-3.5 h-3.5 text-indigo-400"></i> ${formatInlineMath(table.title)}
          </span>
          <div class="overflow-x-auto">
            <table class="w-full text-[10px] text-left border-collapse border border-white/5">
              <thead>
                <tr class="bg-indigo-950/10 text-slate-400 font-sans">
                  ${headersHTML}
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                ${rowsHTML}
              </tbody>
            </table>
          </div>
        </div>
        ${table.note ? `<p class="text-[9px] text-slate-500 font-sans leading-relaxed mt-2 border-t border-white/5 pt-1.5">* <b>注：</b>${formatInlineMath(table.note)}</p>` : ''}
      </div>
    `;
  }).join('');
}

function getOriginalFiguresHTML(figures, style) {
  if (!figures || figures.length === 0) {
    return `
      <div class="bg-black/20 border border-white/5 rounded-xl p-4 text-slate-500 text-xs text-center flex flex-col justify-center items-center h-full min-h-[150px]">
        <i data-lucide="image-off" class="w-5 h-5 text-slate-600 mb-1"></i>
        暂无原文插图展示。
      </div>
    `;
  }

  const cardsHTML = figures.map(fig => {
    let cleanSrc = fig.src;
    if (cleanSrc.startsWith('presentation/')) {
      cleanSrc = cleanSrc.replace('presentation/', '');
    }
    return `
      <div class="bg-black/30 border border-white/5 rounded-xl overflow-hidden hover:${style.borderHover} transition duration-300 flex flex-col group relative">
        <div class="relative aspect-video w-full overflow-hidden bg-slate-950 flex items-center justify-center cursor-pointer" onclick="openLightbox('${cleanSrc}', '<b>${fig.title}</b>: ${fig.caption.replace(/'/g, "\\'")}')">
          <img src="${cleanSrc}" class="max-h-[140px] max-w-full object-contain transition duration-500 group-hover:scale-105" alt="${fig.title}">
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
            <span class="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold flex items-center gap-1">
              <i data-lucide="zoom-in" class="w-3 h-3"></i> 全屏查看
            </span>
          </div>
        </div>
        <div class="p-3 space-y-1 flex-1 flex flex-col justify-between">
          <h5 class="text-[11px] font-bold text-white group-hover:${style.text} transition">${formatInlineMath(fig.title)}</h5>
          <p class="text-[9px] text-slate-500 leading-relaxed text-justify">${formatInlineMath(fig.caption)}</p>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="space-y-2 h-full">
      <span class="text-xs font-bold text-slate-300 block font-sans flex items-center gap-1.5">
        <i data-lucide="image" class="w-3.5 h-3.5 text-indigo-400"></i> 原文经典生图网格与去噪轨迹 (Original Paper Gallery)
      </span>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${cardsHTML}
      </div>
    </div>
  `;
}

function getMyVisualizationsHTML(viz, style) {
  if (!viz) {
    return `
      <div class="bg-black/20 border border-white/5 rounded-xl p-4 text-slate-500 text-xs text-center">
        未登记我的实验具体可视化，可参考 HPO 对抗测评 Dashboard。
      </div>
    `;
  }

  // 1. Loss & Indicator curves
  let curvesSrc = viz.curvesImage;
  if (curvesSrc && curvesSrc.startsWith('presentation/')) {
    curvesSrc = curvesSrc.replace('presentation/', '');
  }

  // 2. Final generation overview
  let generationSrc = viz.generationImage;
  if (generationSrc && generationSrc.startsWith('presentation/')) {
    generationSrc = generationSrc.replace('presentation/', '');
  }

  // 3. Sampling trajectory animation
  let animationSrc = viz.animationGif;
  if (animationSrc && animationSrc.startsWith('presentation/')) {
    animationSrc = animationSrc.replace('presentation/', '');
  }

  return `
    <div class="space-y-4 pt-4 border-t border-white/5">
      <span class="text-xs font-bold text-slate-300 block font-sans flex items-center gap-1.5">
        <i data-lucide="play-circle" class="w-4 h-4 text-cyan-400 animate-pulse"></i>
        窄流形复现：我的 HPO 实验多维可视化成果 (My Replicated HPO Visualizations)
      </span>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- 1. 收敛曲线 -->
        <div class="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div class="space-y-1">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <i data-lucide="trending-up" class="w-3.5 h-3.5 text-cyan-400"></i> 1. 训练 Loss & 倒角距离收敛曲线
            </span>
            <p class="text-[9px] text-slate-500 leading-relaxed text-justify">
              ${formatInlineMath(viz.curvesCaption || "展示了在对齐训练算力(40.81G FLOPs)下，不同推理步数(NFE = 100, 20, 5, 1)训练时的收敛过程。")}
            </p>
          </div>
          ${curvesSrc ? `
            <div class="flex-1 flex items-center justify-center p-2 bg-[#040711] rounded-lg border border-white/5 cursor-pointer relative group"
                 onclick="openLightbox('${curvesSrc}', '<b>训练 Loss 与评估指标变化曲线</b>: ${viz.curvesCaption ? viz.curvesCaption.replace(/'/g, "\\'") : ''}')">
              <img src="${curvesSrc}" class="max-h-[160px] w-auto rounded object-contain group-hover:scale-[1.02] transition" alt="Convergence Curves">
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-lg">
                <span class="px-2 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[8px] font-bold">🔍 放大</span>
              </div>
            </div>
          ` : `
            <div class="flex-1 flex items-center justify-center p-2 bg-[#040711] rounded-lg border border-white/5 text-[9px] text-slate-600 font-mono">Curves PNG unavailable</div>
          `}
          <div class="text-[8px] text-slate-500 font-mono text-center">Click to zoom high-resolution chart</div>
        </div>

        <!-- 2. 最终生图效果 -->
        <div class="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div class="space-y-1">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <i data-lucide="layout-grid" class="w-3.5 h-3.5 text-cyan-400"></i> 2. 不同 NFE 最佳 HPO 点云生图对比
            </span>
            <p class="text-[9px] text-slate-500 leading-relaxed text-justify">
              ${formatInlineMath(viz.generationCaption || "不同推理步数（NFE = 100, 20, 5, 1）在 2D Archimedean 海螺窄流形上的点云生成效果对比。")}
            </p>
          </div>
          ${generationSrc ? `
            <div class="flex-1 flex items-center justify-center p-2 bg-[#040711] rounded-lg border border-white/5 cursor-pointer relative group"
                 onclick="openLightbox('${generationSrc}', '<b>HPO最佳点云生成效果对比</b>: ${viz.generationCaption ? viz.generationCaption.replace(/'/g, "\\'") : ''}')">
              <img src="${generationSrc}" class="max-h-[160px] w-auto rounded object-contain group-hover:scale-[1.02] transition" alt="Generation Overview">
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-lg">
                <span class="px-2 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[8px] font-bold">🔍 放大</span>
              </div>
            </div>
          ` : `
            <div class="flex-1 flex items-center justify-center p-2 bg-[#040711] rounded-lg border border-white/5 text-[9px] text-slate-600 font-mono">Overview PNG unavailable</div>
          `}
          <div class="text-[8px] text-slate-500 font-mono text-center">Multi-NFE點云分佈橫向極限對决</div>
        </div>

        <!-- 3. 采样轨迹动画 -->
        <div class="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div class="space-y-1">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
              <i data-lucide="video" class="w-3.5 h-3.5 text-cyan-400"></i> 3. 最优 NFE 采样轨迹动态演进
            </span>
            <p class="text-[9px] text-slate-500 leading-relaxed text-justify">
              ${formatInlineMath(viz.animationCaption || "从各向同性高斯随机噪声开始，通过常微分/随机微分回退，逐步向窄流形海螺线中心聚拢的全物理演化。")}
            </p>
          </div>
          ${animationSrc ? `
            <div class="flex-1 flex items-center justify-center p-2 bg-[#040711] rounded-lg border border-white/5 cursor-pointer relative group"
                 onclick="openLightbox('${animationSrc}', '<b>采样轨迹动态重放演进动画</b>: ${viz.animationCaption ? viz.animationCaption.replace(/'/g, "\\'") : ''}')">
              <img src="${animationSrc}" class="max-h-[160px] w-auto rounded object-contain group-hover:scale-[1.02] transition" alt="Sampling Animation">
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-lg">
                <span class="px-2 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[8px] font-bold">🔍 放大</span>
              </div>
            </div>
          ` : `
            <div class="flex-1 flex items-center justify-center p-2 bg-[#040711] rounded-lg border border-white/5 text-[9px] text-slate-600 font-mono">Animation GIF unavailable</div>
          `}
          <div class="text-[8px] text-slate-500 font-mono text-center">Matplotlib FuncAnimation 300DPI 渲染</div>
        </div>
      </div>
    </div>
  `;
}

function getRawAssetsHTML(assets) {
  if (!assets || assets.length === 0) {
    return `
      <div class="glass-panel rounded-2xl p-5 border border-white/5 space-y-3 h-full flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-3">
            <i data-lucide="archive" class="w-4 h-4 text-cyan-400"></i>
            <h3 class="text-xs font-bold text-white">核心物理代码与报告资产 (Assets)</h3>
          </div>
          <p class="text-[10px] text-slate-500 font-mono">此文献暂未登记具体工作区代码资产。</p>
        </div>
      </div>
    `;
  }

  const itemsHTML = assets.map(asset => `
    <div class="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 hover:border-slate-800 transition">
      <div class="flex items-center gap-2 min-w-0">
        <i data-lucide="file-code" class="w-4 h-4 text-cyan-400 shrink-0"></i>
        <span class="text-[10px] font-mono text-slate-300 truncate">${formatInlineMath(asset.label)}</span>
      </div>
      <span class="text-[9px] font-mono text-slate-500 ml-2 select-all max-w-[150px] truncate bg-black/40 px-1.5 py-0.5 rounded border border-white/5">${asset.path}</span>
    </div>
  `).join('');

  return `
    <div class="glass-panel rounded-2xl p-5 border border-white/5 space-y-3 h-full flex flex-col justify-between">
      <div>
        <div class="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-3">
          <i data-lucide="archive" class="w-4 h-4 text-cyan-400"></i>
          <h3 class="text-xs font-bold text-white">核心物理代码与报告资产 (Assets)</h3>
        </div>
        <div class="space-y-2">
          ${itemsHTML}
        </div>
      </div>
      <p class="text-[9px] text-slate-500 font-mono mt-3 leading-relaxed">
        * 提示：这些文件存在于当前工作区目录中，可在 Cursor 中直接编辑运行。
      </p>
    </div>
  `;
}

function getFiguresHTML(figures, style) {
  if (!figures || figures.length === 0) return '';

  const cardsHTML = figures.map(fig => {
    // 路径正常化
    let cleanSrc = fig.src;
    if (cleanSrc.startsWith('presentation/')) {
      cleanSrc = cleanSrc.replace('presentation/', '');
    }
    
    return `
      <div class="bg-black/30 border border-white/5 rounded-xl overflow-hidden hover:${style.borderHover} transition duration-300 flex flex-col group relative">
        <div class="relative aspect-video w-full overflow-hidden bg-slate-950 flex items-center justify-center cursor-pointer" onclick="openLightbox('${cleanSrc}', '${fig.title} - ${fig.caption.replace(/'/g, "\\'")}')">
          <img src="${cleanSrc}" class="max-h-[160px] max-w-full object-contain transition duration-500 group-hover:scale-105" alt="${fig.title}">
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
            <span class="px-3 py-1.5 rounded-lg bg-${style.textAccent.split('-')[1]}-500/20 text-${style.textAccent} border border-${style.textAccent.split('-')[1]}-500/30 text-[10px] font-bold flex items-center gap-1">
              <i data-lucide="zoom-in" class="w-3.5 h-3.5"></i> 全屏查看
            </span>
          </div>
        </div>
        <div class="p-3 space-y-1 flex-1 flex flex-col justify-between">
          <h5 class="text-xs font-bold text-white group-hover:${style.text} transition">${formatInlineMath(fig.title)}</h5>
          <p class="text-[10px] text-slate-500 leading-relaxed text-justify">${formatInlineMath(fig.caption)}</p>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="space-y-3 pt-2">
      <div class="flex items-center gap-2 border-b border-white/5 pb-2 mb-1">
        <i data-lucide="image" class="w-4 h-4 text-indigo-400"></i>
        <h3 class="text-xs font-bold text-white">精选学术图表与 HPO Loss 收敛轨迹 (Figures)</h3>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${cardsHTML}
      </div>
    </div>
  `;
}

function getNotesHTML(notes, style) {
  if (!notes || notes.length === 0) {
    return `<div class="text-center py-12 text-slate-500">该文献暂无汇报提示备忘录。</div>`;
  }

  const bulletNotesHTML = notes.map((note, idx) => `
    <li class="flex items-start gap-3 bg-black/20 p-3 rounded-xl border border-white/5 hover:border-${style.textAccent.split('-')[1]}-500/20 transition duration-300">
      <div class="w-6 h-6 rounded-lg ${style.bgAccent10} ${style.textAccent} flex items-center justify-center shrink-0 border ${style.borderAccent20}">
        <i data-lucide="mic" class="w-3.5 h-3.5 animate-pulse"></i>
      </div>
      <div class="space-y-1">
        <span class="text-[9px] font-mono text-slate-500 font-bold block">PITCH POINT 0${idx + 1}</span>
        <p class="text-xs text-slate-300 leading-relaxed text-justify font-sans">
          ${formatInlineMath(note)}
        </p>
      </div>
    </li>
  `).join('');

  return `
    <div class="glass-panel rounded-2xl p-5 border border-white/5 relative overflow-hidden animate-fadeIn">
      <div class="absolute -top-3 -left-3 w-16 h-16 ${style.themeGlow} rounded-full blur-xl pointer-events-none"></div>
      
      <div class="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-4">
        <i data-lucide="message-square" class="w-5 h-5 ${style.textAccent}"></i>
        <div>
          <h3 class="text-sm font-bold text-white">组会汇报发言锦囊 / Presenter's Cheat-Sheet</h3>
          <p class="text-[10px] text-slate-500">高水平学术汇报讲解话术、核心答辩博弈逻辑，带你彻底征服组会</p>
        </div>
      </div>
      
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${bulletNotesHTML}
      </ul>
    </div>
  `;
}
