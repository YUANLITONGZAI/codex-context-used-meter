# AGENTS.md

## 生效位置

这个仓库里的用户脚本只有放到 Codex++ 用户脚本目录后才会生效：

```cmd
%APPDATA%\Codex++\user_scripts
```

在当前 Windows 用户下，这个路径也可写成：

```cmd
%USERPROFILE%\AppData\Roaming\Codex++\user_scripts
```

提交到远端的文档、脚本和示例命令应优先使用 `%APPDATA%` 形式，避免写入本机用户名或绝对用户目录。

## 部署命令

从仓库根目录更新本机 Codex++ 脚本时，使用：

```cmd
copy /Y codex-context-used-meter.js "%APPDATA%\Codex++\user_scripts\codex-context-used-meter.js"
```

PowerShell 等价命令：

```powershell
Copy-Item -LiteralPath .\codex-context-used-meter.js -Destination (Join-Path $env:APPDATA 'Codex++\user_scripts\codex-context-used-meter.js') -Force
```

## 修改约定

- 保持仓库内源码与 `%APPDATA%\Codex++\user_scripts` 下的实际生效脚本同步。
- 不要在可提交文件中硬编码本机用户目录绝对路径。
- 修改后至少确认目标脚本已复制到用户脚本目录，再验证 Codex++ 中的实际效果。
- push 到远端前必须检查本次提交内容是否包含隐私数据或本机敏感信息，例如真实用户目录、Token、密钥、邮箱、私网地址、带凭据的 URL。
