# Backlog — 待办任务

未开工的任务，每条只记范围。提升到 `active/` 时再展开「续接锚点 + 里程碑 + 决策日志 + 影响范围」。
仪表盘类任务的详细差距分析见 [`feature-gaps.md`](../feature-gaps.md)。

> 状态均 🔲 未开始。索引见 [`README.md`](README.md)。

---

## [metric-toggle] Tokens/Cost 切换（高）

Header 加 Tokens / Cost 分段选择器，切换影响 DailyChart 与 StatCard 迷你图的展示维度。
详见 feature-gaps.md「一」。

## [daily-chart] DailyChart 图表增强（高）

把自制 div 堆叠柱状图升级为 recharts BarChart：XAxis/YAxis 轴标签、网格线、悬停 Tooltip、渐变填充，并支持 cost 视图切换。
详见 feature-gaps.md「二」。

## [source-split] SourceSplit 分布增强（高）

来源分布加横向比例条 + 百分比显示；修正非 today 范围时 sessions 显示为 0 的逻辑。
详见 feature-gaps.md「三」。

## [stat-card] StatCard 卡片增强（中）

补 Cache tokens 细分、avg cost/session、内嵌迷你 TrendChart 面积图、卡片图标。
详见 feature-gaps.md「四」。

## [model-table] ModelTable 双表增强（中）

历史 + 今日两张并列表；加 Source 文字 badge 列；显示完整原始 model 名称。
详见 feature-gaps.md「五」。

## [rate-limit] Rate Limit 展示增强（中）

无数据时显示占位卡片；加 planType badge + Gauge/Timer 图标；统一三色阈值语义。
详见 feature-gaps.md「六」。

## [cmd-port-aware] 插件命令读取自定义端口（中）

阶段二让 `/local-usage:init` 支持自定义端口并写入 `local-usage.config.json`，且 PM2 模式（ecosystem）与"无 PM2 用 `next start -p $PORT`"都已尊重该端口。但插件其余命令 `start`/`stop`/`status`/`open` 仍写死 `3002`（如 `open.md` 开 `http://localhost:3002/dashboard`、`status.md` 查 3002 端口）。自定义端口时这些命令会指错。

**方案：** 这些命令先读 `$INSTALL_DIR/local-usage.config.json` 取 `port`（读不到回退 3002），再用该端口。涉及插件仓 `commands/{start,stop,status,open}.md`，需 bump 版本。发现于 2026-06-29 阶段二。

## [polish] UI 细节打磨（低）

API warnings 提示、Refresh 旋转动画、Header live-dot、自动刷新 30s→15s、Footer 路径高亮、grid-noise 背景。
详见 feature-gaps.md「七」。

## [plugin-update] 插件版本锁定更新（中）

新增 `/ai-usage:update` 命令。背景：`/plugin update` 只更新插件命令文件，本机看板代码不会更新；直接 `git pull` 最新代码又可能与旧版插件命令不兼容。

**方案（两 repo 同版本号 + git tag 精确锁定）：**
- 发布时 dashboard repo 与 plugin repo 打相同版本 tag（如 `v1.0.6`）
- `init.md` 安装成功后在 `~/ai-usage/.installed-version` 写当前插件版本
- `update.md` 逻辑：读插件 `plugin.json` 版本 vs `.installed-version` → 相同则提示已最新退出；不同则 `git fetch --tags` + `git checkout v{版本}` + `npm install` + `npm run build` + 重启 + 更新 `.installed-version`
- 关键：checkout 精确 tag 而非 pull latest，保证代码与插件命令版本一致

**影响范围：** 新建 `ai-usage-plugin/commands/update.md`、改 `init.md`（写 `.installed-version`）、`.claude-plugin/plugin.json`（加命令 + bump version）、`CHANGELOG.md` + `README.md`、dashboard 发布流程加打 tag。
