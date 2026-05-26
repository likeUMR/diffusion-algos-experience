# Avg-DDIM 高维图片实验方案（HNSW 适配版）

## 1. 实验目标

当前 Avg-DDIM 已经在 2D 海螺线实验中完成初步验证。下一步希望脱离 2D toy 场景，在更真实的高维图片数据上，只和原始 DDIM 做对比，观察 Avg-DDIM 的局部期望去噪目标是否仍然有效。

本方案只设计实验，不运行实验。整体目标是控制在本机 1 天以内可完成。

本次高维实验只允许一个适配改动：

> 不再使用原 2D 实验里的高斯拒绝筛选候选点；对每个加噪后的 `x_t`，把它作为查询点，用预先构建的 HNSW（Hierarchical Navigable Small World）索引，在原始训练数据 `x_0` 数据库中查询最近的 `k-1` 个点，再和当前真实 `x_0` 一起组成 `k` 个候选点。

除此之外，不引入任何额外适配。

## 2. 本机条件与实验规模

本机 `.venv` 环境已确认：

- Python 3.12.7
- PyTorch 2.6.0+cu124
- CUDA 可用
- GPU：NVIDIA GeForce RTX 4070，显存约 12GB
- 当前缺少 `torchvision`

1 天以内更稳妥的真实图片实验选择：

- 数据集：CIFAR-10
- 图像大小：32x32 RGB
- 训练数据：优先使用 20,000 张子集；如果训练速度足够，再使用 50,000 张全量
- 模型：小型 U-Net
- 对比算法：DDIM vs Avg-DDIM-HNSW

如需安装依赖，使用清华源：

```powershell
.\.venv\Scripts\python.exe -m pip install -i https://pypi.tuna.tsinghua.edu.cn/simple torchvision pillow tqdm hnswlib clean-fid
```

## 3. 原始 DDIM 方法

DDIM 与 DDPM 使用相同的噪声预测训练目标。给定真实图片 `x_0`、随机时间步 `t` 和高斯噪声 `epsilon`：

```text
x_t = sqrt(alpha_bar_t) * x_0 + sqrt(1 - alpha_bar_t) * epsilon
```

DDIM 训练模型预测噪声：

```text
L_DDIM = E[ || epsilon_theta(x_t, t) - epsilon ||^2 ]
```

采样阶段使用 DDIM 的确定性反向更新。为了公平，本实验固定：

```text
eta = 0.0
```

DDIM baseline 不做任何 Avg 目标，也不使用 HNSW。

## 4. Avg-DDIM 原始思想

Avg-DDIM 不改变 DDIM 的采样公式，只改变训练时的噪声监督目标。

对于一个训练样本，先按 DDIM/DDPM 标准方式得到 `x_t`。原始 DDIM 只使用当前 `x_0` 对应的噪声作为监督。Avg-DDIM 则构造 `k` 个可能的原始数据候选：

```text
N_k(x_t) = { x_0^(1), x_0^(2), ..., x_0^(k) }
```

其中 `x_0^(1)` 是当前样本本身，其余 `k-1` 个来自数据集中的候选点。对每个候选点，计算它生成当前 `x_t` 所需的噪声方向：

```text
epsilon_i = (x_t - sqrt(alpha_bar_t) * x_0^(i)) / sqrt(1 - alpha_bar_t)
```

根据前向扩散条件概率：

```text
q(x_t | x_0^(i)) ∝ exp(-0.5 * ||epsilon_i||^2)
```

得到候选权重：

```text
w_i = softmax_i(log q(x_t | x_0^(i)))
```

最终训练目标为加权平均噪声：

```text
epsilon_avg = sum_i w_i * epsilon_i
L_Avg-DDIM = E[ || epsilon_theta(x_t, t) - epsilon_avg ||^2 ]
```

