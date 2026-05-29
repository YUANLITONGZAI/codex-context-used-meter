# External Integrations

**Analysis Date:** 2026-05-29

## APIs & External Services

**Codex App / Codex++:**
- Codex++ user script injection - `codex-context-used-meter.js` is copied to `%APPDATA%\Codex++\user_scripts\codex-context-used-meter.js`.
  - SDK/Client: direct browser runtime APIs.
  - Auth: not applicable in the user script.
- Codex renderer app state - `codex-context-used-meter.js` reads app signal modules, React private keys, DOM attributes, and structured window state.
  - SDK/Client: dynamic `import()` for loaded Codex asset URLs discovered by `findLoadedAssetUrl()`.
  - Auth: not applicable.

**Provider quota APIs:**
- Optional HTTPS Provider subscription/balance endpoint - `tools/provider-helper.js` calls a configured Provider endpoint and normalizes quota data.
  - SDK/Client: built-in `fetch()`.
  - Auth: bearer token value is read from the runtime secrets file, not from the renderer page.
- CDP publishing into Codex - `tools/provider-helper.js` locates Codex CDP targets and evaluates a sanitized Provider summary in the page.
  - SDK/Client: DevTools `/json` endpoint plus WebSocket `Runtime.evaluate`.
  - Auth: local debug-port access only.

## Data Storage

**Databases:**
- Not detected.
  - Connection: not applicable.
  - Client: not applicable.

**File Storage:**
- Runtime config directory: `%APPDATA%\codex-context-used-meter`.
- Public templates: `config/provider-config.json`, `config/provider-secrets.json`, and `config/ui-config.json`.
- Supervisor log: `tools/provider-supervisor.js` writes `provider-supervisor.log` under the runtime config directory.

**Caching:**
- Browser `localStorage` stores UI placement, theme, floating layout, position, and scale from `codex-context-used-meter.js`.
- In-memory caches in `codex-context-used-meter.js` store conversation readings, React private keys, app signal selectors, scan timestamps, and spend history for the current page lifetime.

## Authentication & Identity

**Auth Provider:**
- Provider APIs use bearer token authentication when configured in `provider-config.json`.
  - Implementation: `tools/provider-helper.js` maps secret field names from Provider config to values in the runtime secrets file.
- Optional Provider user identity header is supported by `tools/provider-helper.js`.
  - Implementation: `buildProviderHeaders()` adds the configured header only when a runtime secret value exists.
- The renderer user script never reads Provider tokens, user IDs, request headers, or raw Provider responses.

## Monitoring & Observability

**Error Tracking:**
- Not detected.

**Logs:**
- `tools/provider-helper.js` writes sanitized status/error messages to stdout/stderr.
- `tools/provider-supervisor.js` writes a rotating local log capped by `MAX_LOG_BYTES`.
- `codex-context-used-meter.js` does not use console logging for normal operation.

## CI/CD & Deployment

**Hosting:**
- Not applicable. The UI is deployed by copying `codex-context-used-meter.js` into the Codex++ user script directory.
- Optional supervisor deployment is local Windows scheduled task installation through `tools/install-provider-supervisor.ps1`.

**CI Pipeline:**
- None detected.

## Environment Configuration

**Required env vars:**
- None required for the base Context meter.
- Optional Provider helper overrides: `CCM_PROVIDER_CONFIG`, `CCM_PROVIDER_SECRETS`, `CCM_UI_CONFIG`, and `CCM_CODEX_DEBUG_PORT`.

**Secrets location:**
- Runtime secrets belong under `%APPDATA%\codex-context-used-meter`.
- Repository secret templates under `config/` must remain template-only and must not contain real credentials.

## Webhooks & Callbacks

**Incoming:**
- None detected.

**Outgoing:**
- Optional outgoing HTTPS request from `tools/provider-helper.js` to the configured Provider endpoint.
- Optional outgoing CDP WebSocket connection from `tools/provider-helper.js` to the local Codex debug target.

---

*Integration audit: 2026-05-29*
