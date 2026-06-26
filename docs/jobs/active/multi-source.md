# [multi-source] 多工具动态支持

**优先级：** P0 最高 ｜ **状态：** 🚧 进行中（规划完成，待开工阶段一） ｜ **立项：** 2026-06-26

把 dashboard 从硬编码两源（claude-code、codex）改造为**可配置的多源动态支持**，后续可接入 cursor、Cherry Studio 等。

---

## 续接锚点（每次收工必更新）

- **上次进展：** 完成整体规划（四阶段拆分 + 架构设计），已调研 Cursor 本地存储，**尚未写任何代码**。
- **下一步：** 开工阶段一第 1 项 —— 新增 `ai-usage.config.json` schema + 读取工具（含默认回退）。
- **卡点：** 阶段四 Cursor 走 API 还是 count-only **待用户拍板**（不阻塞阶段一~三）。

## 决策日志

- `2026-06-26` 源分 **capability 等级**（`token` / `count-only`），不一刀切。因实测 Cursor 本地 SQLite（`AppData/Roaming/Cursor/User/globalStorage/state.vscdb`）只有 `messageRequestContext`/`aiCodeTrackingLines`，**无 token/成本**，数据在服务端，与 claude/codex 的本地 JSONL 根本不同。
- `2026-06-26` 配置统一用根目录 `ai-usage.config.json`，**端口配置并入同一文件**（原独立 feature-gap 已合并至此）。
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

dashboard 根目录 `ai-usage.config.json`：
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

### 阶段一 — 配置文件 + 源注册表 + 动态渲染（🔲 未开始）

> 纯本地、低风险，claude/codex 行为完全不变。可立即开工。

- [ ] 新增 `ai-usage.config.json` schema + 读取工具（含默认回退）
- [ ] 新建 `src/lib/sources/registry.ts`，把 claude/codex 改造为注册表项（标注 `capability`）
- [ ] `aggregate.ts` 改为遍历 enabledSources，移除硬编码
- [ ] `/api/usage` 透出 enabledSources + 各源 capability
- [ ] 页面按返回的源列表 + capability 动态渲染（count-only 走精简卡片）
- [ ] `ecosystem.config.js` 从 config 读端口（优先级高于默认 3002）

### 阶段二 — init 勾选 + 自动探测（🔲 未开始）

- [ ] `init.md` 自动探测已装工具（检测各源数据目录是否存在）
- [ ] `AskUserQuestion` 多选，默认勾选探测到的工具（至少 claude-code）
- [ ] 把选择写入 `ai-usage.config.json` 的 `enabledSources`
- [ ] `init.md` 同时询问端口（默认 3002）写入配置

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

`src/lib/aggregate.ts`、`src/lib/sources/*`、`src/lib/types.ts`、`src/app/api/usage/route.ts`、`src/app/dashboard/page.tsx` 及相关组件、`ecosystem.config.js`、根目录新增 `ai-usage.config.json`；插件侧 `ai-usage-plugin/commands/init.md`、`start.md`、`status.md`、`open.md`。
