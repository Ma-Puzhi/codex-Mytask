# Contributing to MyTask

欢迎报告问题、改进文档和提交 Pull Request。

1. Fork 仓库，创建描述改动的分支。
2. 按 [安装说明](docs/INSTALL.md) 安装 Node.js 22 和锁定的 pnpm。
3. 修改源码，说明触发场景与改动后的行为。
4. 运行 `pnpm release:check`。修改会话绑定、用户隔离或迁移时，增加覆盖实际行为的回归检查。
5. 提交 PR，附验证结果；浏览器真实账号测试和模拟测试应分别说明。

`companion/` 是浏览器扩展的唯一源码目录。不要修改 `dist/companion/` 或
ZIP 中的代码；它们由 `pnpm setup` 和 `pnpm package:extension` 生成。
`app/dashboard.html`、`app/launch.html` 是页面源文件，对应的 `*-html.ts`
由 `node scripts/sync-dashboard.mjs` 同步。构建前会自动执行同步。

数据库变更通过 `drizzle/` 新增迁移，保留现有数据及用户隔离。
不要修改已经发布的迁移文件，也不要提交本地 D1 数据、任务、复盘或会话缓存。

本地配置放在 `.mytask/config.json`、`.openai/hosting.json` 和 `.env*`
等忽略文件中。不要提交个人项目标识、密钥、令牌或私人数据。
第三方代码的版权声明和许可证应保留。

提交贡献时，你确认有权贡献这些内容，并同意按项目的 MIT 许可证授权你的贡献。
不要求签署单独的 CLA。

报告漏洞请使用 [安全说明](SECURITY.md) 中的私密渠道。
