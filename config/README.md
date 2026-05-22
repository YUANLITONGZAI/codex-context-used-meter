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

Runtime reads these files by default:

```text
%APPDATA%\codex-context-used-meter\provider-config.json
%APPDATA%\codex-context-used-meter\provider-secrets.json
%APPDATA%\codex-context-used-meter\ui-config.json
```

## Files

- `provider-config.json`: non-secret provider settings, such as provider name, API URL, endpoint path, secret key names, refresh interval, and quota conversion.
- `provider-secrets.json`: local private token and user ID values only.
- `ui-config.json`: Context and Provider balance color thresholds, plus the Context compaction warning zone.

## provider-config.json

### `codex`

Local Codex App connection settings. The helper uses the CDP debug port opened by Codex++ to push a sanitized Provider summary into the Codex page.

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `debugPort` | number | No | Codex App CDP port. The default is `9229`; change it if Codex++ uses another port. |
| `targetUrlHint` | string | No | Keyword used when selecting the CDP page target. Usually keep `codex`. |

### `providers[]`

Provider list. The UI currently shows the first valid active Provider.

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `id` | string | Yes | Local unique ID. A short English name like `primary` is enough. Do not put secrets here. |
| `displayName` | string | Yes | Provider name shown in the UI. A short provider nickname works well. |
| `baseUrl` | string | Yes | Provider API root, such as `https://example.com`. It must be public HTTPS; do not use localhost, private network URLs, or URLs containing tokens. |
| `endpointPath` | string | Yes | Subscription / balance endpoint path, such as `/api/subscription/self`. The helper joins it with `baseUrl`. |
| `auth.type` | string | Yes | Auth type. Currently `bearer` is supported. |
| `auth.accessTokenSecret` | string | Yes | Key name for the token in `provider-secrets.json`, not the real token. |
| `userHeader.name` | string | No | Extra user ID header name if the provider requires one; leave it empty if not needed. |
| `userHeader.valueSecret` | string | No | Key name for the user ID in `provider-secrets.json`, not the real user ID. |
| `refreshIntervalMs` | number | No | Provider balance refresh interval in milliseconds. The template uses `10000`, meaning 10 seconds. |
| `quota.amountDivisor` | number | Yes | Conversion factor from raw quota to displayed amount. Displayed amount = raw quota / `amountDivisor`. |

The important part: `auth.accessTokenSecret` and `userHeader.valueSecret` are key-name mappings, not sensitive values. Real values only go in `provider-secrets.json`.

## provider-secrets.json

This file only stores local sensitive values. Its keys must match `auth.accessTokenSecret` / `userHeader.valueSecret` from `provider-config.json`.

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `provider_access_token` | string | Depends on provider | Real access token. You may rename this template key, but then update `auth.accessTokenSecret` too. |
| `provider_user_id` | string | Depends on provider | Real user ID or tenant ID. Leave it empty when the provider does not require an extra header. |

Do not commit your local version of this file, paste it into issues, share it, or let an agent echo it back into chat.

## ui-config.json

UI config contains no secrets and can be tuned to your preference.

### `context`

Controls the Context card.

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `compressionWarningLeftPercent` | number | No | Makes the left-side compaction warning zone more visible when remaining Context drops below this percent. Template default: `20`. |
| `levelThresholds.noticeLeftPercent` | number | No | Enters notice color below this remaining percent. Template default: `60`. |
| `levelThresholds.warnLeftPercent` | number | No | Enters warning color below this remaining percent. Template default: `50`. |
| `levelThresholds.dangerLeftPercent` | number | No | Enters danger color below this remaining percent. Template default: `40`. |
| `levelThresholds.criticalLeftPercent` | number | No | Enters critical color below this remaining percent. Template default: `30`. |

### `provider`

Controls the Provider balance card.

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `levelThresholds.noticeLeftPercent` | number | No | Provider balance enters notice color below this remaining percent. Template default: `60`. |
| `levelThresholds.warnLeftPercent` | number | No | Provider balance enters warning color below this remaining percent. Template default: `50`. |
| `levelThresholds.dangerLeftPercent` | number | No | Provider balance enters danger color below this remaining percent. Template default: `40`. |
| `levelThresholds.criticalLeftPercent` | number | No | Provider balance enters critical color below this remaining percent. Template default: `30`. |

Thresholds are based on remaining percent. Lower remaining percent means a more severe state. For example, 38% remaining matches `dangerLeftPercent: 40`, and 28% remaining matches `criticalLeftPercent: 30`.
