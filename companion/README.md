# MyTask 浏览器辅助扩展

`companion/` 是扩展源码；请从仓库根目录执行：

```bash
pnpm setup                             # 本地 http://localhost:5173
# 或 pnpm setup --origin https://tasks.example.com
pnpm package:extension
```

在 Chrome / Edge 的扩展管理页打开开发者模式，加载生成的 `dist/companion/`。
下载 ZIP 后加载其中包含 `manifest.json` 的 `MyTasks_Chat_Bridge/` 文件夹。
域名变更后重新运行配置并重新加载扩展，网站也需要重新构建。

扩展只访问配置的 MyTask 站点和 `https://chatgpt.com/*`，使用 `storage` 权限。
它打开用户选择任务的会话、填写并发送任务上下文、记录真实会话 URL。
聊天和 Work 分别绑定；关闭标签页后可重新打开相同会话。

持久存储包含任务 ID、模式、会话 URL、时间戳、待回写状态和删除标记。
待发送上下文放在浏览器临时会话存储中。扩展不申请 Cookie 权限，不读取
密码或令牌，也不调用私有 ChatGPT API。

更新时替换原安装目录文件并点击“重新加载”，以保留尚未回写的本地绑定。
明确确认会话已删除才会重建；登录或网络故障不会被视为删除。
若网页自动发送失败，按启动页提示手动发送或绑定真实地址。

MIT 许可证与第三方说明随生成的扩展一起分发。详细说明见仓库的
`docs/INSTALL.md`、`LICENSE` 和 `THIRD_PARTY_NOTICES.md`。
