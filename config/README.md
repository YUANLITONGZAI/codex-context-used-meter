# Config Templates

这个目录只放公开模板。真实运行配置建议放在：

```text
%APPDATA%\codex-context-used-meter\
```

不要把真实 token、用户 ID、服务商地址、完整私有配置或原始 Provider 响应写进仓库、issue、聊天或日志。

## 快速复制模板

```powershell
New-Item -ItemType Directory -Force "$env:APPDATA\codex-context-used-meter"
Copy-Item ".\config\provider-config.json" "$env:APPDATA\codex-context-used-meter\provider-config.json" -Force
Copy-Item ".\config\provider-secrets.json" "$env:APPDATA\codex-context-used-meter\provider-secrets.json" -Force
Copy-Item ".\config\ui-config.json" "$env:APPDATA\codex-context-used-meter\ui-config.json" -Force
```

## 文件分工

- `provider-config.json`：非密钥 Provider 配置，例如显示名、API 地址、接口路径、密钥字段名、刷新间隔、额度换算。
- `provider-secrets.json`：本机私密值，例如真实 token、真实用户 ID。
- `ui-config.json`：UI 显示配置，例如 Context 显示剩余还是已用、压缩预警区宽度、颜色阈值。

用户脚本只读取 UI 配置和 helper 写入页面的脱敏 Provider summary。真实密钥只应由本机 helper 读取。

## provider-config.json

### `codex`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `debugPort` | number | 是 | Codex++ 打开的 CDP 调试端口。 |
| `targetUrlHint` | string | 否 | 用于在 CDP targets 中识别 Codex 页面；默认模板使用通用占位值。 |

### `providers[]`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | 是 | 本机 provider 标识。不要填密钥。 |
| `displayName` | string | 是 | 界面上显示的 Provider 名称，建议简短。 |
| `baseUrl` | string | 是 | Provider API Base URL。公开仓库模板应保持空值。 |
| `endpointPath` | string | 是 | 订阅 / 余额接口路径。 |
| `auth.type` | string | 是 | 当前模板支持 `bearer`。 |
| `auth.accessTokenSecret` | string | 是 | token 在 `provider-secrets.json` 里的字段名，不是真实 token。 |
| `userHeader.name` | string | 否 | 服务商要求的额外用户 ID header 名；不需要就留空。 |
| `userHeader.valueSecret` | string | 否 | 用户 ID 在 `provider-secrets.json` 里的字段名，不是真实用户 ID。 |
| `refreshIntervalMs` | number | 否 | 刷新周期，默认 10000。 |
| `quota.amountDivisor` | number | 否 | Provider 原始额度与显示金额之间的换算因子，默认 500000。 |

关键点：`auth.accessTokenSecret` 和 `userHeader.valueSecret` 是字段名映射，不是敏感值本身。真实值只写进 `provider-secrets.json`。

## provider-secrets.json

这个文件只放本机敏感值。字段名要和 `provider-config.json` 里的 `auth.accessTokenSecret` / `userHeader.valueSecret` 对上。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `provider_access_token` | string | 取决于 Provider | 真实访问 token。模板里的字段名可以改，但要同步改 `auth.accessTokenSecret`。 |
| `provider_user_id` | string | 取决于 Provider | 真实用户 ID 或租户 ID。服务商不要求额外 header 时可以留空。 |

仓库模板必须保持空字符串。不要提交本机填好的 `provider-secrets.json`。

## ui-config.json

这个文件只控制显示方式，不存储密钥。

### `context`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `showUsedInsteadOfLeft` | boolean | 否 | 是否用已用百分比替代剩余百分比。`false` 显示 `Context Left`，`true` 显示 `Context Used`。模板默认 `false`。 |
| `compressionWarningLeftPercent` | number | 否 | Context 条最左侧压缩预警斜线区域宽度，按百分比填写。模板默认 20。 |
| `levelThresholds.noticeLeftPercent` | number | 否 | 剩余百分比小于等于该值时进入 notice。 |
| `levelThresholds.warnLeftPercent` | number | 否 | 剩余百分比小于等于该值时进入 warn。 |
| `levelThresholds.dangerLeftPercent` | number | 否 | 剩余百分比小于等于该值时进入 danger。 |
| `levelThresholds.criticalLeftPercent` | number | 否 | 剩余百分比小于等于该值时进入 critical。 |

