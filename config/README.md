# Config Templates

这个目录只放配置模板。不要在仓库里的这些文件里填写真实 token、用户 ID 或真实服务商地址。

复制到本机私有目录后再填写：

```powershell
New-Item -ItemType Directory -Force "$env:APPDATA\codex-context-used-meter"; Copy-Item ".\config\provider-config.json" "$env:APPDATA\codex-context-used-meter\provider-config.json"; Copy-Item ".\config\provider-secrets.json" "$env:APPDATA\codex-context-used-meter\provider-secrets.json"; Copy-Item ".\config\ui-config.json" "$env:APPDATA\codex-context-used-meter\ui-config.json"
```

运行时默认读取：

```text
%APPDATA%\codex-context-used-meter\provider-config.json
%APPDATA%\codex-context-used-meter\provider-secrets.json
%APPDATA%\codex-context-used-meter\ui-config.json
```

## 文件分工

- `provider-config.json`：非密钥配置。放 Provider 名称、API 地址、接口路径、密钥字段名、刷新间隔和额度换算。
- `provider-secrets.json`：本机私密值。只放真实 token、用户 ID 这类敏感信息。
- `ui-config.json`：界面配置。控制 Context 条和 Provider 余额条的颜色阈值，以及 Context 压缩提示区域。

## provider-config.json

### `codex`

Codex App 的本机连接配置。helper 会通过 Codex++ 打开的 CDP 调试端口，把脱敏后的 Provider summary 写进 Codex 页面。

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `debugPort` | number | 否 | Codex App 的 CDP 端口。默认是 `9229`；如果 Codex++ 使用了其他端口，就改这里。 |
| `targetUrlHint` | string | 否 | 选择 CDP 页面目标时用的关键词。通常保持 `codex` 即可。 |

### `providers[]`

Provider 列表。现在界面会显示第一个有效的 active Provider。

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `id` | string | 是 | 本地唯一 ID。建议用短英文，比如 `primary`。它只用于本机识别，不要放密钥。 |
| `displayName` | string | 是 | 界面上显示的 Provider 名称。可以写服务商简称。 |
| `baseUrl` | string | 是 | Provider API 根地址，例如 `https://example.com`。必须是公网 HTTPS；不要填内网、localhost 或带密钥的 URL。 |
| `endpointPath` | string | 是 | 订阅 / 余额接口路径，例如 `/api/subscription/self`。helper 会和 `baseUrl` 拼成完整请求地址。 |
| `auth.type` | string | 是 | 鉴权方式。目前支持 `bearer`。 |
| `auth.accessTokenSecret` | string | 是 | token 在 `provider-secrets.json` 里的字段名，不是真实 token。 |
| `userHeader.name` | string | 否 | 如果服务商要求额外用户 ID header，就填 header 名；不需要就留空。 |
| `userHeader.valueSecret` | string | 否 | 用户 ID 在 `provider-secrets.json` 里的字段名，不是真实用户 ID。 |
| `refreshIntervalMs` | number | 否 | Provider 余额刷新间隔，单位毫秒。默认模板是 `10000`，也就是 10 秒。 |
| `quota.amountDivisor` | number | 是 | raw quota 到金额的换算因子。显示金额 = raw quota / `amountDivisor`。 |

关键点：`auth.accessTokenSecret` 和 `userHeader.valueSecret` 是“字段名映射”，不是敏感值本身。真实值只写进 `provider-secrets.json`。

## provider-secrets.json

这个文件只放本机敏感值。字段名要和 `provider-config.json` 里的 `auth.accessTokenSecret` / `userHeader.valueSecret` 对上。

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `provider_access_token` | string | 取决于 Provider | 真实访问 token。模板里的名字可以改，但要同步改 `auth.accessTokenSecret`。 |
| `provider_user_id` | string | 取决于 Provider | 真实用户 ID 或租户 ID。服务商不要求额外 header 时可以留空。 |

不要提交这个文件的本机版本，不要贴到 issue，不要发给别人，也不要让 Agent 在聊天里完整回显。

## ui-config.json

UI 配置不包含密钥，可以按使用习惯调整。

### `context`

控制 Context 框。

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `compressionWarningLeftPercent` | number | 否 | Context 剩余百分比低于这个值时，进度条左侧压缩提示区域会变明显。模板默认 `20`。 |
| `levelThresholds.noticeLeftPercent` | number | 否 | 剩余百分比低于这个值时进入提示色。模板默认 `60`。 |
| `levelThresholds.warnLeftPercent` | number | 否 | 剩余百分比低于这个值时进入预警色。模板默认 `50`。 |
| `levelThresholds.dangerLeftPercent` | number | 否 | 剩余百分比低于这个值时进入警告色。模板默认 `40`。 |
| `levelThresholds.criticalLeftPercent` | number | 否 | 剩余百分比低于这个值时进入严重警告色。模板默认 `30`。 |

### `provider`

控制 Provider 余额框。

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `levelThresholds.noticeLeftPercent` | number | 否 | Provider 余额剩余百分比低于这个值时进入提示色。模板默认 `60`。 |
| `levelThresholds.warnLeftPercent` | number | 否 | Provider 余额剩余百分比低于这个值时进入预警色。模板默认 `50`。 |
| `levelThresholds.dangerLeftPercent` | number | 否 | Provider 余额剩余百分比低于这个值时进入警告色。模板默认 `40`。 |
| `levelThresholds.criticalLeftPercent` | number | 否 | Provider 余额剩余百分比低于这个值时进入严重警告色。模板默认 `30`。 |

阈值按“越低越严重”判断。比如剩余 38% 会命中 `dangerLeftPercent: 40`，剩余 28% 会命中 `criticalLeftPercent: 30`。

---

# Config Templates

This directory contains templates only. Do not put real tokens, user IDs, or provider endpoints in these repository files.

Copy them to the private local config directory first, then fill them there:

```powershell
New-Item -ItemType Directory -Force "$env:APPDATA\codex-context-used-meter"; Copy-Item ".\config\provider-config.json" "$env:APPDATA\codex-context-used-meter\provider-config.json"; Copy-Item ".\config\provider-secrets.json" "$env:APPDATA\codex-context-used-meter\provider-secrets.json"; Copy-Item ".\config\ui-config.json" "$env:APPDATA\codex-context-used-meter\ui-config.json"
```

## Files

- `provider-config.json`: non-secret provider settings, such as provider name, API URL, endpoint path, secret key names, refresh interval, and quota conversion.
- `provider-secrets.json`: local private token and user ID values only.
- `ui-config.json`: Context and Provider balance color thresholds, plus the Context compaction warning zone.

## Key Rules

- Keep real secrets only in `%APPDATA%\codex-context-used-meter\provider-secrets.json`.
- `auth.accessTokenSecret` and `userHeader.valueSecret` are key names, not secret values.
- `baseUrl` should be a public HTTPS API root, without tokens in the URL.
- Color thresholds use remaining percent. Lower remaining percent means a more severe state.
