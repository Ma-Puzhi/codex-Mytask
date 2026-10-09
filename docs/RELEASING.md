# 发布版本

## 发布前

1. 更新 `VERSION`、`package.json`、扩展 manifest 和 MCP serverInfo 的版本。
2. 在 `CHANGELOG.md` 说明用户可见变化。
3. 执行 `pnpm install --frozen-lockfile` 和 `pnpm release:check`。
4. 需要真实浏览器验证的变更应测试已登录账号的行为，并说明结果。
5. 检查 `git diff --cached`；不提交个人部署配置、真实任务或生成目录。
6. 保留所有第三方许可证，提交最终源码。

## 打包

在干净的 Git 工作区执行：

```bash
pnpm setup --origin http://localhost:5173
pnpm package:release
```

输出在 `dist/releases/`：源码 ZIP、浏览器扩展 ZIP 和 `SHA256SUMS`。
源码仅使用 Git 跟踪文件；两类 ZIP 均包含许可证。默认扩展适用于本地
预览，部署到自己的域名后需要运行 `pnpm setup --origin ...` 再生成扩展。

## GitHub Release

仓库的 `release.yml` 在推送 `v*` 标签时执行完整检查，打包源码和本地预览
扩展，并使用该版本的 `CHANGELOG.md` 创建 GitHub Release。
首次添加工作流或需要补发已存在的标签时，也可在 Actions 页面手动运行，
或在主分支提交 `VERSION` / 发布工作流变更来触发。发布任务先切换到
`v$(cat VERSION)` 的标签源码，确保附件与版本一致；不覆盖已经存在的 Release。
维护者需要允许仓库运行 GitHub Actions；工作流仅在发布任务中获得
`contents: write` 权限。

```bash
git tag -a v2.3.2 -m "MyTask 2.3.2"
git push origin main
git push origin v2.3.2
```

版本号应与当前发布一致。标签推送后的工作流成功才表示 Release 已生成。
若工作流不可用，也可以在 GitHub 的 Releases 页选择已存在标签，上传
`dist/releases/` 中的文件并填写发布说明。

公开代码不会改变个人托管站点和任务数据库的访问权限。旧 Git 提交中的
归档仍然存在；`.gitignore` 只防止后续误提交，不会清除历史。如果历史中
发现真实凭据，应先撤销凭据，再单独处理历史清理。