直观上，Avg-DDIM 不再强迫模型只拟合单个 `x_0` 给出的噪声方向，而是拟合同一个 `x_t` 在局部数据邻域下的后验期望噪声方向。这样可以降低单配对监督的方差，使去噪向量场更平滑。

## 5. 高维图片的唯一适配：HNSW 候选查询

2D 实验中，额外候选点可以通过高斯拒绝采样围绕当前 `x_0` 取得。但在图片空间中，直接做这种高斯筛选不再作为本实验设计的一部分。

本实验唯一适配方式如下：

1. 预先把所有训练图片 `x_0` 展平成向量，并构建 HNSW 索引。
2. 每次训练时，对 batch 中每个样本照常采样 `t` 和 `epsilon`，得到加噪图片 `x_t`。
3. 将 `x_t` 展平成与索引相同维度的查询向量。
4. 用 HNSW 在原始训练图片库中查询最近的 `k-1` 个原始图片。
5. 将当前真实 `x_0` 与 HNSW 返回的 `k-1` 个近邻合并为总数 `k` 的候选集。
6. 对这 `k` 个候选逐一计算 `epsilon_i`、`log q(x_t | x_0^(i))`、`w_i` 和 `epsilon_avg`。
7. 使用 `epsilon_avg` 作为 Avg-DDIM 的训练监督。
8. 采样阶段仍完全使用 DDIM 采样公式。

也就是说，高维版本只替换候选来源：

```text
2D Avg-DDIM:
当前 x_0 + 高斯拒绝采样得到的 k-1 个候选

高维 Avg-DDIM-HNSW:
当前 x_0 + HNSW(x_t -> 原始数据集最近邻) 得到的 k-1 个候选
```

HNSW 查询对象必须是“原始数据中的图片”，不是加噪数据缓存。查询点是当前训练步实时产生的 `x_t`。

## 6. HNSW 索引构建细节

索引构建只做一次，在训练开始前完成。

图片预处理必须与训练输入一致：

```text
PIL image -> tensor -> normalize to [-1, 1] -> flatten
```

HNSW 推荐参数：

```text
space = "l2"
dim = 3 * 32 * 32
M = 16
ef_construction = 200
ef_search = 64
```

训练 20,000 张 CIFAR-10 子集时，索引规模很小，构建和查询都应在 1 天实验预算内。若使用 50,000 张全量，HNSW 仍然可行。

注意：HNSW 查询返回的近邻中可能包含当前样本本身。为保持定义明确，候选集固定为：

```text
候选 1: 当前真实 x_0
候选 2..k: HNSW 返回的最近 k-1 个原始数据点
```

如果 HNSW 返回当前样本本身，也不做额外策略扩展，直接按 HNSW 返回结果参与候选集合构造。

## 7. 主实验配置

### 7.1 数据

主实验使用 CIFAR-10：

- 输入：32x32 RGB
- 归一化：`[-1, 1]`
- 训练子集：20,000 张起步
- 测试/评估真实集：CIFAR-10 原始图片

如果 20,000 张训练能在时间内顺利完成，再扩展到 50,000 张全量。

### 7.2 模型

使用小型 U-Net。DDIM 与 Avg-DDIM-HNSW 必须使用完全相同模型。

建议规模：

- base channels：64
- channel multipliers：`[1, 2, 2, 4]`
- residual blocks per level：2
- time embedding：正弦时间嵌入 + MLP
- AMP 混合精度：开启

如果显存不足，只调整 batch size，不改变 DDIM 与 Avg-DDIM 的模型结构差异。

### 7.3 扩散参数

固定：

```text
T = 1000
beta schedule = linear
eta = 0.0
```

采样 NFE：

```text
NFE = 10, 20, 50
```

### 7.4 Avg-DDIM-HNSW 参数

沿用 Avg-DDIM 的候选数定义：

```text
k = 30
```

即每个训练样本构造：

```text
1 个当前真实 x_0 + 29 个 HNSW 近邻候选
```

