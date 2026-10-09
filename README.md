# MyTask

一个以任务为入口的个人工作台：管理每日任务、长期计划和复盘，并为每个任务保存独立的 ChatGPT 聊天 / Work 会话。

An open-source task workspace with daily reviews and task-specific ChatGPT sessions.

## 功能

- Today / Upcoming / Backlog、优先级、截止日期、项目、标签和下一步行动。
- 长期任务的每日计划、工作记录、阻碍与后续安排。
- 每日复盘、休息日设置和操作历史。
- 按任务分别绑定聊天和 Work 会话，关闭标签页后仍能复用原地址。
- 保存并打开 GitHub、GitLab 等仓库链接。
- MCP 任务工具和浏览器辅助扩展。

项目不调用 OpenAI API，也不需要 API Key。ChatGPT 会话功能通过用户登录的网页和浏览器扩展完成。MyTask 是独立项目，非 OpenAI 官方产品。

## 快速开始

需要 **Node.js ≥22.13.0**、**pnpm 11.25.0** 和 **Python 3**（用于扩展打包）。

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

打开 `http://localhost:5173`，使用本地模拟登录。数据保存在本地 D1；模拟登录只供本机开发。

自动创建与绑定 ChatGPT 会话需要额外加载 `dist/companion/` 浏览器扩展并登录 ChatGPT。
完整步骤、域名配置及生产部署边界见 [安装说明](docs/INSTALL.md)。

**部署说明：**生产版本依赖 Cloudflare D1 和可信身份网关。克隆源码不会自动获得原托管站点的登录服务；普通公网 Worker 需要自己配置认证。开源代码与个人站点的访问权限分别管理。

## 为自己的站点生成扩展

```bash
pnpm setup --origin https://tasks.example.com
pnpm package:extension
pnpm build
```

替换为实际域名。加载 `dist/companion/`，或使用生成的 `public/downloads/MyTasks_Chat_Bridge.zip`。真实部署配置与本地数据均在 Git 忽略规则中。

## 源码结构

```text
app/          页面、任务服务、MCP 和 API 路由
companion/    Chrome / Edge 扩展的唯一源码目录
db/           数据库 schema 和 D1 访问
drizzle/      增量数据库迁移
components/   界面组件
build/        Sites / Worker 构建适配
scripts/      配置、同步、测试和打包工具
tests/        数据与会话流程回归检查
docs/         安装及发布说明
sites/        原托管版本的维护要求和发布记录
vendor/       第三方资源与许可证
```

源码直接保存在 Git 中；下载包由源码生成，不再以 ZIP 作为开发入口。

## 开发与验证

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

完整检查：`pnpm release:check`。HTML 修改后运行 `node scripts/sync-dashboard.mjs`；构建前也会自动同步。
模拟 Chrome API 与 DOM 的测试不等于真实账号端到端验证；ChatGPT 网页控件变化可能影响自动发送，启动页保留手动绑定入口。

## 参与与发布

欢迎 Issue 和 Pull Request。见 [贡献指南](CONTRIBUTING.md)、[安全说明](SECURITY.md)、[发布说明](docs/RELEASING.md) 和 [更新记录](CHANGELOG.md)。

## 许可证

MyTask 的原创代码按 [MIT License](LICENSE) 发布，允许使用、修改、分发和商用，要求保留许可证及版权声明。
第三方代码保留原许可证，见 [第三方声明](THIRD_PARTY_NOTICES.md)。
