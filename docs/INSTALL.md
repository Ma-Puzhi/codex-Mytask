# 安装与部署

## 本地预览

需要 Node.js **≥22.13.0**（建议使用 Node.js 22）、pnpm **11.25.0**
及 Python 3（用于扩展打包）。
如已安装 nvm，可运行 `nvm install` 和 `nvm use`。然后安装 pnpm：

```bash
npm install --global pnpm@11.25.0
git clone https://github.com/Ma-Puzhi/codex-Mytask.git
cd codex-Mytask
pnpm install --frozen-lockfile
pnpm setup
pnpm build
pnpm db:migrate
pnpm dev
```

访问 `http://localhost:5173`，选择本地模拟登录，即可使用本地任务数据库。
模拟账户仅用于本机预览，不是真实 ChatGPT 身份验证。
`pnpm dev` 与 `pnpm db:migrate` 均使用 `.wrangler/state` 下的本地 D1。
数据库迁移需要先构建，因为 Wrangler 配置由构建生成。

扩展不是查看和管理任务的必需条件；自动打开、发送任务上下文及绑定
ChatGPT 会话需要安装扩展并登录 ChatGPT。

## 浏览器扩展

`pnpm setup` 生成针对当前站点的 `dist/companion/`。

1. 打开 Chrome 的 `chrome://extensions` 或 Edge 的 `edge://extensions`。
2. 开启开发者模式，选择“加载已解压的扩展程序”。
3. 加载 `dist/companion/`，刷新 MyTask 页面。
4. 选择一个任务的聊天或 Work 入口，按页面提示完成登录及会话创建。

首次消息发送后，扩展记录真实会话 URL；再次启动复用已绑定会话。
网页控件变化时可能需要手动发送或绑定。模拟测试不能替代真实账号验证。

为自己的 HTTPS 域名配置：

```bash
pnpm setup --origin https://tasks.example.com
pnpm build
pnpm package:extension
```

用实际域名替换示例。重新加载生成的 `dist/companion/`，或分发生成的
`public/downloads/MyTasks_Chat_Bridge.zip`。扩展只申请该站点及
`https://chatgpt.com/*` 的访问权限。网站和扩展需要配置同一个域名。
变更域名后，重启开发服务或重新构建并部署。

`pnpm setup` 无参数时会重新设为 `http://localhost:5173`；它不覆盖已有的
`.openai/hosting.json` 项目身份。`pnpm build` 不会改变扩展配置。

## 配置与数据

| 文件或目录 | 用途 | 是否提交 |
| --- | --- | --- |
| `.mytask/config.json` | 自己的站点域名 | 否 |
| `.openai/hosting.example.json` | 无个人项目标识的部署示例 | 是 |
| `.openai/hosting.json` | 平台部署身份及数据库绑定 | 否 |
| `.env*`、`.dev.vars*` | 自己的环境变量与凭据 | 否 |
| `.wrangler/` | 本地数据库及 Worker 状态 | 否 |
| `drizzle/` | 数据库结构的增量迁移 | 是 |

不需要 OpenAI API Key。核心任务存储使用 Cloudflare D1 绑定 `DB`。
`pnpm db:generate` 从 schema 生成新迁移；`pnpm db:migrate` 仅应用于本地数据库。
删除 `.wrangler/` 会丢失本地任务数据，更新前应备份该目录。

## 生产部署的边界

本项目最初运行在带有 ChatGPT 登录入口、身份网关和 D1 的托管 Sites 环境。
代码中的 `/signin-with-chatgpt`、`/signout-with-chatgpt` 和身份头由该平台提供，
不是一个任意 Worker 都能直接使用的独立 OAuth 服务。

复用现有托管项目时，保留自己的 `.openai/hosting.json`，按
[维护要求](../sites/SITE_BUILD_PROMPT.md) 原地更新，保留原项目的访问权限和数据。
不要使用别人的 `project_id`。

独立部署需要自己提供以下环境：

- Cloudflare D1 数据库绑定 `DB`，并应用 `drizzle/` 中的增量迁移。
- 可信认证网关，过滤客户端身份头、验证用户后注入身份，并限制应用入口。
- 对应的登录、登出和回调路径。
- 与实际域名一致的站点和浏览器扩展配置。

`pnpm build` 生成 Worker 构建产物，但不会创建云数据库、配置身份网关或发布到云端。
`pnpm start` 使用 Wrangler 在本机预览生产构建，认证入口需要另行提供。
本地功能开发优先使用带模拟登录的 `pnpm dev`。

## 验证与排错

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

也可以执行 `pnpm release:check`。测试涵盖 SQL 迁移、不同用户及任务隔离、
Chat/Work 独立绑定、会话恢复、扩展来源检查和站点配置。

若页面提示表不存在，先执行 `pnpm build` 和 `pnpm db:migrate`。
若扩展未响应，检查配置域名与页面是否一致，并重新加载扩展。
若生产环境无法登录，检查身份网关及登录路径，不能通过手工写入身份头
代替对公网请求的认证。
