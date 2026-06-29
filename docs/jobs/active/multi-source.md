# [multi-source] 多工具动态支持

**优先级：** P0 最高 ｜ **状态：** 🚧 进行中（规划完成，待开工阶段一） ｜ **立项：** 2026-06-26

把 dashboard 从硬编码两源（claude-code、codex）改造为**可配置的多源动态支持**，后续可接入 cursor、Cherry Studio 等。

---

## 续接锚点（每次收工必更新）

> 进度：✅ 阶段一（6/6）+ ✅ 阶段二（代码）完成并已 push 两仓。明细见下方里程碑 checkbox + 决策日志。

- **上次进展（2026-06-29 收工）：**
  - 阶段一 6 项全部完成（config/registry/aggregate/API sources/页面动态渲染/ecosystem 端口）；清理了 `dashboard/_components/` 死代码 + 不可达的旧版根 dashboard（`src/app/page.tsx`+`src/app/_components/`，删后 `/`→`/dashboard` 307 正常）。
  - 进程名/配置文件统一 `ai-usage` → **`local-usage`**（含 `local-usage.config.json`）。PM2 现跑 `local-usage`。
  - 阶段二代码完成（**插件仓** `init.md` 新增 Step 5：探测 `~/.claude/projects`+`~/.codex/sessions` → 多选源 → 问端口 → 写 `local-usage.config.json`；无 PM2 模式用 `next start -p $PORT`）；`plugin.json` 1.0.6→**1.1.0** + CHANGELOG。
  - 两仓均已 push：看板 `local-token-usage`(b36cda4)、插件 `local-token-usage-plugin`(87723f0, main 已修好 tracking)。用户可 `/plugin update`。

- **明天首要任务 ① 修 `cmd-port-aware`（遗留 3002 写死）：** 插件命令 `start`/`stop`/`status`/`open` 仍把端口写死 `3002`，自定义端口时会指错。改为先读 `$INSTALL_DIR/local-usage.config.json` 的 `port`（回退 3002）再用。涉及插件仓 4 个命令文件 + bump 版本。详见 backlog `cmd-port-aware`。
- **明天任务 ② 阶段二端到端验证：** `/plugin update` 后跑一次 `/local-usage:init`，确认 Step 5 探测/选源/问端口/写配置全流程 OK（指令文档没法自测，只在本机验过 shell 片段）。

- **暂缓：** 阶段三 `/config` 动态改配置（用户说不着急）。
- **卡点：** 阶段四 Cursor 走 API 还是 count-only **待用户拍板**（不阻塞）。

## 决策日志

- `2026-06-29` 进程名 `ai-usage` → **`local-usage`**、配置文件 `ai-usage.config.json` → **`local-usage.config.json`**（example 同步重命名）。原因：插件 `ai-usage-plugin` 的 start/stop/status 命令一直用 `local-usage` 进程名，而 dashboard 的 ecosystem 注册的是 `ai-usage`，二者对不上导致插件这些命令找不到进程。统一向插件对齐（改 dashboard 一侧）。改动：`ecosystem.config.js`/`config.ts`/`package.json`/`package-lock.json`/`CLAUDE.md`/`README.md`/`docs/deployment.md`。**未动**：仓库目录名、`ai-usage-plugin` 仓库名、历史规划文档、localStorage key `ai-usage-theme`（改了会重置用户主题）。

- `2026-06-26` 源分 **capability 等级**（`token` / `count-only`），不一刀切。因实测 Cursor 本地 SQLite（`AppData/Roaming/Cursor/User/globalStorage/state.vscdb`）只有 `messageRequestContext`/`aiCodeTrackingLines`，**无 token/成本**，数据在服务端，与 claude/codex 的本地 JSONL 根本不同。
- `2026-06-26` 配置统一用根目录 `local-usage.config.json`，**端口配置并入同一文件**（原独立 feature-gap 已合并至此）。
- `2026-06-26` 引入**源注册表**替代 `aggregate.ts` 硬编码，顺带解决"没装 codex 也空跑目录遍历"。

---

## 目标

1. claude-code、codex 为**默认**数据源
2. 后续可加 cursor、Cherry Studio 等更多源
3. `init` 时用 `AskUserQuestion` 让用户勾选要纳入的工具，写进配置
4. 以后开放 `/config` 功能动态改配置
5. 页面**动态渲染**：只显示已启用的源

## 核心设计：源分"能力等级"

| 等级 | 含义 | 工具 | 能拿到 |
|---|---|---|---|
| `token` | 本地有逐请求 token | claude-code、codex | 完整 token + 成本 |
| `count-only` | 本地只有请求/会话数 | cursor（本地无 token） | 请求数、AI 代码行数，**无成本** |
| `待调研` | 需先确认存储位置 | Cherry Studio | 可能本地有 token（待验证） |

页面据此渲染：`token` 源完整卡片，`count-only` 源走"无成本"精简卡片，避免与其他源指标错误对齐。

## 配置文件设计

dashboard 根目录 `local-usage.config.json`：
```json
{
  "version": 1,
  "enabledSources": ["claude-code", "codex"],
  "port": 3002
}
```
- 文件不存在 → 回退默认 `["claude-code","codex"]`（向后兼容，老用户无感）

