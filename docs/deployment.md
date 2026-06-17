# 部署 / 常驻运行说明（Windows + PM2）

这个看板在本机以**生产构建**常驻运行，端口 **3002**，由 **PM2** 托管，开机自动拉起。
下面是它的工作方式以及日常运维命令。

## 运行架构

| 项 | 值 |
| --- | --- |
| 进程管理器 | PM2 (`pm2@7`) |
| 进程名 | `ai-usage`（见 `ecosystem.config.js`） |
| 启动命令 | `next start -p 3002`（生产构建，**不是** `next dev`） |
| 端口 | `3002` |
| 工作目录 | 项目根目录 `D:\projects\ai-usage` |
| 自动重启 | `autorestart: true`，崩溃后 3s 重启，最多 10 次 |
| 开机自启 | `pm2-windows-startup`（见下） |

进程定义在 `ecosystem.config.js`，PM2 用它来启动 `next start -p 3002`。

## 开机自启原理

Windows 上 PM2 原生的 `pm2 startup` 不可用（没有 init system）。这里用的是
**`pm2-windows-startup`**，它在注册表写了一条登录启动项：

```
HKCU\Software\Microsoft\Windows\CurrentVersion\Run
  PM2 = wscript.exe "...\pm2-windows-startup\invisible.vbs" "...\pm2-windows-startup\pm2_resurrect.cmd"
```

登录时它静默执行 `pm2 resurrect`，从 `~/.pm2/dump.pm2` 恢复上次保存的进程列表。
因此**每次改完配置后必须 `pm2 save`**，否则重启电脑后恢复的是旧状态。

> 注意：这是「用户登录后」启动，不是「系统服务」级别。需要当前用户登录才会拉起。

## 日常运维

```bash
# 查看状态 / 日志
npx pm2 status
npx pm2 logs ai-usage
npx pm2 logs ai-usage --lines 100

# 改了代码后：重新构建并重启（关键步骤，生产构建不会热更新）
npm run build
npx pm2 restart ai-usage --update-env
npx pm2 save          # 固化进程列表，保证开机自启恢复的是最新状态

# 停止 / 启动 / 删除
npx pm2 stop ai-usage
npx pm2 start ecosystem.config.js
npx pm2 delete ai-usage
```

### 首次部署（在一台新机器上）

```bash
npm install
npm run build
npx pm2 start ecosystem.config.js
npx pm2 save

# 配置开机自启（仅需一次）
npm i -g pm2-windows-startup
pm2-startup install
```

## 重要提醒

- **改代码不会自动生效**：跑的是 `next start`（生产构建）。必须 `npm run build` + `pm2 restart`。
- **改完记得 `pm2 save`**：否则重启后 `pm2 resurrect` 恢复旧进程。
- **端口冲突**：若 3002 被占用，可用根目录的 `stop-server.cmd` 杀掉占用进程。

## 备用启动方式（不走 PM2）

根目录的 `start-hidden.vbs` 是一个**无窗口**直接启动 `next start -p 3002` 的脚本，
适合临时手动拉起、不想用 PM2 的场景。它**不带**自动重启和开机自启，与 PM2 方式二选一，
不要同时运行（会端口冲突）。`stop-server.cmd` 用来停掉监听 3002 的进程。
