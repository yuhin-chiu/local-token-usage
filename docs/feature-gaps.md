# Dashboard 功能差距明细（参考）

新页面（`/dashboard`）相对老页面（`/`）缺失的功能，作为各仪表盘任务的**详细规格参考**。
分析完成后可删除老页面代码（`src/app/page.tsx` + `src/app/_components/`）。

> **任务跟踪已迁移到 [`jobs/`](jobs/)** —— 本文件只保留差距明细供查阅，不再做状态管理。
> 各小节标题的 `[任务ID]` 对应 `jobs/backlog.md` 中的任务。

---

## 快速汇总（差距明细 → 所属任务）

| # | 功能点 | 优先级建议 | 所属任务 |
|---|--------|-----------|---------|
| 1 | Tokens / Cost 切换（影响图表和卡片） | 高 | `metric-toggle` |
| 2 | DailyChart：XAxis / YAxis / 网格线 / Tooltip 悬停 | 高 | `daily-chart` |
| 3 | DailyChart：cost 视图切换 | 高 | `daily-chart` |
| 4 | SourceSplit：横向比例条 + 百分比显示 | 高 | `source-split` |
| 5 | StatCard：Cache tokens 展示 | 中 | `stat-card` |
| 6 | StatCard：avg cost/session | 中 | `stat-card` |
| 7 | StatCard：内嵌迷你 TrendChart 面积图 | 中 | `stat-card` |
| 8 | 两张 ModelTable（历史 + 今日并列） | 中 | `model-table` |
| 9 | ModelTable：Source 文字 badge 列 | 中 | `model-table` |
| 10 | ModelTable：原始完整 model 名称 | 中 | `model-table` |
| 11 | Rate Limit：无数据占位状态 | 中 | `rate-limit` |
| 12 | Rate Limit：planType badge + 图标 | 低 | `rate-limit` |
| 13 | API warnings 提示 | 低 | `polish` |
| 14 | Header 实时脉动点（live-dot） | 低 | `polish` |
| 15 | Refresh 按钮旋转动画 | 低 | `polish` |
| 16 | 自动刷新间隔从 30s 改回 15s | 低 | `polish` |
| 17 | Footer 路径高亮 | 低 | `polish` |
| 18 | grid-noise 噪点纹理背景 | 低 | `polish` |

---

## 详细说明

### [metric-toggle] 一、Tokens / Cost 切换

**老页面**：Header 有 Tokens / Cost 分段选择器，选择后影响 DailyChart 和 StatCard 内嵌迷你图的展示维度。

**新页面**：缺失。图表和卡片固定只展示 tokens，用户无法切换到 cost 视图。

---

### [daily-chart] 二、DailyChart / TrendChart 图表功能

**老页面**：使用 recharts `BarChart`（高 300px），具备：
- XAxis 日期标签（`preserveStartEnd` 模式，minTickGap=32）
- YAxis 带格式化刻度（token/cost 单位）
- CartesianGrid 横向网格线
- 悬停 Tooltip（显示 Claude、Codex、Total 三行详细数据，styled card 样式）
- 线性渐变填充（橙色/紫色，从亮到深）
- 支持 tokens / cost metric 切换

**新页面**：自制纯 div 堆叠柱状图（高 130px），缺少：
- XAxis / YAxis 轴标签
- 网格线
- Tooltip 悬停交互
- cost 视图切换（固定显示 tokens）
- 仅在柱数 ≤14 时在柱顶显示 9px 数值标签

---

### [source-split] 三、SourceSplit 数据源分布

**老页面**：独立 `SourceSplit` 组件，固定展示 Today 数据，包含：
- 横向分段比例条（Claude 橙 + Codex 紫）
- 每个来源的百分比（`xx%`）
- 每个来源的 tokens、cost、sessions 三项指标

**新页面**：改为两张并排卡片（Claude Code / Codex CLI），缺少：
- 横向比例条可视化
- 百分比显示
- 非 today 范围时 sessions 显示为 0（逻辑不完整）

---

### [stat-card] 四、StatCard 统计卡片

**老页面**：
- 卡片 1 副文字：`In {输入} · Out {输出} · Cache {缓存}`（含 cache token 细分）
- 卡片 2 副文字：`{session数} sessions · avg {均费}/session`（含均费）
- 卡片 3/4：内嵌迷你 recharts AreaChart，可切换 tokens/cost 视图
- 右上角有图标（Sparkles / Coins / History / FlaskConical）

**新页面**：
- 卡片 1 Today 视图缺少 Cache tokens 字段
- 卡片 2 Today 视图缺少 avg cost/session
- 无内嵌迷你面积图
- 无卡片图标

---

### [model-table] 五、ModelTable 模型用量表

**老页面**：同时展示两张独立表格：
- 表 1：历史期间 Top Models（`data.models`，跨日期汇总，前 10 条）
- 表 2：Today 单日 Top Models（`data.todayModels`，前 10 条）
- 每行有 Source 彩色 badge 列（Claude / Codex 文字标注）
- Share 列：独立的渐变进度条列
- 显示完整原始 model 名称（`font-mono`）

**新页面**：
- 只有一张表，随范围动态切换数据源（前 12 条）
- 无 Source 文字 badge，仅靠进度条颜色区分
- 无独立 Share 列（进度条内嵌到名称下方）
- model 名称经过截断处理（去前缀、去日期后缀、capitalize）

---

### [rate-limit] 六、Rate Limit 限流展示

**老页面**：
- 无数据时仍显示占位卡片："No rate-limit signal yet."
- 进度条三色语义：`<50%` 绿 / `50-80%` 琥珀 / `>80%` 红
- 标题带 Gauge 图标，重置时间带 Timer 图标
- planType 显示专属 violet badge

**新页面**：
- `data.rateLimit` 为空时整个区域不渲染（用户无法感知该功能存在）
- 颜色分界点略有差异（`>80%` 红 / `>60%` 黄）
- 无图标，无 badge

---

### [polish] 七、其他细节

| 功能 | 老页面 | 新页面 |
|------|--------|--------|
| API warnings 提示 | 有（琥珀色文字，显示条数） | 无 |
| Refresh 图标动画 | `animate-spin` 旋转 | 显示 `…` 文字 |
| 自动刷新间隔 | 15s | 30s |
| Header 实时脉动点 | 有（green live-dot） | 无 |
| Footer 路径高亮 | `font-mono` 高亮路径 | 纯文字 |
| 背景噪点纹理 | 有（grid-noise） | 无 |
| 样式体系 | Tailwind class + design token | 全部内联 style |

---

## 备注

- 新页面**新增**的功能（老页面没有）：Today / Yesterday 单日视图、Daily Breakdown 列表（DailyRow）
- 删除老页面前建议先把"高优先级"任务补齐
- 老页面文件：`src/app/page.tsx` + `src/app/_components/`（7 个组件文件）
