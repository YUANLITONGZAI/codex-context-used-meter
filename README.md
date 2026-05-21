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

## License

0BSD. Use it, change it, ship it. No attribution required, no warranty.
