# My Tasks 2.3 MCP contract

`app/mcp/route.ts` 的工具定义及 `app/task-service.ts` 的校验器为完整接口来源。保留既有 Todo、复盘、休息日、长期任务工具；旧 Git 元数据不再作为面向模型的操作工具暴露。

## `get_task_launch`

只读，输入 `id`、`mode: chat | work`，可选 `today`。

返回该任务、该模式的真实绑定 `url`、`title`、`prompt` 和 `newPrompt`。重新进入普通讨论不自动发送重复上下文；新会话携带任务上下文。不接受 Git 启动操作。创建会话由浏览器辅助扩展完成，不由该工具调用模型。

## `set_task_ai_workspace`

输入 `id`、`mode: none | chat | work`，可选 `url`、`title`、`today`。保存该模式的真实持久会话地址，不能将 ChatGPT 首页当作会话。切换模式不覆盖另一模式的绑定。兼容旧工作区和聊天链接；不存储会话正文。

## `set_task_repository_link`

输入 `id`、`url`，可选 `today`。只保存仓库的 HTTPS 网页地址，不访问或修改远程仓库。空字符串清除当前链接。链接可以来自 GitHub、GitLab、Gitee 或其他服务；不能含账号密码。数据库按用户隔离，保存不会改变任务状态、聊天绑定或历史进展。

创建、上传和本机 Git 操作已移除；现有仓库链接及历史元数据保持兼容。

全部工具按登录用户验证任务归属。不使用 OpenAI API / Responses API / API Key / 单独计费内嵌模型调用。