## 架构优化：源注册表（替代当前硬编码）

现状 `src/lib/aggregate.ts` 写死调用两个 reader。改为注册表：
```ts
// src/lib/sources/registry.ts
type SourceModule = {
  id: SourceId;
  label: string;
  capability: "token" | "count-only";
  detect: () => Promise<boolean>;   // 数据目录是否存在
  read: (since: string) => Promise<UsageEvent[]>;
};
```
`buildSnapshot` 只遍历 `enabledSources ∩ 注册表`。加新源 = 注册表加一项 + config 可选启用，不再改 aggregate 逻辑。

---

## 里程碑

### 阶段一 — 配置文件 + 源注册表 + 动态渲染（✅ 完成 2026-06-29）

> 纯本地、低风险，claude/codex 行为完全不变。6 项全部完成并验证。

- [x] 新增 `local-usage.config.json` schema + 读取工具（含默认回退） — `src/lib/config.ts` + `local-usage.config.example.json`（2026-06-29）
- [x] 新建 `src/lib/sources/registry.ts`，把 claude/codex 改造为注册表项（标注 `capability`） — `SourceModule`/`SOURCE_REGISTRY`/`getSourceModules` + 统一 `SourceReadResult`（2026-06-29）
- [x] `aggregate.ts` 改为遍历 enabledSources，移除硬编码 — `buildSnapshot` 走 `loadConfig`→`getSourceModules`→遍历 read，所有 source-keyed 结构动态化（2026-06-29）
- [x] `/api/usage` 透出 enabledSources + 各源 capability — `UsageSnapshot.sources: SourceInfo[]`（`{id,capability}`，config 顺序）；`SourceCapability` 移到 `types.ts`，registry 改引入（2026-06-29）
- [x] 页面按返回的源列表 + capability 动态渲染（count-only 走精简卡片） — `page.tsx` 全部源相关区域遍历 `data.sources`，label/accent 从 `SOURCES` 查（带兜底）；token 图表只遍历 `capability==="token"` 源；count-only 走无成本精简显示。先并行建 `dashboard2/` 验证后替换进 `dashboard/`（2026-06-29）
- [x] `ecosystem.config.js` 从 config 读端口（优先级高于默认 3002） — 顶部 `resolvePort()` 用 fs 读 `local-usage.config.json` 的 port（镜像 config.ts 校验，回退 3002）。验证：无配置→3002、port=4000→4000、非法→3002（2026-06-29）。**边界**：`package.json` 的 dev/start 仍写死 `-p 3002`（静态字符串）

### 阶段二 — init 勾选 + 自动探测（✅ 代码完成 2026-06-29，待端到端实跑验证）

> 全在插件仓 `ai-usage-plugin/commands/init.md`（新增 Step 5）+ `plugin.json` bump 1.0.6→1.1.0 + CHANGELOG。dashboard 仓无改动（stage 1 已能读配置）。

- [x] `init.md` 自动探测已装工具（检测 `~/.claude/projects`、`~/.codex/sessions`；bash + PowerShell 两套）— init.md Step 5a
- [x] `AskUserQuestion` 多选，默认推荐探测到的工具（至少 claude-code）— Step 5b
- [x] 把选择写入 `local-usage.config.json` 的 `enabledSources` — Step 5d（cat heredoc / Out-File 两套），写在启动服务前
- [x] `init.md` 同时询问端口（默认 3002）写入配置 — Step 5c；无 PM2 模式改用 `next start -p $PORT` 以尊重自定义端口
- 验证：本机实测了探测 + 写 JSON 的 shell 片段；**端到端 `/local-usage:init` 需用户实跑一次**（指令文档无法自测）

### 阶段三 — `/config` 动态改配置（🔲 未开始）

- [ ] 决策：做成网页设置页 还是 插件命令（待定）
- [ ] 提供启用/停用源、改端口的入口
- [ ] 改完即时生效（重启服务或热读配置）

### 阶段四 — 接入新源（🔲 未开始）

> **接入前置规则：每个新源先做"存储调研"——本地到底有没有 token？** 再定 `capability`。

- [ ] **Cursor**：⏸️ 已调研，本地无 token/成本（数据在服务端）。决策：走官方 API（破坏"本地优先"，需 auth/key）还是只做 count-only？— **待拍板**
- [ ] **Cherry Studio**：🔲 未调研存储位置与是否含本地 token
- [ ] 每接入一个：注册表加项 + 定 capability + 页面适配

---

## 接入前调研清单（每个新源必答）

1. 数据存哪？（JSONL / SQLite / JSON / 仅服务端）
2. 本地是否有逐请求 token 数和成本？→ 决定 `capability`
3. 是否需要 auth/API key？是否破坏"本地优先、数据不出本机"原则？
4. 模型名格式能否套用 `pricing.ts` 的 fallback？

## 影响范围

`src/lib/aggregate.ts`、`src/lib/sources/*`、`src/lib/types.ts`、`src/app/api/usage/route.ts`、`src/app/dashboard/page.tsx` 及相关组件、`ecosystem.config.js`、根目录新增 `local-usage.config.json`；插件侧 `ai-usage-plugin/commands/init.md`、`start.md`、`status.md`、`open.md`。
