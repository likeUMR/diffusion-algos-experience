/**
 * 二维阿基米德海螺线物理去噪粒子仿真器 (Archimedean Spiral Physics Simulator)
 */
class PhysicsSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.particles = [];
    this.numParticles = 400;
    this.selectedParadigm = 'mean-flows';
    this.simAnimationId = null;
    this.simStartTime = null;
    this.simDuration = 2000;
    this.isSimulating = false;
    this.stepCount = 0;
    this.totalSteps = 1;
    this.frames = 0;
    this.lastFpsTime = 0;

    // 阿基米德海螺线目标坐标点
    this.targets = [];
    this.generateSpiralTargets();

    // 针对每个算法的去噪物理属性特征描述
    this.paradigmInfo = {
      'gan': {
        trajectory: '瞬间跨越 (一步突变，容易漏掉高频螺旋中心)',
        nfe: '1-NFE (单前向，无积分迭代)',
        speed: '1 步积分',
        painpoint: '生成极其锐利清晰，但因缺乏微分积分逼近容易漏掉高曲率螺旋中心。',
        duration: 1200,
        steps: 1
      },
      'vae': {
        trajectory: '隐空间极度收缩 ➔ 整体解码释放 (边缘模糊严重)',
        nfe: '1-NFE (单前向，隐空间编解码)',
        speed: '1 步重建',
        painpoint: '分布完备，但生成的一维螺旋线表现为肥胖的粗麻绳，严重缺乏高频边缘。',
        duration: 1600,
        steps: 1
      },
      'diffusion': {
        trajectory: '50步 嘈杂、曲折、受方差注入的随机布朗运动路线',
        nfe: '50-NFE (马尔可夫链离散时间退火)',
        speed: '50 步反向积分',
        painpoint: '高步数下极精美（CD=0.0071）；但由于方差注入，轨迹严重弯曲杂乱，耗时极慢。',
        duration: 3200,
        steps: 50
      },
      'flow-matching': {
        trajectory: '15步 基于最优传输几何拉直的直线切线速度向量轨迹',
        nfe: '15-NFE (常微分直线流少步积分)',
        speed: '15 步确定性积分',
        painpoint: '最优传输拉直，去噪时无随机方差偏离。在 NFE=15 下既快又精准。',
        duration: 2200,
        steps: 15
      },
      'consistency': {
        trajectory: '单步直接将任何噪声点强制自一致投影至零时刻起点',
        nfe: '1-NFE (一致性边界映射)',
        speed: '1 步直接投影',
        painpoint: '专门为单步量身定做（CD=0.0898）！但多步级联反而会产生严重投影漂移。',
        duration: 800,
        steps: 1
      },
      'mean-flows': {
        trajectory: '单步顺着预测的平均速度直接滑过，完美兼顾一步与多步积分',
        nfe: '1-NFE (何恺明均值流微分大一统)',
        speed: '1 步均值切入',
        painpoint: '何恺明 2025/2026 iMF 数学恒等式，单步逼近 0.107，多步积分精度不退反进！',
        duration: 800,
        steps: 1
      }
    };
  }

  // 1. 生成标准的 2D一维窄流形 海螺线作为逆向目标
  generateSpiralTargets() {
    this.targets = [];
    const maxTheta = 2 * Math.PI * 3 + 0.5 * Math.PI;
    const maxRadius = 180;
    const radiusScale = maxRadius / maxTheta;
    for (let i = 0; i < this.numParticles; i++) {
      // 与训练数据一致：3 圈后在正 y 轴截止，并做水平镜像 x = -x。
      const theta = (i / (this.numParticles - 1)) * maxTheta;
      const r = radiusScale * theta; // 逐渐线性展开的半径
      const x = 210 - Math.cos(theta) * r;
      const y = 210 - Math.sin(theta) * r;
      this.targets.push({ x, y });
    }
  }

  // 2. 初始化粒子为高维正态分布的高斯白噪声
  initializeParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      // 高斯分布，使用 Box-Muller 变换
      const angle = Math.random() * Math.PI * 2;
      const u1 = Math.random() || 0.0001;
      const u2 = Math.random() || 0.0001;
      const norm = Math.sqrt(-2.0 * Math.log(u1)) * 50; 
      
      const x = 210 + Math.cos(angle) * norm;
      const y = 210 + Math.sin(angle) * norm;

      this.particles.push({
        x: x,
        y: y,
        startX: x,
        startY: y,
        targetX: this.targets[i].x,
        targetY: this.targets[i].y,
        color: 'rgba(148, 163, 184, 0.45)' // 初始 slate 灰度噪声
      });
    }
    this.draw();
  }

  // 3. 绘制画布帧
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制一个带有未来科技感、同心圆雷达波纹的网格背景
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    this.ctx.lineWidth = 1;
    for (let r = 40; r < 210; r += 40) {
      this.ctx.beginPath();
      this.ctx.arc(210, 210, r, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // 渲染每一个粒子
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 2.0, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  // 4. 选择算法
  selectParadigm(key) {
    if (this.isSimulating) {
      this.resetSimulation();
    }
    this.selectedParadigm = key;
    
    // 更新控制面板状态展示
    const info = this.paradigmInfo[key];
    document.getElementById('info-trajectory').innerText = info.trajectory;
    document.getElementById('info-nfe').innerText = info.nfe;
    document.getElementById('info-speed').innerText = info.speed;
    document.getElementById('info-painpoint').innerText = info.painpoint;
    
    document.getElementById('sim-step').innerText = '0';
    document.getElementById('sim-total-steps').innerText = info.steps;
    this.totalSteps = info.steps;

    this.initializeParticles();
  }

  // 5. 运行去噪生成主循环
  animate(timestamp) {
    if (!this.simStartTime) this.simStartTime = timestamp;
    const elapsed = timestamp - this.simStartTime;
    const info = this.paradigmInfo[this.selectedParadigm];
    this.simDuration = info.duration;

    // 测算实时的 FPS 帧率
    this.frames++;
    if (timestamp > this.lastFpsTime + 1000) {
      document.getElementById('sim-fps').innerText = Math.round((this.frames * 1000) / (timestamp - this.lastFpsTime));
      this.frames = 0;
      this.lastFpsTime = timestamp;
    }

    let progress = Math.min(elapsed / this.simDuration, 1.0);

    if (this.selectedParadigm === 'gan') {
      // GAN: 先持续抖动高斯噪声 (35%)，随后一步坍缩瞬间出图 (1-NFE)
      this.stepCount = progress >= 0.35 ? 1 : 0;
      document.getElementById('sim-step').innerText = this.stepCount;

      this.particles.forEach((p, idx) => {
        if (progress < 0.35) {
          p.x = p.startX + (Math.random() - 0.5) * 6;
          p.y = p.startY + (Math.random() - 0.5) * 6;
          p.color = 'rgba(244, 63, 94, 0.45)'; // Rose color
        } else {
          const factor = Math.max(0, 1.0 - (progress - 0.35) / 0.65);
          p.x = p.targetX + (Math.random() - 0.5) * 10 * factor;
          p.y = p.targetY + (Math.random() - 0.5) * 10 * factor;
          p.color = `rgba(244, 63, 94, ${0.75 + (1 - factor) * 0.25})`;
        }
      });

    } else if (this.selectedParadigm === 'vae') {
      // VAE: 隐空间瓶颈压缩 (35%)，随后进行伴随模糊的重构释放 (65%)
      this.stepCount = progress >= 0.85 ? 1 : 0;
      document.getElementById('sim-step').innerText = this.stepCount;

      this.particles.forEach((p, idx) => {
        if (progress < 0.35) {
          const t = progress / 0.35;
          p.x = p.startX * (1 - t) + 210 * t;
          p.y = p.startY * (1 - t) + 210 * t;
          p.color = `rgba(16, 185, 129, ${0.4 + t * 0.4})`; // green
        } else if (progress < 0.85) {
          const t = (progress - 0.35) / 0.5;
          const blurAngle = Math.random() * Math.PI * 2;
          const blurRadius = (Math.random() * 8.5) * (1 - t * 0.3);
          const destX = p.targetX + Math.cos(blurAngle) * blurRadius;
          const destY = p.targetY + Math.sin(blurAngle) * blurRadius;

          p.x = 210 * (1 - t) + destX * t;
          p.y = 210 * (1 - t) + destY * t;
          p.color = 'rgba(16, 185, 129, 0.7)';
        } else {
          const blurAngle = idx * 1.5;
          const blurRadius = 4.2; // 永久无法消失的变分一维流形厚度
          p.x = p.targetX + Math.cos(blurAngle) * blurRadius;
          p.y = p.targetY + Math.sin(blurAngle) * blurRadius;
          p.color = 'rgba(16, 185, 129, 0.85)';
        }
      });

    } else if (this.selectedParadigm === 'diffusion') {
      // DDPM: 50步。多步离散求和，每步注入独立的高斯随机布朗运动方差噪声
      const currentDiscreteStep = Math.floor(progress * info.steps);
      this.stepCount = currentDiscreteStep;
      document.getElementById('sim-step').innerText = this.stepCount;

      const ratio = currentDiscreteStep / info.steps;

      this.particles.forEach((p, idx) => {
        const noiseAmp = Math.max(0, 1.0 - ratio) * 22;
        const brownianX = (Math.sin(idx + elapsed * 0.04) + Math.cos(idx * 1.5 + elapsed * 0.02)) * noiseAmp;
        const brownianY = (Math.cos(idx + elapsed * 0.03) + Math.sin(idx * 2.5 + elapsed * 0.025)) * noiseAmp;

        const t = Math.pow(ratio, 1.25); // 指数微减速轨迹
        p.x = p.startX * (1 - t) + p.targetX * t + brownianX;
        p.y = p.startY * (1 - t) + p.targetY * t + brownianY;
        p.color = `rgba(245, 158, 11, ${0.4 + t * 0.6})`; // amber
      });

    } else if (this.selectedParadigm === 'flow-matching') {
      // Flow Matching: 15步。直线常微分积分。完全无随机方差注入，轨迹呈直线向量前行
      const currentDiscreteStep = Math.floor(progress * info.steps);
      this.stepCount = currentDiscreteStep;
      document.getElementById('sim-step').innerText = this.stepCount;

      const ratio = currentDiscreteStep / info.steps;
      
      this.particles.forEach(p => {
        p.x = p.startX * (1 - ratio) + p.targetX * ratio;
        p.y = p.startY * (1 - ratio) + p.targetY * ratio;
        p.color = `rgba(6, 182, 212, ${0.45 + ratio * 0.55})`; // cyan
      });

    } else if (this.selectedParadigm === 'consistency') {
      // Consistency: 瞬间强制自一致投影 (35%进度抖动，之后直接1步拉直)
      this.stepCount = progress >= 0.35 ? 1 : 0;
      document.getElementById('sim-step').innerText = this.stepCount;

      this.particles.forEach(p => {
        if (progress < 0.35) {
          p.x = p.startX + (Math.random() - 0.5) * 5;
          p.y = p.startY + (Math.random() - 0.5) * 5;
          p.color = 'rgba(129, 140, 248, 0.45)';
        } else {
          const factor = (progress - 0.35) / 0.65;
          p.x = p.startX * (1 - factor) + p.targetX * factor;
          p.y = p.startY * (1 - factor) + p.targetY * factor;
          p.color = `rgba(129, 140, 248, ${0.5 + factor * 0.5})`;
        }
      });

    } else if (this.selectedParadigm === 'mean-flows') {
      // Mean Flows: 单步顺着平均速度滑行。平滑无随机干扰
      this.stepCount = progress >= 1.0 ? 1 : 0;
      document.getElementById('sim-step').innerText = this.stepCount;

      this.particles.forEach(p => {
        p.x = p.startX * (1 - progress) + p.targetX * progress;
        p.y = p.startY * (1 - progress) + p.targetY * progress;
        p.color = `rgba(99, 102, 241, ${0.4 + progress * 0.6})`; // beautiful indigo
      });
    }

    this.draw();

    if (progress < 1.0) {
      this.simAnimationId = requestAnimationFrame(timestamp => this.animate(timestamp));
    } else {
      this.isSimulating = false;
      // 最终将点云精准锁死在海螺线上
      this.particles.forEach(p => {
        if (this.selectedParadigm !== 'vae') {
          p.x = p.targetX;
          p.y = p.targetY;
        }
      });
      this.draw();
    }
  }

  // 6. 开启去噪物理模拟
  startSimulation() {
    if (this.isSimulating) {
      this.resetSimulation();
    }
    this.isSimulating = true;
    this.simStartTime = null;
    this.lastFpsTime = performance.now();
    this.frames = 0;
    this.simAnimationId = requestAnimationFrame(timestamp => this.animate(timestamp));
  }

  // 7. 重置模拟状态
  resetSimulation() {
    if (this.simAnimationId) {
      cancelAnimationFrame(this.simAnimationId);
    }
    this.isSimulating = false;
    this.stepCount = 0;
    document.getElementById('sim-step').innerText = '0';
    this.initializeParticles();
  }
}