如果 1 天内计算压力过大，可以先记录为一次失败/超预算现象，而不是加入新的算法设计。

## 8. 对照组

只做两组：

1. DDIM
   - 标准噪声预测目标。
   - 不使用 HNSW。
   - 使用 DDIM 采样。

2. Avg-DDIM-HNSW
   - 使用 HNSW 为每个 `x_t` 查询原始数据近邻。
   - 使用 `k` 个候选噪声方向的前向概率加权平均作为训练目标。
   - 使用 DDIM 采样。

两组必须保持一致：

- 数据集与训练子集
- U-Net 结构
- batch size
- optimizer
- 学习率
- 训练步数
- beta schedule
- 采样 NFE
- 随机种子

## 9. 1 天内执行排期

| 阶段 | 时间预算 | 内容 |
| --- | ---: | --- |
| 环境补依赖 | 0.5 小时 | 安装 `torchvision`、`hnswlib`、`clean-fid`，下载 CIFAR-10 |
| 代码冒烟 | 1 小时 | 512 张图训练 200 step，确认 DDIM 与 Avg-DDIM-HNSW loss 可计算 |
| HNSW 索引测试 | 0.5 小时 | 构建 20k 图片索引，检查 `x_t -> k-1` 查询速度 |
| DDIM 主训练 | 4-6 小时 | CIFAR-10 20k 子集固定步数训练 |
| Avg-DDIM-HNSW 主训练 | 6-8 小时 | 同样训练预算，额外记录 HNSW 查询耗时 |
| 采样评估 | 1-2 小时 | 每组生成 5k 图片，评估 NFE=10/20/50 |
| 报告整理 | 1 小时 | 汇总指标、样本网格、训练耗时 |

总预算约 14-19 小时。若当天训练时间不足，优先保证：

```text
DDIM NFE=20
Avg-DDIM-HNSW NFE=20
```

NFE=10 和 NFE=50 可以作为补充结果。

## 10. 指标与记录

主指标：

- FID-5k
- KID-5k
- NFE=10/20/50 下的样本网格

训练记录：

- training loss 曲线
- 每 step 平均耗时
- HNSW 查询平均耗时
- GPU 显存峰值
- 总训练时间

最终报告中至少包含：

```text
algorithm,dataset,train_size,k,nfe,fid5k,kid5k,train_hours,sec_per_step,hnsw_query_ms,peak_vram_gb
```

## 11. 判定标准

Avg-DDIM-HNSW 相对 DDIM 有效的标准：

- 在相同 NFE 下，FID 或 KID 优于 DDIM。
- 样本网格没有明显更差的模糊、崩坏或重复纹理。
- 训练过程稳定，不出现 loss 发散。
- 训练耗时虽增加，但仍能在 1 天内完成。

如果 Avg-DDIM-HNSW 训练更慢但指标没有改善，则说明这种“用加噪点查询原始数据近邻”的高维适配暂时没有带来收益。

## 12. 输出目录建议

```text
results_image/
  cifar10_ddim_seed42/
  cifar10_avg_ddim_hnsw_k30_seed42/
  reports/
    ddim_vs_avg_ddim_hnsw_cifar10.md
    metrics.csv
    samples_nfe10.png
    samples_nfe20.png
    samples_nfe50.png
```

## 13. 最小可执行版本

如果只保留最小实验：

- CIFAR-10 20k 子集
- DDIM vs Avg-DDIM-HNSW
- `k=30`
- HNSW 查询：每个 `x_t` 查询原始数据最近 `k-1` 个点
- DDIM 采样：`eta=0.0`
- 只评估 NFE=20
- 指标：FID-5k、KID-5k、样本网格、训练耗时

这就是本次从 2D toy 走向高维图片的唯一实验方案。核心变化只有一个：候选点来源从 2D 的高斯拒绝筛选，替换为高维图片上的 HNSW 最近邻查询。
