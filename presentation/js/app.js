/**
 * 组会汇报演进大视窗 • 核心 UI 逻辑控制器
 * 包含：学术里程碑大幻灯片（Widescreen Presentation Deck）控制、
 * 论文细读与公式算法交互渲染、一阶/二阶/连续物理沙盒连接、
 * HPO 对抗测评 Dashboard 切换、学术 BibTeX 引用及全屏 Lightbox 控制。
 */

// 1. 全局状态
let simulator = null;
let currentHpoNfe = 100; // 默认 HPO 测评 NFE = 100
let currentHpoAlgo = 'all'; // 默认展示全部算法
let currentHpoProcess = 'last'; // 默认展示最终结果 / 最后一次采样过程
let currentHpoImageKind = 'generation'; // 默认 HPO 视图 = 'generation'

// 里程碑学术大视窗状态
let currentMilestoneId = 'm-ddpm'; // 默认激活第一个：DDPM
let currentDeckTab = 'abstract'; // 默认激活第一个 Tab：论文贡献
let activeAlgoIndex = 0; // 当前选中的算法索引

// 样式配置，为三大流派（随机轨迹、直线一阶流、均值单步流）配置极致 literal Tailwind CSS 样式
const schoolStyles = {
  trajectory: {
    border: 'border-amber-500/20 hover:border-amber-500/40',
    borderActive: 'border-amber-500/40 bg-amber-500/10 ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/5',
    badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    dot: 'border-amber-500 text-amber-400',
    dotActive: 'bg-amber-500 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    dotInner: 'bg-amber-500',
    accent: 'amber-400',
    borderHover: 'border-amber-500/30',
    bgAccent10: 'bg-amber-500/10',
    textAccent: 'text-amber-400',
    borderAccent20: 'border-amber-500/20',
    textAccentMuted: 'text-amber-500/70',
    text: 'text-amber-400',
    themeGlow: 'bg-amber-500/5'
  },
  unified: {
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    borderActive: 'border-cyan-500/40 bg-cyan-500/10 ring-1 ring-cyan-500/20 shadow-lg shadow-cyan-500/5',
    badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    dot: 'border-cyan-500 text-cyan-400',
    dotActive: 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.5)]',
    dotInner: 'bg-cyan-400',
    accent: 'cyan-400',
    borderHover: 'border-cyan-500/30',
    bgAccent10: 'bg-cyan-500/10',
    textAccent: 'text-cyan-400',
    borderAccent20: 'border-cyan-500/20',
    textAccentMuted: 'text-cyan-500/70',
    text: 'text-cyan-400',
    themeGlow: 'bg-cyan-500/5'
  },
  meanflow: {
    border: 'border-indigo-500/20 hover:border-indigo-500/40',
    borderActive: 'border-indigo-500/40 bg-indigo-500/10 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5',
    badge: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    dot: 'border-indigo-500 text-indigo-400',
    dotActive: 'bg-indigo-400 border-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]',
    dotInner: 'bg-indigo-400',
    accent: 'indigo-400',
    borderHover: 'border-indigo-500/30',
    bgAccent10: 'bg-indigo-500/10',
    textAccent: 'text-indigo-400',
    borderAccent20: 'border-indigo-500/20',
    textAccentMuted: 'text-indigo-500/70',
    text: 'text-indigo-400',
    themeGlow: 'bg-indigo-500/5'
  }
};

// 2. 初始化加载
window.addEventListener('DOMContentLoaded', () => {
  // 初始化海螺线物理仿真器
  simulator = new PhysicsSimulator('simulator-canvas');
  simulator.selectParadigm('mean-flows');

  // 初始化物理流形数据集海螺线展示画布
  initDatasetSpiralCanvas();

  // 渲染 left 侧学术演进编年史
  renderTimeline();

  // 渲染右侧激活学术大视窗页面（默认 DDPM）
  renderActiveMilestone();

  // 初始化我的 HPO 测评 Dashboard
  initHpoDashboardControls();
  updateHpoDisplay();

  // 同步初始化主题按钮图标
  updateThemeIcons();
});

// 3. 渲染左侧学术演进时间轴
function renderTimeline(dataToRender = milestones) {
  const container = document.getElementById('sidebar-timeline-nav');
  if (!container) return;
  container.innerHTML = '';

  if (dataToRender.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-slate-500 text-xs">
        <i data-lucide="info" class="w-8 h-8 mx-auto opacity-30 mb-1"></i>
        无匹配里程碑
      </div>
    `;
    lucide.createIcons();
    return;
  }

  dataToRender.forEach((node, index) => {
    // 建立里程碑与其 deepDive 数据关联，从而取得短标题
    const deepDive = paperDeepDives.find(p => p.milestoneId === node.id);
    const shortTitle = deepDive ? deepDive.shortTitle : node.paper.split(':')[0];
    const style = schoolStyles[node.school] || schoolStyles.unified;
    
    const isSelected = node.id === currentMilestoneId;
    const activeClass = isSelected ? style.borderActive : style.border;
    const bulletClass = isSelected ? style.dotActive : style.dot;
    const bulletInnerClass = isSelected ? 'bg-white' : style.dotInner;
    const textClass = isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white';
    const lineClass = index === dataToRender.length - 1 ? 'hidden' : '';

    const badgeClass = isSelected ? style.badge : 'bg-black/35 text-slate-400';

    const itemHTML = `
      <div onclick="selectMilestone('${node.id}')" class="relative flex items-center gap-3.5 p-3 rounded-xl cursor-pointer transition duration-300 group border ${activeClass}">
        <!-- 时间线竖条连接线 -->
        <div class="absolute left-6 top-8 bottom-0 w-0.5 bg-white/10 -translate-x-1/2 -z-10 ${lineClass}"></div>
        
        <!-- 粒子圈标记 -->
        <div class="w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 z-10 transition duration-300 ${bulletClass}">
          <div class="w-1.5 h-1.5 rounded-full ${bulletInnerClass}"></div>
        </div>
        
        <!-- 卡片文字信息 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1.5">
            <span class="text-[10px] font-mono text-slate-500 font-bold">${node.year}</span>
            <span class="px-1.5 py-0.5 rounded text-[8px] font-extrabold ${badgeClass}">${node.status}</span>
          </div>
          <h4 class="text-xs font-extrabold truncate mt-0.5 ${textClass}">${shortTitle}</h4>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', itemHTML);
  });

  lucide.createIcons();
}

// 4. 选中某个里程碑，并更新右侧完整学术页面
function selectMilestone(id) {
  currentMilestoneId = id;
  activeAlgoIndex = 0; // 重置算法微标签

  // 刷新左侧列表的激活高亮状态
  renderTimeline();

  // 刷新右侧完整的学术卡片数据
  renderActiveMilestone();
}

