# Security

当前维护范围为默认分支和最新发布版本。

发现身份验证、任务隔离、会话 URL 或扩展消息来源验证方面的漏洞时，
请使用 GitHub 的私密漏洞报告入口：

https://github.com/Ma-Puzhi/codex-Mytask/security/advisories/new

该入口需要仓库维护者启用 Private vulnerability reporting。若尚未启用，
请先在 Issue 中请求私密联系方式，不公开漏洞细节、凭据或真实任务数据。
报告中说明受影响版本、复现步骤、预期影响和可行的修复建议。

生产环境依赖可信身份认证网关：网关应删除客户端传入的
`oai-authenticated-user-*` 头，完成身份认证后再写入这些头，并阻止绕过网关
直接访问应用。普通公网 Worker 不会自动具备这一认证机制。

`pnpm dev` 的模拟登录只用于本机开发，默认监听回环地址。
不要将开发预览和真实任务数据库一起暴露到公网。

浏览器扩展会把用户选择任务的上下文传给 ChatGPT 页面，并保存会话绑定。
它不具备 Cookie 权限，不读取密码或令牌。不要把未授权公开的任务或复盘
写入 Issue、测试样例或截图。
