# Codex Context Used Meter

一个给 [BigPizzaV3/CodexPlusPlus](https://github.com/BigPizzaV3/CodexPlusPlus) 写的 Codex++ 用户脚本。

它会在 Codex App 对话界面顶部显示当前会话还剩多少上下文，并用一个小条形图展示。新消耗 token 时，会从右往左弹出一个轻量的“扣血”数字特效。

## 这是干什么的

- 显示 `Context Left xx.x%`。
- 显示已用 / 总上下文 token 数。
- 尽量按当前打开的会话读取，不固定到某一个旧会话。
- 没读到有效上下文信息时自动隐藏，不占界面。
- 只在 Codex 对话窗口显示，不在 Codex++ 其他页面乱显示。

## 安装

把 `codex-context-used-meter.js` 放到 Codex++ 的用户脚本目录：

```text
%APPDATA%\Codex++\user_scripts\codex-context-used-meter.js
```

然后在 Codex++ 管理工具里点击重新加载用户脚本，或者重启 Codex++。

## 可选：Provider 余额框

脚本支持在 Context 框旁边显示一个并列的 Provider 余额框。余额数据不由用户脚本直接请求服务商，而是由本机 helper 读取私有配置后直接请求服务商，再通过 Codex++ 打开的 CDP 调试端口把脱敏 summary 写进 Codex 页面。

这样 token、用户 ID、服务商地址都留在本机私有配置里；Codex 渲染页只拿到已脱敏的余额、用量、状态和到期时间。

复制空白配置到本机私有目录：

```powershell
New-Item -ItemType Directory -Force "$env:APPDATA\codex-context-used-meter"; Copy-Item ".\examples\provider-config.blank.json" "$env:APPDATA\codex-context-used-meter\provider-config.json"; Copy-Item ".\examples\provider-secrets.blank.json" "$env:APPDATA\codex-context-used-meter\provider-secrets.json"
```

然后编辑这两个本机文件：

```text
%APPDATA%\codex-context-used-meter\provider-config.json
%APPDATA%\codex-context-used-meter\provider-secrets.json
```

`provider-config.json` 里填写：

- `id`：本地唯一 ID，比如 `primary`。
- `displayName`：界面上显示的 Provider 名称。
- `baseUrl`：服务商 API 根地址。
- `endpointPath`：订阅 / 余额接口路径。
- `auth.accessTokenSecret`：在 `provider-secrets.json` 里保存 token 的字段名。
- `userHeader.name`：服务商要求的用户 ID header 名；不需要就留空。
- `userHeader.valueSecret`：在 `provider-secrets.json` 里保存用户 ID 的字段名；不需要就留空。

`provider-secrets.json` 只放本机私密值，字段名要和 `provider-config.json` 里的 `accessTokenSecret` / `valueSecret` 对上。

推荐安装自动管理器：

```powershell
.\tools\install-provider-supervisor.ps1
```

它会给当前 Windows 用户创建一个计划任务。登录后会自动启动一个很轻的 supervisor：Codex 打开时，它会启动 `provider-helper.js`；Codex 关闭后，它会停掉 helper。这样余额框会跟着 Codex 出现和消失，平时不需要手动开 helper。

如果你只想临时测试，也可以手动跑一次 helper：

```powershell
node .\tools\provider-helper.js --once
```

supervisor / helper 需要能访问 Codex App 的 CDP 调试端口。通常 Codex++ 启动 Codex 后会自动打开这个端口；如果你的端口不是默认值，可以在 `provider-config.json` 里配置 `codex.debugPort`，或设置环境变量 `CCM_CODEX_DEBUG_PORT`。

Provider 框显示的名字来自 `provider-config.json` 里的 `displayName`。比如你可以写成自己服务商的简称；公开仓库里的示例只放通用占位名。

Provider 金额默认刷新周期是 10 秒，可以在 `provider-config.json` 里的 `refreshIntervalMs` 调整。

Context 条最左边的黄/橙斜线表示“快要压缩了”：当剩余上下文掉进这段区域，就说明这个会话接近压缩点。斜线区域默认占左侧 20%，可以用 `provider-config.json` 里的 `ui.context.compressionWarningLeftPercent` 调整。进度条颜色也会更早提醒：默认剩余 60% 开始变提示色，35% 变预警色，20% 变警告色。

只测试 provider 请求和响应解析，不注入 Codex 页面：

```powershell
node .\tools\provider-helper.js --once --no-cdp --print-summary
```

注意：`provider-secrets.json` 不要提交到 Git，不要贴到 issue，不要发给别人。

如果以后不想自动启动了：

```powershell
.\tools\uninstall-provider-supervisor.ps1
```

## 让 Agent 自动安装

你也可以直接复制下面这段 Prompt 给 Codex / Claude / 其他本机 Agent，让它帮你安装：

```text
请帮我安装 Codex Context Used Meter：

1. 确认这台机器已经安装 Codex++。
2. 创建 Codex++ 用户脚本目录：%APPDATA%\Codex++\user_scripts
3. 从 https://raw.githubusercontent.com/Minghou-Lei/codex-context-used-meter/main/codex-context-used-meter.js 下载脚本。
4. 保存为：%APPDATA%\Codex++\user_scripts\codex-context-used-meter.js
5. 检查文件存在，并确认脚本内容里包含 __codexContextMeterInstalled。
6. 提醒我在 Codex++ 里点击“重新加载用户脚本”，或者重启 Codex++。

不要修改 Codex App 的安装目录。
```

## 注意

这个脚本不是 Tampermonkey 脚本，也不是 Node.js 脚本。它是在 Codex App 渲染页里运行的 Codex++ 用户脚本。

它不会修改 Codex App 安装文件。它依赖 Codex++ 的用户脚本注入能力，也会读取 Codex 页面里已经存在的运行态信息。Codex App 或 Codex++ 更新后，如果内部结构变化，脚本可能需要跟着修。

脚本本身不主动上传会话内容，不额外发网络请求。

Provider 余额框不会直接请求服务商，也不会读取本机密钥文件。真实 token、用户 ID、服务商地址应该只保存在本机私有配置里。

## License

0BSD. 随便用，随便改，随便发；没有署名要求，也没有任何担保。

---

# Codex Context Used Meter

A Codex++ user script built for [BigPizzaV3/CodexPlusPlus](https://github.com/BigPizzaV3/CodexPlusPlus).

It shows the current conversation's remaining context at the top of the Codex App UI, with a small progress bar. When token usage increases, it shows a lightweight right-to-left "damage number" animation.

## What It Does

- Shows `Context Left xx.x%`.
- Shows used / total context tokens.
- Tries to follow the currently opened conversation instead of sticking to an old one.
- Hides itself when no valid context usage value is available.
- Only appears in Codex conversation views, not in unrelated Codex++ pages.

## Install

Put `codex-context-used-meter.js` in the Codex++ user script directory:

```text
%APPDATA%\Codex++\user_scripts\codex-context-used-meter.js
```

Then reload user scripts from the Codex++ manager, or restart Codex++.

## Optional: Provider Balance Card

The script can show a provider balance card next to the Context card. The user script does not call the provider directly. A local helper reads private config, calls the provider, and pushes a sanitized summary into the Codex page through the CDP debug port opened by Codex++.

Tokens, user IDs, and provider endpoints stay in private local config files. The Codex renderer page only receives sanitized balance, usage, status, and expiry values.

Copy the blank config to a private local directory:

```powershell
New-Item -ItemType Directory -Force "$env:APPDATA\codex-context-used-meter"; Copy-Item ".\examples\provider-config.blank.json" "$env:APPDATA\codex-context-used-meter\provider-config.json"; Copy-Item ".\examples\provider-secrets.blank.json" "$env:APPDATA\codex-context-used-meter\provider-secrets.json"
```

Edit these local files:

```text
%APPDATA%\codex-context-used-meter\provider-config.json
%APPDATA%\codex-context-used-meter\provider-secrets.json
```

Fill `provider-config.json` with:

- `id`: a local unique ID, such as `primary`.
- `displayName`: the provider name shown in the UI.
- `baseUrl`: the provider API base URL.
- `endpointPath`: the subscription / balance endpoint path.
- `auth.accessTokenSecret`: the key name used for the token in `provider-secrets.json`.
- `userHeader.name`: the provider's user ID header name; leave it empty if not needed.
- `userHeader.valueSecret`: the key name used for the user ID in `provider-secrets.json`; leave it empty if not needed.

Only put private values in `provider-secrets.json`. Its keys must match `accessTokenSecret` / `valueSecret` from `provider-config.json`.

Recommended: install the automatic supervisor:

```powershell
.\tools\install-provider-supervisor.ps1
```

It creates a scheduled task for the current Windows user. After login, a lightweight supervisor starts automatically: when Codex is open, it starts `provider-helper.js`; when Codex exits, it stops the helper. The balance card then follows Codex without manual steps.

For a one-off test, you can still run:

```powershell
node .\tools\provider-helper.js --once
```

The supervisor / helper needs access to the Codex App CDP debug port. Codex++ normally opens it when launching Codex. If your port is not the default, set `codex.debugPort` in `provider-config.json`, or set `CCM_CODEX_DEBUG_PORT`.

The provider card name comes from `displayName` in `provider-config.json`. Use your own provider nickname there; the public example only uses a generic placeholder.

The default provider balance refresh interval is 10 seconds. You can change it with `refreshIntervalMs` in `provider-config.json`.

The yellow/orange stripes on the left side of the Context bar mean "getting close to compaction." When the remaining context falls into that striped area, the conversation is near the compaction point. The striped zone defaults to the leftmost 20% and can be changed with `ui.context.compressionWarningLeftPercent` in `provider-config.json`. The bar also changes color earlier: by default it enters notice at 60% left, warn at 35% left, and danger at 20% left.

Test provider fetching and response parsing without injecting the Codex page:

```powershell
node .\tools\provider-helper.js --once --no-cdp --print-summary
```

Do not commit `provider-secrets.json`, paste it into issues, or share it.

To remove automatic startup later:

```powershell
.\tools\uninstall-provider-supervisor.ps1
```

## Agent Install Prompt

You can also copy this prompt into Codex, Claude, or another local agent and let it install the script for you:

```text
Please install Codex Context Used Meter for me:

1. Confirm Codex++ is installed on this machine.
2. Create the Codex++ user script directory: %APPDATA%\Codex++\user_scripts
3. Download the script from https://raw.githubusercontent.com/Minghou-Lei/codex-context-used-meter/main/codex-context-used-meter.js
4. Save it as: %APPDATA%\Codex++\user_scripts\codex-context-used-meter.js
5. Check that the file exists and that its content contains __codexContextMeterInstalled.
6. Remind me to click "Reload user scripts" in Codex++, or restart Codex++.

Do not modify the Codex App installation directory.
```

## Notes

This is not a Tampermonkey script and not a Node.js script. It runs inside the Codex App renderer page as a Codex++ user script.

It does not modify the Codex App installation. It depends on Codex++ user script injection and reads runtime state already available inside the Codex page. If Codex App or Codex++ changes its internals, the script may need an update.

The script does not upload conversation content or make extra network requests by itself.

The provider balance card does not call the provider directly and does not read local secret files. Real tokens, user IDs, and provider endpoints should stay in private local config files.

## License

0BSD. Use it, change it, ship it. No attribution required, no warranty.
