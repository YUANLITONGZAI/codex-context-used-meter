# Config Templates

这个目录只放配置模板。不要在仓库里的这些文件里填写真实 token、用户 ID 或真实服务商地址。

复制到本机私有目录后再填写：

```powershell
New-Item -ItemType Directory -Force "$env:APPDATA\codex-context-used-meter"; Copy-Item ".\config\provider-config.json" "$env:APPDATA\codex-context-used-meter\provider-config.json"; Copy-Item ".\config\provider-secrets.json" "$env:APPDATA\codex-context-used-meter\provider-secrets.json"; Copy-Item ".\config\ui-config.json" "$env:APPDATA\codex-context-used-meter\ui-config.json"
```

文件用途：

- `provider-config.json`：填写非密钥配置，比如 Provider 名称、API 地址、接口路径、密钥字段名、刷新间隔和额度换算。
- `provider-secrets.json`：只放本机真实 token 和用户 ID，不要提交、不贴 issue、不发给别人。
- `ui-config.json`：调整 Context 和 Provider 余额条的颜色阈值，以及 Context 压缩提示区域。

`provider-config.json` 里的 `auth.accessTokenSecret` / `userHeader.valueSecret` 是字段名，必须和 `provider-secrets.json` 里的字段名对应。

---

This directory contains templates only. Do not put real tokens, user IDs, or provider endpoints in these repository files.

Copy them to the private local config directory first, then fill them there:

```powershell
New-Item -ItemType Directory -Force "$env:APPDATA\codex-context-used-meter"; Copy-Item ".\config\provider-config.json" "$env:APPDATA\codex-context-used-meter\provider-config.json"; Copy-Item ".\config\provider-secrets.json" "$env:APPDATA\codex-context-used-meter\provider-secrets.json"; Copy-Item ".\config\ui-config.json" "$env:APPDATA\codex-context-used-meter\ui-config.json"
```

Files:

- `provider-config.json`: non-secret provider settings, such as provider name, API URL, endpoint path, secret key names, refresh interval, and quota conversion.
- `provider-secrets.json`: local private token and user ID values only.
- `ui-config.json`: Context and Provider balance color thresholds, plus the Context compaction warning zone.

`auth.accessTokenSecret` / `userHeader.valueSecret` in `provider-config.json` are key names. They must match keys in `provider-secrets.json`.
