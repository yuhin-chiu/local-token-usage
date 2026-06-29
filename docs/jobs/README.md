# Jobs — 任务跟踪

ai-usage 多天任务总索引。**进入项目先读本文件。**
管理方式见全局记忆 `feedback-task-planning.md`。

> 状态：🔲 未开始 ｜ 🚧 进行中 ｜ ✅ 完成 ｜ ⏸️ 阻塞/待决策
> 用任务 ID 点名（如"做 `daily-chart`"）。进行中任务详档在 `active/`；待办在 `backlog.md`；完成的归档到 `archive/`（默认不读）。

## 🚧 进行中（active/）

| 任务 ID | 任务名 | 优先级 | 一句状态 |
|---|---|---|---|
| [`multi-source`](active/multi-source.md) | 多工具动态支持 | **P0 最高** | 阶段一 5/6：页面已动态渲染（按 sources+capability），仅剩 ecosystem 端口读 config |

> WIP 限制 ≤2。

## 🔲 待办（backlog.md）

| 任务 ID | 任务名 | 优先级 |
|---|---|---|
| `metric-toggle` | Tokens/Cost 切换 | 高 |
| `daily-chart` | DailyChart 图表增强 | 高 |
| `source-split` | SourceSplit 分布增强 | 高 |
| `stat-card` | StatCard 卡片增强 | 中 |
| `model-table` | ModelTable 双表增强 | 中 |
| `rate-limit` | Rate Limit 展示增强 | 中 |
| `plugin-update` | 插件版本锁定更新 | 中 |
| `polish` | UI 细节打磨 | 低 |

> 仪表盘类任务（`metric-toggle`…`polish`）的详细差距说明见 [`../feature-gaps.md`](../feature-gaps.md)。

## ✅ 已归档（archive/）

暂无。