// 5. 渲染当前选中的学术里程碑“大页面”
function renderActiveMilestone() {
  const milestone = milestones.find(m => m.id === currentMilestoneId);
  const deepDive = paperDeepDives.find(p => p.milestoneId === currentMilestoneId);
  if (!milestone || !deepDive) return;

  const style = schoolStyles[milestone.school] || schoolStyles.unified;

  // RENDER 1: 页面大部 Banner 头部
  const headerEl = document.getElementById('deck-paper-header');
  if (headerEl) {
    // 重置 Header 样式 class
    headerEl.className = `glass-panel rounded-2xl p-6 relative overflow-hidden border ${style.borderHover} bg-slate-950/40 transition-all duration-500`;
    
    // 渲染资源微连接按钮
    let linksHTML = '';
    if (deepDive.links) {
      if (deepDive.links.arxiv) {
        linksHTML += `
          <a href="${deepDive.links.arxiv}" target="_blank" class="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black border border-white/5 text-[10px] font-bold text-slate-300 hover:text-white transition flex items-center gap-1">
            <i data-lucide="external-link" class="w-3 h-3 text-cyan-400"></i> arXiv
          </a>
        `;
      }
      if (deepDive.links.pdf || deepDive.links.localPdf) {
        const pdfLink = deepDive.links.localPdf || deepDive.links.pdf;
        linksHTML += `
          <a href="${pdfLink}" target="_blank" class="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black border border-white/5 text-[10px] font-bold text-slate-300 hover:text-white transition flex items-center gap-1">
            <i data-lucide="file-text" class="w-3 h-3 text-red-400"></i> PDF 论文
          </a>
        `;
      }
      if (deepDive.links.code) {
        linksHTML += `
          <a href="${deepDive.links.code}" target="_blank" class="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black border border-white/5 text-[10px] font-bold text-slate-300 hover:text-white transition flex items-center gap-1">
            <i data-lucide="github" class="w-3 h-3 text-slate-200"></i> Code 源码
          </a>
        `;
      }
    }

    headerEl.innerHTML = `
      <!-- 背景光晕 -->
      <div class="absolute top-0 right-0 w-64 h-64 ${style.themeGlow} rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div class="space-y-2 max-w-4xl">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest ${style.badge}">
              ${milestone.status}
            </span>
            <span class="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1">
              <i data-lucide="presentation" class="w-3.5 h-3.5"></i> ${deepDive.venue}
            </span>
          </div>
          <h2 class="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-snug">
            ${deepDive.title}
          </h2>
          <p class="text-[11px] text-slate-400">
            <b>作者：</b>${deepDive.authors.join(', ')} • <b>年份：</b>${deepDive.year}
          </p>
        </div>

        <div class="flex flex-wrap md:flex-col lg:flex-row gap-2 shrink-0">
          ${linksHTML}
          <button onclick="showCitation('${milestone.id}')" class="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black border border-white/5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1">
            <i data-lucide="quote" class="w-3 h-3"></i> BibTeX 引用
          </button>
        </div>
      </div>
    `;
  }

  // RENDER 2: 重新绘制 Tab 标签状态高亮
  document.querySelectorAll('.deck-tab-btn').forEach(btn => {
    btn.className = 'deck-tab-btn px-4 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5 border border-transparent';
  });
  const activeTabBtn = document.getElementById(`deck-tab-btn-${currentDeckTab}`);
  if (activeTabBtn) {
    activeTabBtn.className = `deck-tab-btn px-4 py-2.5 rounded-lg ${style.bgAccent10} ${style.textAccent} border ${style.borderAccent20} transition flex items-center gap-1.5 font-bold`;
  }

  // RENDER 3: 渲染 Tab 对应的卡片视窗
  const viewport = document.getElementById('deck-content-viewport');
  if (!viewport) return;

  if (currentDeckTab === 'abstract') {
    viewport.innerHTML = getAbstractHTML(deepDive, style);
  } else if (currentDeckTab === 'math') {
    viewport.innerHTML = getMathHTML(deepDive, style);
  } else if (currentDeckTab === 'algorithm') {
    viewport.innerHTML = getAlgorithmHTML(deepDive, style);
  } else if (currentDeckTab === 'original_benchmarks') {
    viewport.innerHTML = `
      <div class="space-y-6 animate-fadeIn">
        <!-- 📘 📖 经典文献原作实验 (Original Publication Benchmarks) -->
        <div class="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
          <h4 class="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2.5">
            <span class="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-mono font-bold">BLOCK 1</span>
            经典文献原作实验与指标 (Original Publication Benchmarks)
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
            <!-- 原作指标表格 (45% w) -->
            <div class="md:col-span-5 space-y-3">
              ${getOriginalBenchmarksHTML(deepDive.originalPaperBenchmarks, style)}
            </div>
            <!-- 原作生图演示 (55% w) -->
            <div class="md:col-span-7">
              ${getOriginalFiguresHTML(deepDive.originalPaperFigures || deepDive.figures, style)}
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (currentDeckTab === 'replicated_benchmarks') {
    viewport.innerHTML = `
      <div class="space-y-6 animate-fadeIn">
        <!-- ⚙️ 等效算力约束下：我的 HPO 复现实验 (My Replicated HPO Experiments) -->
        <div class="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
          <h4 class="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2.5">
            <span class="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-mono font-bold">BLOCK 2</span>
            等效算力约束下：我的 2D 窄流形 HPO 实验 (My Replicated HPO Experiments)
          </h4>
          
          <!-- HPO 评测物理环境 -->
          ${getExperimentSetupHTML(deepDive.experimentSetup)}
          
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
            <!-- 我的 HPO 最佳 Chamfer Distance 测评表格 -->
            <div class="md:col-span-6 space-y-4">
              ${getBenchmarksHTML(deepDive.benchmarks, style)}
            </div>
            <!-- 我的物理代码与报告资产 -->
            <div class="md:col-span-6">
              ${getRawAssetsHTML(deepDive.rawDataAssets)}
            </div>
          </div>

          <!-- 我的实验结果可视化：Loss曲线、指标、效果图、动画 -->
          ${getMyVisualizationsHTML(deepDive.myVisualizations, style)}
        </div>
      </div>
    `;
  } else if (currentDeckTab === 'notes') {
    viewport.innerHTML = getNotesHTML(deepDive.presentationNotesZh, style);
  }

  // 渲染动态注入 HTML 中的 LaTeX 公式
  renderMath();
  lucide.createIcons();
}

// 6. 里程碑大 Tab 面板切换
function switchDeckTab(tabName) {
  currentDeckTab = tabName;
  renderActiveMilestone();
}

// 7. 算法伪代码内层微 Tab 切换
function switchActiveAlgo(index) {
  activeAlgoIndex = index;
  renderActiveMilestone();
}

// 8. 抽象并生成各个部分的 HTML 片段 (已解耦重构并拆分至 js/ui-generators.js)

// 9. Python 代码微型高亮语法解析器
function highlightPython(code) {
  if (!code) return '';
  // 实体转义防止渲染事故
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // 匹配注释
  escaped = escaped.replace(/(#[^\n]*)/g, '<span class="text-slate-500 italic">$1</span>');
  
  // 匹配字符串
  escaped = escaped.replace(/(["'])(.*?)\1/g, '<span class="text-emerald-400">"$2"</span>');
  
  // 匹配关键字
  const keywords = [
    'def', 'class', 'import', 'from', 'as', 'for', 'in', 'if', 'elif', 'else', 
    'while', 'return', 'and', 'or', 'not', 'with', 'try', 'except', 'lambda', 'none', 'stopgrad'
  ];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    escaped = escaped.replace(regex, '<span class="text-indigo-400 font-semibold">$1</span>');
  });

  // 匹配数值
  escaped = escaped.replace(/\b(\d+(?:\.\d+)?(?:e-?\d+)?)\b/g, '<span class="text-amber-400">$1</span>');

  // 匹配函数名
  escaped = escaped.replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="text-cyan-400 font-medium">$1</span>');

  return escaped;
}

// 10. HPO 测评 Dashboard 切换控制逻辑
const ALGO_COLORS = {
  ddpm: '#818cf8',               // 浅靛蓝
  ddim: '#22d3ee',               // 明亮青色
  avg_ddim: '#34d399',           // 翡翠绿 (Avg-DDIM 冠军！)
  vdm: '#fbbf24',                // 琥珀黄
  v_learning: '#60a5fa',          // 天空蓝
  flow_matching: '#f472b6',      // 蔷薇粉
  consistency_models: '#2dd4bf', // 碧绿色
  mean_flow: '#f87171'           // 珊瑚红
};

const ALGO_DISPLAY_NAMES = {
  ddpm: 'DDPM',
  ddim: 'DDIM',
  avg_ddim: 'Avg-DDIM (Champion ★)',
  vdm: 'VDM',
  v_learning: 'V-Learning',
  flow_matching: 'Flow Matching',
  consistency_models: 'Consistency',
  mean_flow: 'Mean Flow (2026)'
};

const ALGO_ORDER_LIST = [
  'ddpm', 'ddim', 'avg_ddim', 'vdm',
  'v_learning', 'flow_matching', 'consistency_models', 'mean_flow'
];

let hpoChartInstance = null;
let hpoReplayIntervalId = null;
let hpoReplayFrameIndex = 0;
let hpoIsReplaying = false;
const HPO_REPLAY_SLIDER_STEPS = 1000;

function initHpoDashboardControls() {
  const algoControls = document.getElementById('hpo-algo-controls');
  if (algoControls) {
    const algoButtons = [
      { value: 'all', label: 'ALL' },
      ...ALGO_ORDER_LIST.map(algo => ({ value: algo, label: ALGO_DISPLAY_NAMES[algo].replace(' (Champion ★)', '').replace(' (2026)', '') }))
    ];

    algoControls.innerHTML = algoButtons.map(item => `
      <button onclick="switchHpoAlgoFilter('${item.value}')" data-hpo-filter="algo" data-hpo-value="${item.value}" class="hpo-filter-btn py-2 rounded-lg border border-white/5 bg-slate-800/30 hover:bg-slate-800/80 text-slate-400 font-semibold text-[10px] transition">
        ${item.label}
      </button>
    `).join('');
  }

  const matrixTable = document.getElementById('hpo-fixed-matrix-table');
  if (matrixTable && hpoData.matrix) {
    matrixTable.innerHTML = hpoData.matrix.tableHTML;
  }

  syncHpoControlStyles();
}

function setHpoButtonGroupActive(group, activeValue) {
  document.querySelectorAll(`[data-hpo-filter="${group}"]`).forEach(btn => {
    btn.className = 'hpo-filter-btn py-2 rounded-lg border border-white/5 bg-slate-800/30 hover:bg-slate-800/80 text-slate-400 font-semibold text-xs transition';
    if (group === 'algo') btn.className = btn.className.replace('text-xs', 'text-[10px]');
    if (group === 'nfe' && btn.dataset.hpoValue === 'all') btn.className = btn.className.replace('hpo-filter-btn', 'hpo-filter-btn col-span-2');
    if (btn.dataset.hpoValue === String(activeValue)) {
      btn.className = btn.className
        .replace('border-white/5 bg-slate-800/30 hover:bg-slate-800/80 text-slate-400 font-semibold', 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-bold');
    }
  });
}

function syncHpoControlStyles() {
  setHpoButtonGroupActive('nfe', currentHpoNfe);
  setHpoButtonGroupActive('algo', currentHpoAlgo);
  setHpoButtonGroupActive('process', currentHpoProcess);
  setHpoButtonGroupActive('plot', currentHpoImageKind);
}

function switchHpoTab(key) {
  switchHpoNfeFilter(key);
}

function switchHpoNfeFilter(value) {
  currentHpoNfe = value;
  syncHpoControlStyles();
  updateHpoDisplay();
}

function switchHpoAlgoFilter(value) {
  currentHpoAlgo = value;
  syncHpoControlStyles();
  updateHpoDisplay();
}

function switchHpoProcessFilter(value) {
  currentHpoProcess = value;
  syncHpoControlStyles();
  updateHpoDisplay();
}

// 切换 HPO 测评图片类型
function switchHpoImageKind(kind) {
  currentHpoImageKind = kind;
  syncHpoControlStyles();
  updateHpoDisplay();
}

function getSelectedHpoNfes() {
  return currentHpoNfe === 'all' ? [100, 20, 5, 1] : [Number(currentHpoNfe)];
}

function getSelectedHpoAlgos() {
  return currentHpoAlgo === 'all' ? ALGO_ORDER_LIST : [currentHpoAlgo];
}

function getHpoRunCombos() {
  const combos = [];
  getSelectedHpoNfes().forEach(nfe => {
    const nfeData = visualReplayData.runs[nfe];
    if (!nfeData) return;

    getSelectedHpoAlgos().forEach(algo => {
      const runData = nfeData[algo];
      if (runData) combos.push({ nfe, algo, runData });
    });
  });
  return combos;
}

function formatHpoSelectionLabel() {
  const nfeLabel = currentHpoNfe === 'all' ? 'ALL' : currentHpoNfe;
  const algoLabel = currentHpoAlgo === 'all' ? 'ALL' : ALGO_DISPLAY_NAMES[currentHpoAlgo];
  const processLabel = currentHpoProcess === 'all' ? '采样过程' : '最终';
  const plotLabel = {
    generation: '模型分布',
    loss: 'Loss',
    metrics: '指标'
  }[currentHpoImageKind];
  return `NFE=${nfeLabel} / ${algoLabel} / ${processLabel} / ${plotLabel}`;
}

function getFinalMetricValue(runData, metric) {
  const history = metric === 'loss' ? runData.loss_history : runData.metrics_history;
  if (!history || history.length === 0) return null;

  const last = history[history.length - 1];
  if (metric === 'loss') return last.loss;
  if (metric === 'entropy') return last.entropy;
  if (metric === 'coverage') return last.coverage;
  return last.chamfer;
}

function inferPointRadius(pointCount, options = {}) {
  const {
    referenceCount = 500,
    referenceRadius = 1.55,
    minRadius = 0.38,
    maxRadius = 1.55,
    noiseScale = 0.75,
    isNoise = false
  } = options;
  const safeCount = Math.max(1, pointCount || referenceCount);
  const radius = referenceRadius * Math.sqrt(referenceCount / safeCount);
  const clampedRadius = Math.max(minRadius, Math.min(maxRadius, radius));
  return isNoise ? Math.max(minRadius, clampedRadius * noiseScale) : clampedRadius;
}

function getHpoReplayFrameCount() {
  if (currentHpoImageKind !== 'generation' || currentHpoProcess !== 'all') return 0;
  return getHpoRunCombos().reduce((maxFrames, combo) => {
    const frames = combo.runData.trajectory?.frames;
    return frames ? Math.max(maxFrames, frames.length) : maxFrames;
  }, 0);
}

function getSampleTFromSlider(sliderValue) {
  const safeValue = Math.max(0, Math.min(Number(sliderValue) || 0, HPO_REPLAY_SLIDER_STEPS));
  return 1 - safeValue / HPO_REPLAY_SLIDER_STEPS;
}

function normalizeTrajectoryTimes(times) {
  if (!times || times.length === 0) return [];
  if (times.length === 1) return [0];

  const first = Number(times[0]);
  const last = Number(times[times.length - 1]);
  const span = Math.abs(first - last);
  if (!Number.isFinite(first) || !Number.isFinite(last) || span < 1e-12) {
    return times.map((_, idx) => 1 - idx / Math.max(1, times.length - 1));
  }

  return times.map(raw => {
    const t = Number(raw);
    if (first > last) return Math.max(0, Math.min(1, (t - last) / span));
    return Math.max(0, Math.min(1, 1 - (t - first) / span));
  });
}

function getTrajectorySampleTimes(trajectory) {
  if (trajectory?.sample_t && trajectory.sample_t.length > 0) {
    return trajectory.sample_t.map(raw => Math.max(0, Math.min(1, Number(raw))));
  }
  return normalizeTrajectoryTimes(trajectory?.times);
}

function getSyncedTrajectoryFrame(trajectory, sampleT) {
  const frames = trajectory?.frames;
  if (!frames || frames.length === 0) return { points: null, frameIdx: null, sampleT: null };
  if (frames.length === 1) return { points: frames[0], frameIdx: 0, sampleT: sampleT };

  const normalizedTimes = getTrajectorySampleTimes(trajectory);
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let idx = 0; idx < frames.length; idx++) {
    const frameT = normalizedTimes[idx] ?? (1 - idx / (frames.length - 1));
    const dist = Math.abs(frameT - sampleT);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = idx;
    }
  }

  return {
    points: frames[bestIdx],
    frameIdx: bestIdx,
    sampleT: normalizedTimes[bestIdx] ?? sampleT
  };
}

function updateHpoReplayProgress(frameIndex, frameCount) {
  const stepEl = document.getElementById('hpo-replay-step');
  const timeEl = document.getElementById('hpo-replay-time');
  const sliderEl = document.getElementById('hpo-replay-slider');
  const safeValue = Math.max(0, Math.min(Number(frameIndex) || 0, HPO_REPLAY_SLIDER_STEPS));
  const sampleT = getSampleTFromSlider(safeValue);

  if (stepEl) stepEl.innerText = `Sampling Time: t = ${sampleT.toFixed(3)}`;
  if (timeEl) timeEl.innerText = `timeline: t=1 → t=0`;
  if (sliderEl) {
    sliderEl.max = HPO_REPLAY_SLIDER_STEPS;
    sliderEl.value = safeValue;
  }
}

function seekHpoReplayFrame(rawFrameIndex) {
  const frameCount = getHpoReplayFrameCount();
  if (frameCount <= 0) return;

  const frameIndex = Math.max(0, Math.min(Number(rawFrameIndex) || 0, HPO_REPLAY_SLIDER_STEPS));
  hpoReplayFrameIndex = frameIndex;
  renderHpoPointsCanvas(frameIndex);
  updateHpoReplayProgress(frameIndex, frameCount);
}

// 渲染点云 HTML5 Canvas，支持 NFE / 算法 / 最终-采样过程组合筛选
function renderHpoPointsCanvas(animationFrameIndex = null) {
  const canvas = document.getElementById('hpo-points-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const cells = [];
  const replayFrameCount = getHpoReplayFrameCount();
  const activeFrameIndex = animationFrameIndex === null ? hpoReplayFrameIndex : animationFrameIndex;
  const activeSampleT = getSampleTFromSlider(activeFrameIndex);

  getHpoRunCombos().forEach(combo => {
    if (currentHpoProcess === 'all' && combo.runData.trajectory && combo.runData.trajectory.frames) {
      const trajectory = combo.runData.trajectory;
      const frame = getSyncedTrajectoryFrame(trajectory, activeSampleT);
      cells.push({ ...combo, points: frame.points, frameIdx: frame.frameIdx, frameTotal: trajectory.frames.length - 1, sampleT: frame.sampleT });
    } else {
      cells.push({ ...combo, points: combo.runData.generated_points, frameIdx: null, frameTotal: null });
    }
  });

  const maxCells = 40;
  const visibleCells = cells.slice(0, maxCells);
  const omittedCount = Math.max(0, cells.length - visibleCells.length);
  const columns = Math.min(2, visibleCells.length || 1);
  const cellWidth = 320;
  const cellHeight = 260;
  const isLight = document.documentElement.classList.contains('light');
  const canvasBg = isLight ? '#f1f5f9' : '#060913';
  const cellBg = isLight ? '#ffffff' : '#090d1f';
  const gtColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)';
  const noiseColor = isLight ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.3)';
  const textNoDataColor = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)';
  const cellBorderColor = (cellAlgo) => cellAlgo === 'avg_ddim' 
    ? (isLight ? 'rgba(16, 185, 129, 0.35)' : 'rgba(52, 211, 153, 0.25)') 
    : (isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)');

  const width = columns * cellWidth;
  const height = Math.max(cellHeight, Math.ceil(visibleCells.length / columns) * cellHeight);

  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = canvasBg;
  ctx.fillRect(0, 0, width, height);

  if (visibleCells.length === 0) {
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('当前筛选组合没有可绘制的点云 / 轨迹数据', width / 2, height / 2);
    return;
  }

  const scale = 78.0; // 缩放比例
  visibleCells.forEach((cell, idx) => {
    const row = Math.floor(idx / columns);
    const col = idx % columns;
    const offsetX = col * cellWidth;
    const offsetY = row * cellHeight;
    
    // 绘制格子背景与精美发光边框
    ctx.fillStyle = cellBg;
    ctx.fillRect(offsetX + 3, offsetY + 3, cellWidth - 6, cellHeight - 6);
    
    ctx.strokeStyle = cellBorderColor(cell.algo);
    ctx.lineWidth = cell.algo === 'avg_ddim' ? 2 : 1;
    ctx.strokeRect(offsetX + 3, offsetY + 3, cellWidth - 6, cellHeight - 6);
    
    const cellCenterX = offsetX + cellWidth / 2;
    const cellCenterY = offsetY + cellHeight / 2 + 10; // 稍微往下移，给标题留白
    
    // 3. 绘制背景参考流形线 (Ground Truth) -- 淡淡的白灰色显示真实轮廓
    if (visualReplayData.ground_truth) {
      ctx.fillStyle = gtColor;
      const gtSize = inferPointRadius(visualReplayData.ground_truth.length, {
        referenceCount: 800,
        referenceRadius: 1.15,
        minRadius: 0.35,
        maxRadius: 1.15
      });
      for (let pIdx = 0; pIdx < visualReplayData.ground_truth.length; pIdx++) {
        const pt = visualReplayData.ground_truth[pIdx];
        const px = cellCenterX + pt[0] * scale;
        const py = cellCenterY - pt[1] * scale;
        ctx.fillRect(px, py, gtSize, gtSize);
      }
    }
    
    // 4. 绘制算法生成的点云或去噪轨迹点
    const points = cell.points || [];
    const isNoiseFrame = cell.frameIdx === 0;
    
    if (points && points.length > 0) {
      ctx.fillStyle = isNoiseFrame ? noiseColor : ALGO_COLORS[cell.algo];
      const ptRadius = inferPointRadius(points.length, { isNoise: isNoiseFrame });
      for (let pIdx = 0; pIdx < points.length; pIdx++) {
        const pt = points[pIdx];
        const px = cellCenterX + pt[0] * scale;
        const py = cellCenterY - pt[1] * scale;
        ctx.beginPath();
        ctx.arc(px, py, ptRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = textNoDataColor;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无点云数据 (缺失)', cellCenterX, cellCenterY);
    }
    
    // 5. 绘制格内标注信息 (Algorithm Name)
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = cell.algo === 'avg_ddim' 
      ? (isLight ? '#059669' : '#34d399') 
      : (isLight ? '#1e293b' : '#94a3b8');
    const frameLabel = cell.frameIdx === null ? '最终' : `t=${(cell.sampleT ?? 0).toFixed(3)} · Frame ${cell.frameIdx + 1}/${cell.frameTotal + 1}`;
    ctx.fillText(`${ALGO_DISPLAY_NAMES[cell.algo]} · NFE ${cell.nfe}`, offsetX + cellWidth / 2, offsetY + 22);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(frameLabel, offsetX + cellWidth / 2, offsetY + 38);
    
    // 绘制该算法在此 NFE 下的倒角距离 (Chamfer Distance)
    const cdValue = getFinalMetricValue(cell.runData, 'chamfer');
    const cdLabel = cdValue === null ? 'N/A' : cdValue.toFixed(4);
    
    ctx.font = '10px monospace';
    ctx.fillStyle = cell.algo === 'avg_ddim' 
      ? (isLight ? '#059669' : '#34d399') 
      : (isLight ? '#475569' : 'rgba(148, 163, 184, 0.7)');
    ctx.fillText(`CD: ${cdLabel}`, offsetX + cellWidth / 2, offsetY + cellHeight - 12);
  });

  if (omittedCount > 0) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(width - 235, height - 28, 228, 20);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`组合过多，已省略 ${omittedCount} 个可绘制单元`, width - 12, height - 14);
  }
}

// 播放、暂停点云去噪重放动画
function toggleHpoReplay() {
  const maxFrames = getHpoReplayFrameCount();
  if (currentHpoImageKind !== 'generation' || currentHpoProcess !== 'all' || maxFrames <= 1) {
    alert("请先选择「模型分布」和「采样过程」。当前组合没有可播放的采样轨迹数据。");
    return;
  }
  
  const btn = document.getElementById('hpo-replay-btn');
  const progressEl = document.getElementById('hpo-replay-progress');
  if (!btn) return;
  
  if (hpoIsReplaying) {
    // 暂停
    clearInterval(hpoReplayIntervalId);
    hpoReplayIntervalId = null;
    hpoIsReplaying = false;
    btn.innerHTML = `<i data-lucide="play" class="w-3 h-3"></i> 播放去噪动画`;
    lucide.createIcons();
  } else {
    // 开始播放
    hpoIsReplaying = true;
    btn.innerHTML = `<i data-lucide="pause" class="w-3 h-3"></i> 暂停动画`;
    lucide.createIcons();
    if (progressEl) progressEl.classList.remove('invisible');

    const sliderStep = maxFrames <= 6 ? 100 : 25;
    hpoReplayIntervalId = setInterval(() => {
      renderHpoPointsCanvas(hpoReplayFrameIndex);
      updateHpoReplayProgress(hpoReplayFrameIndex, maxFrames);
      
      hpoReplayFrameIndex += sliderStep;
      if (hpoReplayFrameIndex > HPO_REPLAY_SLIDER_STEPS) {
        hpoReplayFrameIndex = 0; // 循环
      }
    }, maxFrames <= 6 ? 450 : 140);
  }
}

// 重置点云重放
function resetHpoReplay() {
  if (hpoReplayIntervalId) {
    clearInterval(hpoReplayIntervalId);
    hpoReplayIntervalId = null;
  }
  hpoIsReplaying = false;
  hpoReplayFrameIndex = 0;
  
  const btn = document.getElementById('hpo-replay-btn');
  if (btn) btn.innerHTML = `<i data-lucide="play" class="w-3 h-3"></i> 播放去噪动画`;
  lucide.createIcons();
  
  const progressEl = document.getElementById('hpo-replay-progress');
  if (progressEl) progressEl.classList.add('invisible');
  
  renderHpoPointsCanvas(0);
  updateHpoReplayProgress(0, getHpoReplayFrameCount());
}

let hpoCurrentSpecificMetric = 'chamfer'; // 默认 HPO 具体物理指标为 chamfer

// 切换特定展现物理指标
function switchSpecificMetric(metric) {
  hpoCurrentSpecificMetric = metric;
  
  // 更新按钮样式
  document.querySelectorAll('#hpo-metric-selector-container button').forEach(btn => {
    btn.className = 'px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-white/5 hover:text-slate-200 transition';
  });
  
  const activeBtn = document.getElementById(`metric-btn-${metric}`);
  if (activeBtn) {
    activeBtn.className = 'px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition';
  }
  
  updateHpoDisplay();
}

// 动态生成基于真实物理测算和超参搜索结果的学术 Leaderboard 榜单
function generateDynamicHpoLeaderboard(nfe, originalTableHTML) {
  const runs = visualReplayData.runs[nfe];
  if (!runs) return originalTableHTML;

  // 1. 获取所有模型最后一轮的真实指标并按倒角距离 CD 升序排序
  const algos = Object.keys(runs).map(algo => {
    const rData = runs[algo];
    const lastMetric = rData.metrics_history[rData.metrics_history.length - 1];
    const cd = lastMetric ? lastMetric.chamfer : Infinity;
    return { algo, cd, data: rData };
  });

  algos.sort((a, b) => a.cd - b.cd);

  // 2. 动态拼装高保真表格
  let tableHTML = `
    <div class="space-y-2">
      <div class="flex justify-between items-center text-xs">
        <span class="text-slate-400">学术 HPO 极限实证榜单:</span>
        <span class="font-bold text-white">NFE = ${nfe}</span>
      </div>
      <p class="text-[10px] text-slate-400 leading-relaxed font-sans">
        严格算力对齐下，通过贝叶斯寻优得到的网络尺寸、最优学习率、权重衰减及自适应配平 Epochs 成果。
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-[9px] text-left border-collapse border border-white/5">
          <thead>
            <tr class="bg-indigo-950/40 text-slate-400 border-b border-white/5 font-mono text-[8.5px]">
              <th class="p-1">算法 (Algo)</th>
              <th class="p-1">架构</th>
              <th class="p-1">LR / WD</th>
              <th class="p-1">Epochs</th>
              <th class="p-1 font-bold text-cyan-400">CD 倒角距离</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 font-mono">
  `;

  algos.forEach((item, idx) => {
    const isChampion = idx === 0;
    const isAvgDdim = item.algo === 'avg_ddim';
    
    let rowClass = 'bg-slate-900/30';
    let textClass = 'text-slate-300';
    if (isChampion) {
      rowClass = 'bg-emerald-950/20 text-emerald-400';
      textClass = 'font-bold text-emerald-400';
    } else if (isAvgDdim) {
      rowClass = 'bg-indigo-950/15 text-indigo-300';
      textClass = 'font-semibold text-indigo-300';
    }

    const sizeStr = `${item.data.hidden_dim}x${item.data.num_blocks}`;
    const lrStr = item.data.lr.toExponential(1);
    const wdStr = item.data.weight_decay.toExponential(1);
    const cdStr = item.cd === Infinity ? 'N/A' : item.cd.toFixed(6);

    tableHTML += `
      <tr class="${rowClass} ${textClass}">
        <td class="p-1 font-sans font-bold">${item.algo.toUpperCase()}</td>
        <td class="p-1">${sizeStr}</td>
        <td class="p-1 text-[8px]">${lrStr}/${wdStr}</td>
        <td class="p-1">${item.data.epochs}</td>
        <td class="p-1 font-bold">${cdStr}${isChampion ? ' ★' : ''}</td>
      </tr>
    `;
  });

  tableHTML += `
          </tbody>
        </table>
      </div>
  `;

  // 3. 将原 milestones 附带的、宝贵的“硬核透析”分析文本提取出来并拼在最下方
  let analysisPart = '';
  if (originalTableHTML && originalTableHTML.includes('硬核透析：')) {
    const parts = originalTableHTML.split('pt-1">');
    if (parts.length > 1) {
      analysisPart = '<div class="text-[9.5px] text-slate-400 leading-relaxed font-sans pt-1.5">' + parts[1];
    }
  }

  if (analysisPart) {
    tableHTML += analysisPart;
  } else {
    tableHTML += '</div>';
  }

  return tableHTML;
}

function generateHpoSelectionSummary() {
  const combos = getHpoRunCombos();
  const rows = combos.map(combo => {
    const cd = getFinalMetricValue(combo.runData, 'chamfer');
    return { ...combo, cd: cd === null ? Infinity : cd };
  }).sort((a, b) => a.cd - b.cd);

  if (rows.length === 0) {
    return `
      <div class="text-xs text-slate-400 leading-relaxed">
        当前筛选组合没有可展示的 HPO 日志数据。请切换 NFE、算法或绘图类型。
      </div>
    `;
  }

  const visibleRows = rows.slice(0, 12);
  const best = visibleRows[0];
  const tableRows = visibleRows.map((item, idx) => {
    const isChampion = idx === 0;
    const rowClass = isChampion ? 'bg-emerald-950/20 text-emerald-400 font-bold' : 'bg-slate-900/30 text-slate-300';
    const cdStr = item.cd === Infinity ? 'N/A' : item.cd.toFixed(6);
    return `
      <tr class="${rowClass}">
        <td class="p-1">${item.nfe}</td>
        <td class="p-1 font-sans font-bold">${ALGO_DISPLAY_NAMES[item.algo]}</td>
        <td class="p-1">${item.runData.hidden_dim}x${item.runData.num_blocks}</td>
        <td class="p-1">${item.runData.epochs}</td>
        <td class="p-1 font-bold">${cdStr}${isChampion ? ' ★' : ''}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="space-y-3">
      <div class="flex justify-between items-center text-xs">
        <span class="text-slate-400">当前组合:</span>
        <span class="font-bold text-cyan-300 text-right">${formatHpoSelectionLabel()}</span>
      </div>
      <p class="text-[10px] text-slate-400 leading-relaxed font-sans">
        已匹配 <b class="text-white">${rows.length}</b> 组真实 HPO 运行日志。当前最优为
        <b class="text-emerald-400">NFE ${best.nfe} · ${ALGO_DISPLAY_NAMES[best.algo]}</b>，
        最终倒角距离 CD = <b class="text-emerald-400">${best.cd.toFixed(6)}</b>。
      </p>
      <div class="overflow-x-auto">
        <table class="w-full text-[9px] text-left border-collapse border border-white/5">
          <thead>
            <tr class="bg-indigo-950/40 text-slate-400 border-b border-white/5 font-mono text-[8.5px]">
              <th class="p-1">NFE</th>
              <th class="p-1">算法</th>
              <th class="p-1">架构</th>
              <th class="p-1">Epochs</th>
              <th class="p-1 font-bold text-cyan-400">CD</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 font-mono">
            ${tableRows}
          </tbody>
        </table>
      </div>
      <div class="text-[9.5px] text-slate-500 leading-relaxed font-sans">
        ${rows.length > visibleRows.length ? `组合较多，仅展示 CD 最优的前 ${visibleRows.length} 项。` : '表格按最终 Chamfer Distance 升序排列。'}
      </div>
    </div>
  `;
}

// 渲染 ChartJS 折线图曲线
function renderHpoCharts() {
  const ctxEl = document.getElementById('hpo-chart-canvas');
  const selectorContainer = document.getElementById('hpo-metric-selector-container');
  if (!ctxEl) return;
  
  if (hpoChartInstance) {
    hpoChartInstance.destroy();
    hpoChartInstance = null;
  }
  
  const isLight = document.documentElement.classList.contains('light');
  const chartGridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.03)';
  const chartTextColor = isLight ? '#475569' : '#94a3b8';
  
  const isLoss = currentHpoImageKind === 'loss';
  const isLast = currentHpoProcess === 'last';
  const combos = getHpoRunCombos();
  
  // 控制具体指标选择菜单的显示与隐藏
  if (selectorContainer) {
    if (isLoss) {
      selectorContainer.classList.add('hidden');
    } else {
      selectorContainer.classList.remove('hidden');
    }
  }

  let chartType = 'line';
  let datasets = [];
  let labels = [];

  if (isLast) {
    chartType = 'bar';
    labels = combos.map(combo => `${combo.nfe}-${ALGO_DISPLAY_NAMES[combo.algo].replace(' (Champion ★)', '').replace(' (2026)', '')}`);
    const metricKey = isLoss ? 'loss' : hpoCurrentSpecificMetric;
    datasets = [{
      label: isLoss ? 'Final Training Loss' : `Final ${metricKey.toUpperCase()}`,
      data: combos.map(combo => getFinalMetricValue(combo.runData, metricKey)),
      backgroundColor: combos.map(combo => ALGO_COLORS[combo.algo] + '80'),
      borderColor: combos.map(combo => ALGO_COLORS[combo.algo]),
      borderWidth: 1.2,
      borderRadius: 4
    }];
  } else {
    combos.forEach(combo => {
      const history = isLoss ? combo.runData.loss_history : combo.runData.metrics_history;
      if (!history || history.length === 0) return;

      const chartPoints = history.map(item => {
        let val = isLoss ? item.loss : item.chamfer;
        if (!isLoss && hpoCurrentSpecificMetric === 'entropy') val = item.entropy;
        else if (!isLoss && hpoCurrentSpecificMetric === 'coverage') val = item.coverage;
        return { x: item.epoch, y: val };
      });

      if (chartPoints.length > labels.length) {
        labels = chartPoints.map(p => p.x);
      }

      datasets.push({
        label: `NFE ${combo.nfe} · ${combo.algo.toUpperCase()}`,
        data: chartPoints.map(p => p.y),
        borderColor: ALGO_COLORS[combo.algo],
        backgroundColor: ALGO_COLORS[combo.algo] + '10',
        borderWidth: combo.algo === 'avg_ddim' ? 3 : 1.5,
        pointRadius: currentHpoNfe === 'all' && currentHpoAlgo === 'all' ? 0 : (combo.algo === 'avg_ddim' ? 2 : 1),
        pointHoverRadius: 5,
        tension: 0.15,
        hidden: false
      });
    });
  }
  
  // 坐标轴标题与显示类型配置
  let yTitle = 'Training Loss';
  let scaleType = 'linear';
  let yMin = null;
  let yMax = null;
  let yTicksCallback = function(value) { return value.toFixed(3); };

  if (!isLoss) {
    if (hpoCurrentSpecificMetric === 'chamfer') {
      yTitle = 'Chamfer Distance (CD)';
      scaleType = 'logarithmic';
      yTicksCallback = function(value) { return value.toExponential(1); };
    } else if (hpoCurrentSpecificMetric === 'entropy') {
      yTitle = 'Uniformity Entropy (Entropy)';
      scaleType = 'linear';
      yMin = 0.90;
      yMax = 1.00;
      yTicksCallback = function(value) { return value.toFixed(3); };
    } else if (hpoCurrentSpecificMetric === 'coverage') {
      yTitle = 'Manifold Coverage (%)';
      scaleType = 'linear';
      yMin = 0.0;
      yMax = 1.0;
      yTicksCallback = function(value) { return (value * 100).toFixed(0) + '%'; };
    }
  }
  
  hpoChartInstance = new Chart(ctxEl, {
    type: chartType,
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: chartTextColor,
            font: { size: currentHpoNfe === 'all' && currentHpoAlgo === 'all' ? 8 : 9, weight: 'bold' },
            boxWidth: 8,
            boxHeight: 8,
            padding: 8
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          titleFont: { size: 10, weight: 'bold' },
          bodyFont: { size: 10 },
          padding: 8,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                if (!isLoss && hpoCurrentSpecificMetric === 'coverage') {
                  label += (context.parsed.y * 100).toFixed(2) + '%';
                } else if (!isLoss && hpoCurrentSpecificMetric === 'chamfer') {
                  label += context.parsed.y.toExponential(4);
                } else {
                  label += context.parsed.y.toFixed(5);
                }
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: isLast ? 'Selected Run' : 'Epoch',
            color: isLight ? '#475569' : '#64748b',
            font: { size: 9, weight: 'bold' }
          },
          grid: {
            color: chartGridColor
          },
          ticks: {
            color: isLight ? '#475569' : '#64748b',
            font: { size: 9 },
            maxRotation: isLast ? 65 : 0,
            minRotation: isLast ? 35 : 0,
            autoSkip: true,
            maxTicksLimit: isLast ? 12 : 10
          }
        },
        y: {
          type: scaleType,
          min: yMin,
          max: yMax,
          title: {
            display: true,
            text: yTitle,
            color: isLight ? '#475569' : '#64748b',
            font: { size: 9, weight: 'bold' }
          },
          grid: {
            color: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: isLight ? '#475569' : '#64748b',
            font: { size: 9 },
            callback: yTicksCallback
          }
        }
      }
    }
  });
}

// 刷新 HPO 控制面板与数据表渲染
function updateHpoDisplay() {
  const titleEl = document.getElementById('hpo-view-title');
  const statusEl = document.getElementById('hpo-selection-status');
  const imgEl = document.getElementById('hpo-dynamic-img');
  const pathEl = document.getElementById('hpo-img-path');
  const chartContainer = document.getElementById('hpo-chart-container');
  const pointsContainer = document.getElementById('hpo-points-container');
  const replayControls = document.getElementById('hpo-replay-controls');

  // 默认重置所有去噪重放状态
  if (hpoReplayIntervalId) {
    clearInterval(hpoReplayIntervalId);
    hpoReplayIntervalId = null;
  }
  hpoIsReplaying = false;
  hpoReplayFrameIndex = 0;
  const replayBtn = document.getElementById('hpo-replay-btn');
  if (replayBtn) replayBtn.innerHTML = `<i data-lucide="play" class="w-3 h-3"></i> 播放去噪动画`;
  const replayProgress = document.getElementById('hpo-replay-progress');
  if (replayProgress) replayProgress.classList.add('invisible');
  updateHpoReplayProgress(0, getHpoReplayFrameCount());
  if (statusEl) statusEl.innerText = formatHpoSelectionLabel();
  if (imgEl) imgEl.classList.add('hidden');

  if (currentHpoImageKind === 'generation') {
    if (chartContainer) chartContainer.classList.add('hidden');
    if (pointsContainer) pointsContainer.classList.remove('hidden');
    const replayFrameCount = getHpoReplayFrameCount();
    if (replayControls) {
      if (currentHpoProcess === 'all' && replayFrameCount > 1) {
        replayControls.classList.remove('hidden');
      } else {
        replayControls.classList.add('hidden');
      }
    }
    if (replayProgress && currentHpoProcess === 'all' && replayFrameCount > 1) {
      replayProgress.classList.remove('invisible');
      updateHpoReplayProgress(hpoReplayFrameIndex, replayFrameCount);
    }

    renderHpoPointsCanvas(hpoReplayFrameIndex);

    const processText = currentHpoProcess === 'all' ? '采样过程动画' : '最终分布';
    if (titleEl) titleEl.innerText = `${formatHpoSelectionLabel()} - ${processText}点云对比`;
    if (pathEl) pathEl.innerText = 'visual_replay_data.js/generated_points|trajectory.frames (Canvas Render)';
  } else {
    if (chartContainer) chartContainer.classList.remove('hidden');
    if (pointsContainer) pointsContainer.classList.add('hidden');

    renderHpoCharts();

    const kindNames = {
      loss: currentHpoProcess === 'last' ? '最终训练 Loss 对比' : '训练 Loss 收敛曲线',
      metrics: currentHpoProcess === 'last' ? '最终物理指标对比' : '物理评估指标收敛曲线'
    };
    const metricNames = {
      chamfer: 'CD 倒角距离',
      entropy: '分布均匀度',
      coverage: '流形覆盖率'
    };
    const suffix = currentHpoImageKind === 'metrics' ? ` - (${metricNames[hpoCurrentSpecificMetric]})` : '';
    if (titleEl) titleEl.innerText = `${formatHpoSelectionLabel()} - ${kindNames[currentHpoImageKind]}${suffix}`;
    if (pathEl) pathEl.innerText = 'visual_replay_data.js/loss_history|metrics_history (ChartJS Render)';
  }

  // 动态载入并生成当前筛选组合下的高保真榜单
  const infoPanel = document.getElementById('hpo-info-panel');
  if (infoPanel) {
    infoPanel.innerHTML = generateHpoSelectionSummary();
  }

  // 触发 KaTeX
  renderMath();
  lucide.createIcons();
}

// 11. 物理沙盒仿真器事件控制
function startSimulation() {
  if (simulator) simulator.startSimulation();
}

// 重置沙盒
function resetSimulation() {
  if (simulator) simulator.resetSimulation();
}

// 切换沙盒算法
function selectParadigm(key) {
  if (simulator) simulator.selectParadigm(key);
}

// 12. 学术 BibTeX modal 引用弹窗
function showCitation(nodeId) {
  const node = milestones.find(m => m.id === nodeId);
  if (!node) return;

  const titleEl = document.getElementById('modal-paper-title');
  const bibEl = document.getElementById('modal-bibtex');
  const modal = document.getElementById('citation-modal');
  const content = document.getElementById('modal-content');

  if (titleEl) titleEl.innerText = node.paper + ` (${node.venue})`;
  if (bibEl) bibEl.innerText = node.bibtex;
  
  if (modal && content) {
    modal.classList.remove('opacity-0', 'pointer-events-none');
    content.classList.remove('scale-95');
    content.classList.add('scale-100');
  }
}

// 关闭弹窗
function closeModal() {
  const modal = document.getElementById('citation-modal');
  const content = document.getElementById('modal-content');
  
  if (modal && content) {
    modal.classList.add('opacity-0', 'pointer-events-none');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
  }
}

// 拷贝 BibTeX
function copyBibtex() {
  const bibEl = document.getElementById('modal-bibtex');
  if (!bibEl) return;

  const text = bibEl.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('#citation-modal button[onclick="copyBibtex()"]');
    if (btn) {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `<i data-lucide="check" class="w-3 h-3 text-emerald-400"></i> 已复制`;
      lucide.createIcons();
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        lucide.createIcons();
      }, 2000);
    }
  }).catch(err => {
    console.error('无法拷贝文本: ', err);
  });
}

// 13. 学术检索、多里程碑模糊过滤
function filterTimeline() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  
  if (!query) {
    renderTimeline(milestones);
    return;
  }

  // 检索里程碑（支持同时在 milestones 摘要、deepDive 字段、公式、报告中多重穿透搜索）
  const filtered = milestones.filter(node => {
    const deepDive = paperDeepDives.find(p => p.milestoneId === node.id);
    const hasInDeepDive = deepDive ? (
      deepDive.title.toLowerCase().includes(query) ||
      deepDive.shortTitle.toLowerCase().includes(query) ||
      deepDive.authors.some(a => a.toLowerCase().includes(query)) ||
      (Array.isArray(deepDive.abstractZh) ? deepDive.abstractZh.join(' ') : deepDive.abstractZh).toLowerCase().includes(query) ||
      deepDive.contributionCards.some(c => c.title.toLowerCase().includes(query) || c.detail.toLowerCase().includes(query)) ||
      deepDive.formulas.some(f => f.name.toLowerCase().includes(query) || f.explanation.toLowerCase().includes(query)) ||
      deepDive.presentationNotesZh.some(n => n.toLowerCase().includes(query))
    ) : false;

    return node.title.toLowerCase().includes(query) ||
           node.paper.toLowerCase().includes(query) ||
           node.authors.toLowerCase().includes(query) ||
           node.venue.toLowerCase().includes(query) ||
           node.bg_breakthroughs.some(pt => pt.toLowerCase().includes(query)) ||
           node.my_experiments.insights.toLowerCase().includes(query) ||
           node.my_experiments.best_hyper.toLowerCase().includes(query) ||
           hasInDeepDive;
  });

  // 更新侧边编年史列表
  renderTimeline(filtered);

  // 智能交互：如果当前选中的里程碑不再过滤列表中，则自动聚焦并切换到第一个匹配项
  if (filtered.length > 0) {
    const stillExists = filtered.some(n => n.id === currentMilestoneId);
    if (!stillExists) {
      selectMilestone(filtered[0].id);
    }
  }
}

// 14. 全屏 Lightbox 轻量灯箱控制器
function openLightbox(src, caption) {
  const modal = document.getElementById('lightbox-modal');
  const content = document.getElementById('lightbox-content');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');

  if (img && cap && modal && content) {
    img.src = src;
    cap.innerText = caption;
    modal.classList.remove('opacity-0', 'pointer-events-none');
    content.classList.remove('scale-95');
    content.classList.add('scale-100');
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  const content = document.getElementById('lightbox-content');
  
  if (modal && content) {
    modal.classList.add('opacity-0', 'pointer-events-none');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
  }
}

// 15. 物理流形数据集 (Archimedean Spiral) 交互式展示画布
function initDatasetSpiralCanvas() {
  const canvas = document.getElementById('dataset-spiral-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const tooltip = document.getElementById('spiral-coords-tooltip');
  
  let animationFrameId;
  let mouseX = null;
  let mouseY = null;
  
  const numPoints = 400;
  const points = [];
  
  const generatePoints = (width, height) => {
    points.length = 0;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 与训练数据 generate_conch_spiral() 对齐：3 圈后继续到正 y 轴截止，并做水平镜像 x = -x。
    const maxTheta = 2 * Math.PI * 3 + 0.5 * Math.PI;
    const displayRadius = Math.min(width, height) * 0.42;
    const a = displayRadius / maxTheta; // Archimedean 缩放比例: r = a * theta
    
    for (let i = 0; i < numPoints; i++) {
      const theta = (i / (numPoints - 1)) * maxTheta;
      const r = a * theta;
      const physicalX = -Math.cos(theta) * r;
      const physicalY = Math.sin(theta) * r;
      const x = centerX + physicalX;
      // Canvas y 轴向下，显示时取反以保持数学坐标中正 y 向上。
      const y = centerY - physicalY;
      points.push({ x, y, theta, r, physicalX, physicalY, displayRadius });
    }
  };

  const drawSpiral = () => {
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    
    // 清空画布并绘制雷达网格背景
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 绘制坐标轴
    const isLight = document.documentElement.classList.contains('light');
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    // 绘制极坐标同心圆虚线
    ctx.strokeStyle = isLight ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)';
    ctx.setLineDash([3, 3]);
    for (let r = 15; r <= 60; r += 15) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]); // 恢复实线
    
    generatePoints(width, height);
    
    // 1. 绘制理想一维流形连续线条（Manifold Line）
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }
    ctx.stroke();
    
    // 2. 绘制 400 个点云粒子
    const time = Date.now() * 0.0015;
    points.forEach((p, idx) => {
      let dist = Infinity;
      if (mouseX !== null && mouseY !== null) {
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        dist = Math.sqrt(dx * dx + dy * dy);
      }
      
      const isHovered = dist < 12;
      const pulse = Math.sin(time * 2.5 + idx * 0.08) * 0.35 + 1.0;
      
      ctx.beginPath();
      if (isHovered) {
        // 悬停高亮：青色霓虹发光点
        ctx.fillStyle = '#22d3ee'; // cyan-400
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 6;
        ctx.arc(p.x, p.y, 2.5 * pulse, 0, Math.PI * 2);
      } else {
        // 普通点：靛蓝色微发光点
        ctx.fillStyle = `rgba(129, 140, 248, ${0.45 + pulse * 0.25})`; // indigo-400
        ctx.shadowColor = '#818cf8';
        ctx.shadowBlur = idx % 20 === 0 ? 3 : 0; // 部分粒子点缀微光
        ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
      }
      ctx.fill();
    });
    ctx.shadowBlur = 0; // 重置发光阴影
  };
  
  const handleMouseMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    let closestPt = null;
    let minDist = Infinity;
    
    points.forEach(p => {
      const dx = p.x - mouseX;
      const dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closestPt = p;
      }
    });
    
    // 悬停靠近时，浮现交互式 Tooltip，提供粒子物理状态和原空间数学坐标
    if (closestPt && minDist < 15) {
      tooltip.style.left = `${mouseX + 12}px`;
      tooltip.style.top = `${mouseY + 8}px`;
      tooltip.classList.remove('hidden');
      
      // 物理坐标映射：设中心为 (0,0)，最大半径归一化到约 2.0。
      const coordScale = closestPt.displayRadius / 2;
      const originalX = (closestPt.physicalX / coordScale).toFixed(3);
      const originalY = (closestPt.physicalY / coordScale).toFixed(3);
      
      tooltip.innerHTML = `
        <div class="font-bold text-cyan-300 text-[11px] mb-0.5 border-b border-white/10 pb-0.5">粒子 Particle #${points.indexOf(closestPt)}</div>
        <div class="flex justify-between gap-4"><span>极角 θ:</span><span class="text-white font-semibold">${closestPt.theta.toFixed(3)} rad</span></div>
        <div class="flex justify-between gap-4"><span>极径 r:</span><span class="text-white font-semibold">${closestPt.r.toFixed(1)} px</span></div>
        <div class="flex justify-between gap-4 mt-0.5 pt-0.5 border-t border-white/5"><span>物理坐标 (x, y):</span><span class="text-emerald-400 font-bold">(${originalX}, ${originalY})</span></div>
      `;
    } else {
      tooltip.classList.add('hidden');
    }
  };
  
  const handleMouseLeave = () => {
    mouseX = null;
    mouseY = null;
    tooltip.classList.add('hidden');
  };
  
  // 监听画布尺寸变化以自适应高DPI
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    drawSpiral();
  };
  
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('resize', resize);
  
  resize();
  
  const loop = () => {
    drawSpiral();
    animationFrameId = requestAnimationFrame(loop);
  };
  loop();
}

// 16. 主题切换与同步控制
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  
  if (isDark) {
    html.classList.remove('dark');
    html.classList.add('light');
    localStorage.setItem('theme', 'light');
  } else {
    html.classList.remove('light');
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
  
  // 更新按钮图标
  updateThemeIcons();
  
  // 1. 重绘物理仿真画布，更新它的网格色
  if (simulator) {
    simulator.draw();
  }
  
  // 2. 重新初始化物理流形数据集海螺线展示画布
  initDatasetSpiralCanvas();
  
  // 3. 刷新 HPO 测评 ChartJS 图表
  if (hpoChartInstance) {
    renderHpoCharts();
  }
  
  // 4. 重绘 HPO 点云重放画布
  renderHpoPointsCanvas();
}

function updateThemeIcons() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;
  const isDark = document.documentElement.classList.contains('dark');
  
  if (isDark) {
    toggleBtn.innerHTML = '<i data-lucide="sun" class="w-5 h-5"></i>';
  } else {
    toggleBtn.innerHTML = '<i data-lucide="moon" class="w-5 h-5"></i>';
  }
  lucide.createIcons();
}