### `provider`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `levelThresholds.noticeLeftPercent` | number | 否 | Provider 剩余额度百分比小于等于该值时进入 notice。 |
| `levelThresholds.warnLeftPercent` | number | 否 | Provider 剩余额度百分比小于等于该值时进入 warn。 |
| `levelThresholds.dangerLeftPercent` | number | 否 | Provider 剩余额度百分比小于等于该值时进入 danger。 |
| `levelThresholds.criticalLeftPercent` | number | 否 | Provider 剩余额度百分比小于等于该值时进入 critical。 |

阈值都按「剩余百分比」计算。默认分档是：60% notice，50% warn，40% danger，30% critical。

## 右键菜单和本地状态

以下交互状态保存在 Codex 页面本地 `localStorage`，不会写入 `ui-config.json`：

- inline / floating 模式。
- floating 模式下的 horizontal / vertical 布局。
- floating 模式下的位置。
- floating 模式下的缩放。

`ui-config.json` 只用于跨注入、跨 helper 的显示配置；用户临时拖动和右键选择不写 JSON。

## Provider helper 数据边界

helper 可以读取：

- `%APPDATA%\codex-context-used-meter\provider-config.json`
- `%APPDATA%\codex-context-used-meter\provider-secrets.json`
- `%APPDATA%\codex-context-used-meter\ui-config.json`

helper 写入 Codex 页面的是脱敏 summary。summary 只应包含用于渲染的信息，例如 provider id、显示名、状态、已用额度、总额度、剩余额度、过期时间和 UI 配置。真实 token、用户 ID、服务商地址、请求 headers 和原始响应不应进入页面。

## 验证命令

只验证配置读取、Provider 请求和响应解析，不注入 Codex 页面：

```powershell
node .\tools\provider-helper.js --once --no-cdp --print-summary
```

验证时只展示脱敏摘要，例如：

- helper 是否成功加载配置。
- Provider 是否 active。
- 必要字段是否存在。
- HTTP 状态是否正常。

不要展示真实 token、用户 ID、真实服务商地址、完整 headers、完整配置文件或原始响应体。

---

# Config Templates

This directory contains public templates only. Runtime config should usually live at:

```text
%APPDATA%\codex-context-used-meter\
```

Do not put real tokens, user IDs, provider endpoints, full private config, or raw Provider responses into the repository, issues, chat, or logs.

## Copy Templates

```powershell
New-Item -ItemType Directory -Force "$env:APPDATA\codex-context-used-meter"
Copy-Item ".\config\provider-config.json" "$env:APPDATA\codex-context-used-meter\provider-config.json" -Force
Copy-Item ".\config\provider-secrets.json" "$env:APPDATA\codex-context-used-meter\provider-secrets.json" -Force
Copy-Item ".\config\ui-config.json" "$env:APPDATA\codex-context-used-meter\ui-config.json" -Force
```

## Files

- `provider-config.json`: non-secret Provider settings such as display name, API URL, endpoint path, secret key names, refresh interval, and quota conversion.
- `provider-secrets.json`: local private values such as the real token and real user ID.
- `ui-config.json`: UI display settings such as remaining vs used context display, compaction warning width, and color thresholds.

The user script only reads UI config and sanitized Provider summaries written into the page by the helper. Real secrets should only be read by the local helper.

## provider-config.json

### `codex`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `debugPort` | number | Yes | CDP debug port opened by Codex++. |
| `targetUrlHint` | string | No | Hint used to identify the Codex page among CDP targets. |

