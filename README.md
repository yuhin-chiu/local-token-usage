# AI Usage

本地 AI 编码工具的 token / 成本看板。直接读取 Claude Code 和 Codex CLI 在本机产生的 JSONL 会话文件，按天 / 模型 / 来源聚合，**所有数据不出本机**。

技术栈：Next.js 16 · React 19 · Tailwind 4 · Recharts · lucide-react。

## 环境要求

- Node.js **20.10+**（Next 16 要求）
- 本机已经在用 Claude Code 或 Codex CLI（看板靠它们写在磁盘上的 JSONL 文件工作；没用过就没数据）
- Windows / macOS / Linux 任意均可，路径全部用 `os.homedir()` 解析

## 数据来源

| 工具 | 路径 | 解析逻辑 |
|---|---|---|
| Claude Code | `~/.claude/projects/**/*.jsonl` | `type=assistant` 行的 `message.usage`，按 `message.id` 去重 |
| Codex CLI | `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` | `event_msg.payload=token_count`，对累计值取差量；顺带读 `rate_limits` 做 5h / 周窗进度 |

价格表硬编码在 `src/lib/pricing.ts`，匹配不到时按模型名 fallback（含 `opus/sonnet/haiku/gpt-5/codex`）。

## 启动

首次拿到项目源码后，先装依赖：

```bash
npm install
```

### 开发模式（带热更新）

```bash
npm run dev
```

默认监听 **http://localhost:3002**。若端口被占，可在 `package.json` 里改 `-p <端口>`。

### 生产模式（推荐长期跑）

```bash
npm run build
npm run start
```

也跑在 3002。生产模式启动快、内存占用低，关掉终端窗口它就停。

### Windows 后台常驻 + 开机自启（推荐 PM2）

本机就是用 **PM2** 托管 `local-usage` 进程跑 `next start -p 3002`，配 `pm2-windows-startup`
实现登录自启。完整的运行架构、自启原理和运维命令见
**[docs/deployment.md](docs/deployment.md)**。

常用命令速查：

```bash
npm run build                          # 改代码后必须重新构建
npx pm2 restart local-usage --update-env  # 重启使其生效
npx pm2 save                           # 固化进程列表，保证开机自启恢复最新状态
npx pm2 status                         # 查看状态
```

> 想临时手动拉起、不走 PM2，可用根目录 `start-hidden.vbs`（无窗口启动）+ `stop-server.cmd`（停掉 3002）。两种方式二选一，别同时跑。

### macOS / Linux 后台常驻（可选）

```bash
nohup npm run start > server.log 2>&1 &
echo $! > .server.pid
```

停掉：`kill $(cat .server.pid)`

## 功能

- **顶部 4 张卡片**：今日 tokens / 今日 cost / 区间总 tokens（带 sparkline）/ 区间总 cost（带 sparkline）
- **来源拆分条**：Claude vs Codex 今日占比
- **Codex Rate Limits**：5h 窗口 + 周窗口进度条 + reset 倒计时
- **日柱状图**：按 Claude / Codex 堆叠，可在 Tokens / Cost 之间切换，可切 7d / 30d / 90d
- **Top 模型表**：Top 10 模型 + 来源 chip + 占比条
- **每 15s 自动刷新**

## 扩展新的 AI 工具

加 Cursor / Gemini / 其它：

1. 在 `src/lib/sources/` 新建 `<name>.ts`，导出 `read<Name>Usage(sinceDate: string): Promise<UsageEvent[]>`
2. 在 `src/lib/types.ts` 的 `SourceId` 联合类型里加 `"<name>"`，并在 `SOURCES` 数组加颜色和标签
3. 在 `src/lib/aggregate.ts` 的 `Promise.allSettled` 列表加上新的读取函数，并在结果合并时 push 进 `events`

UI 自动按 `event.source` 着色和分组，无需改动。

## 项目结构

```
src/
├─ app/
│  ├─ api/
│  │  └─ usage/route.ts       # GET /api/usage?days=N
│  ├─ _components/            # KPI 卡 / 图表 / 表格 / Header 等
│  ├─ globals.css             # 设计令牌 + 卡片样式
│  ├─ layout.tsx
│  └─ page.tsx                # 主仪表盘
└─ lib/
   ├─ sources/
   │  ├─ claude.ts            # Claude Code JSONL 解析
   │  └─ codex.ts             # Codex JSONL 解析
   ├─ pricing.ts              # 模型价格表
   ├─ aggregate.ts            # 跨来源聚合
   ├─ types.ts                # 公共类型
   └─ format.ts               # K/M/B / $ / 相对时间格式化
```

## 常见问题

**端口被占 / 想换端口**
改 `package.json` 里 `dev` 和 `start` 脚本的 `-p <端口>`。

**启动报 "Another next dev server is already running"**
旧的 `.next/dev` 锁残留。在项目根目录执行：
```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next

# macOS / Linux
rm -rf .next
```
然后重试。

**Codex 成本仅供参考**
Codex 走 ChatGPT Plus / Pro 订阅是按月固定费，看板里的 `$` 是按 GPT-5 公开 API 价计算的"折算"值，用来横向对比 token 体量，并非实际账单。

**第三方代理模型价格不准**
`z-ai/glm-5.1`、`moonshotai/kimi-k2.5` 这类目前 fallback 到 Sonnet 价。需要精确可在 `src/lib/pricing.ts` 里加。