### `providers[]`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Local provider identifier. Do not put secrets here. |
| `displayName` | string | Yes | Provider name shown in the UI. Keep it short. |
| `baseUrl` | string | Yes | Provider API base URL. Public templates should keep this empty. |
| `endpointPath` | string | Yes | Subscription / balance endpoint path. |
| `auth.type` | string | Yes | The template currently supports `bearer`. |
| `auth.accessTokenSecret` | string | Yes | Key name for the token in `provider-secrets.json`, not the real token. |
| `userHeader.name` | string | No | Extra user ID header name if required by the provider. |
| `userHeader.valueSecret` | string | No | Key name for the user ID in `provider-secrets.json`, not the real user ID. |
| `refreshIntervalMs` | number | No | Refresh interval. Default: 10000. |
| `quota.amountDivisor` | number | No | Conversion factor between provider raw quota and displayed amount. Default: 500000. |

The important part: `auth.accessTokenSecret` and `userHeader.valueSecret` are key-name mappings, not sensitive values. Real values only go in `provider-secrets.json`.

## provider-secrets.json

This file stores local sensitive values only. Its keys must match `auth.accessTokenSecret` / `userHeader.valueSecret` from `provider-config.json`.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `provider_access_token` | string | Depends on provider | Real access token. You may rename this template key, but then update `auth.accessTokenSecret` too. |
| `provider_user_id` | string | Depends on provider | Real user ID or tenant ID. Leave it empty when the provider does not require an extra header. |

The repository template must keep empty strings. Do not commit your filled `provider-secrets.json`.

## ui-config.json

This file controls display behavior only. It does not store secrets.

### `context`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `showUsedInsteadOfLeft` | boolean | No | Whether to show used percentage instead of remaining percentage. `false` shows `Context Left`; `true` shows `Context Used`. Template default: `false`. |
| `compressionWarningLeftPercent` | number | No | Width of the left-side compaction warning stripe zone, in percent. Template default: 20. |
| `levelThresholds.noticeLeftPercent` | number | No | Enters notice when remaining percentage is less than or equal to this value. |
| `levelThresholds.warnLeftPercent` | number | No | Enters warn when remaining percentage is less than or equal to this value. |
| `levelThresholds.dangerLeftPercent` | number | No | Enters danger when remaining percentage is less than or equal to this value. |
| `levelThresholds.criticalLeftPercent` | number | No | Enters critical when remaining percentage is less than or equal to this value. |

### `provider`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `levelThresholds.noticeLeftPercent` | number | No | Provider balance enters notice when remaining percentage is less than or equal to this value. |
| `levelThresholds.warnLeftPercent` | number | No | Provider balance enters warn when remaining percentage is less than or equal to this value. |
| `levelThresholds.dangerLeftPercent` | number | No | Provider balance enters danger when remaining percentage is less than or equal to this value. |
| `levelThresholds.criticalLeftPercent` | number | No | Provider balance enters critical when remaining percentage is less than or equal to this value. |

Thresholds are based on remaining percentage. Defaults: 60% notice, 50% warn, 40% danger, 30% critical.

## Right-Click Menu and Local State

The following interaction state is stored in Codex page `localStorage`, not in `ui-config.json`:

- inline / floating mode.
- horizontal / vertical layout in floating mode.
- floating position.
- floating scale.

`ui-config.json` is for persistent display configuration across script injections and helper updates. Temporary dragging and right-click selections do not write JSON.

## Provider Helper Data Boundary

The helper can read:

- `%APPDATA%\codex-context-used-meter\provider-config.json`
- `%APPDATA%\codex-context-used-meter\provider-secrets.json`
- `%APPDATA%\codex-context-used-meter\ui-config.json`

The helper writes a sanitized summary into the Codex page. The summary should contain only rendering data, such as provider id, display name, status, used amount, total amount, remaining amount, expiry, and UI config. Real tokens, user IDs, provider endpoints, request headers, and raw responses should not enter the page.

## Verification Command

Validate config loading, Provider fetching, and response parsing without injecting into Codex:

```powershell
node .\tools\provider-helper.js --once --no-cdp --print-summary
```

Only show sanitized verification results, such as:

- whether the helper loaded config successfully.
- whether a Provider is active.
- whether required fields exist.
- whether HTTP status is healthy.

Do not show real tokens, user IDs, provider endpoints, full headers, full config files, or raw response bodies.
