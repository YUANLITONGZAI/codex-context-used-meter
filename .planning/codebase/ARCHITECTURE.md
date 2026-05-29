<!-- refreshed: 2026-05-29 -->
# Architecture

**Analysis Date:** 2026-05-29

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                   Codex Renderer User Script                 │
├──────────────────┬──────────────────┬───────────────────────┤
│ Context meter UI │ Signal discovery │ Provider meter UI      │
│ `codex-context-` │ `codex-context-` │ `codex-context-`       │
│ `used-meter.js`  │ `used-meter.js`  │ `used-meter.js`        │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│             Codex page state and sanitized summary bridge    │
│             `window.__codexContextMeter*`                    │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ CDP Runtime.evaluate
┌────────┴────────────────────────────────────────────────────┐
│ Provider helper and supervisor                               │
│ `tools/provider-helper.js`, `tools/provider-supervisor.js`    │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| User script bootstrap | Installs a singleton, removes legacy instances, creates the public page API, and starts updates. | `codex-context-used-meter.js` |
| UI infrastructure | Injects CSS, creates the Context/Provider cards, mounts inline or floating, and manages right-click controls. | `codex-context-used-meter.js` |
| Context signal reader | Finds active conversation ID and reads context usage from app signals, React private state, or window state. | `codex-context-used-meter.js` |
| Spend history renderer | Tracks current-session Context and Provider deltas and renders SVG history charts. | `codex-context-used-meter.js` |
| Provider helper | Loads runtime config, fetches Provider quota, normalizes a sanitized summary, and publishes it to Codex via CDP. | `tools/provider-helper.js` |
| Provider supervisor | Starts the helper only while `Codex.exe` exposes a remote-debugging port and stops it after Codex exits. | `tools/provider-supervisor.js` |
| Scheduled-task scripts | Install or remove the Windows scheduled task for the supervisor. | `tools/install-provider-supervisor.ps1`, `tools/uninstall-provider-supervisor.ps1` |

## Pattern Overview

**Overall:** Self-contained browser IIFE with an optional local helper process.

**Key Characteristics:**
- The renderer script owns all UI state in one `state` object in `codex-context-used-meter.js`.
- Provider secrets stay outside the renderer and are handled only by `tools/provider-helper.js`.
- Runtime config is local and user-specific; repository files in `config/` are templates.
- No package manager, build step, framework runtime, or external npm dependency is required by the repository.

## Layers

**Injected UI Layer:**
- Purpose: render the meter and interactions inside the Codex page.
- Location: `codex-context-used-meter.js`.
- Contains: CSS injection, DOM creation, inline/floating placement, context menu, drag/scale handling, and history chart rendering.
- Depends on: browser DOM, `localStorage`, `MutationObserver`, and Codex page structure.
- Used by: Codex++ injection runtime.

**Context Discovery Layer:**
- Purpose: discover the active conversation and current token usage.
- Location: `codex-context-used-meter.js`.
- Contains: `readActiveConversationId()`, `scanAppSignalContextUsage()`, `scanStatusReactContextUsage()`, `scanWindowForContextUsage()`, and `detectReading()`.
- Depends on: React private keys, structured app state, dynamically imported app signal modules, and DOM attributes.
- Used by: `updateMeter()`.

**Provider Bridge Layer:**
- Purpose: accept sanitized Provider summaries from the helper and render Provider balance.
- Location: `codex-context-used-meter.js`.
- Contains: `setProviderSummary()`, `installProviderSummaryListener()`, `renderProviderMeter()`, and Provider spend tracking.
- Depends on: `window.__codexContextMeterProviderSummary` and the `codex-context-meter-provider-summary` event.
- Used by: `tools/provider-helper.js` through CDP evaluation.

**Local Provider Runtime:**
- Purpose: fetch Provider data without exposing credentials to the renderer.
- Location: `tools/provider-helper.js`.
- Contains: config loading, safe URL validation, request header construction, response normalization, CDP target selection, and publishing.
- Depends on: Node.js core modules, built-in `fetch()`, and WebSocket support.
- Used by: direct CLI runs and `tools/provider-supervisor.js`.

**Supervisor Runtime:**
- Purpose: keep the Provider helper aligned with Codex process lifetime.
- Location: `tools/provider-supervisor.js`.
- Contains: single-instance pipe, Codex readiness polling, helper spawn/stop logic, restart delay, and log rotation.
- Depends on: Windows process inspection and Node.js child processes.
- Used by: `tools/install-provider-supervisor.ps1`.

## Data Flow

### Context Usage Path

1. Codex++ injects `codex-context-used-meter.js`; the IIFE creates `window.__codexContextMeter` and calls `updateMeter()` (`codex-context-used-meter.js`).
2. `updateMeter()` ensures styles/root DOM exist, then calls `detectReading()` (`codex-context-used-meter.js`).
3. `detectReading()` reads the active conversation and tries app signal, React state, and window-state sources in that order (`codex-context-used-meter.js`).
4. A successful reading is cached per conversation, rendered into the Context card, and optionally recorded as a spend event (`codex-context-used-meter.js`).

### Provider Balance Path

1. `tools/provider-supervisor.js` detects `Codex.exe` with a remote-debugging port and starts `tools/provider-helper.js`.
2. `tools/provider-helper.js` loads runtime config and secrets from `%APPDATA%\codex-context-used-meter`.
3. `fetchProvider()` calls the configured HTTPS endpoint and `normalizeSubscription()` converts the response into a sanitized summary.
4. `publishSummaryToCodex()` sends a CDP `Runtime.evaluate` expression that calls `window.__codexContextMeter.setProviderSummary()`.
5. `renderProviderMeter()` displays the active Provider summary and records Provider spend deltas in the page.

**State Management:**
- Renderer state is a single module-local object named `state` in `codex-context-used-meter.js`.
- Helper state is created by `createState()` in `tools/provider-helper.js` and holds config, secrets, UI config, and the in-flight fetch promise.
- Supervisor state uses module-level variables in `tools/provider-supervisor.js` for the child process, timers, and shutdown state.

## Key Abstractions

**Reading object:**
- Purpose: normalized context usage value with percent, token counts, source, and conversation ID.
- Examples: `makeReading()`, `withConversationId()`, `rememberReading()` in `codex-context-used-meter.js`.
- Pattern: small plain object normalized before rendering.

**Provider summary:**
- Purpose: sanitized Provider quota payload safe for renderer use.
- Examples: `normalizeSubscription()`, `getSummary()`, and `providerSummaryExpression()` in `tools/provider-helper.js`.
- Pattern: raw Provider response is reduced to display fields before CDP publication.

**UI config:**
- Purpose: normalize display mode and level thresholds for Context and Provider cards.
- Examples: `normalizeUiConfig()` in `codex-context-used-meter.js` and `tools/provider-helper.js`.
- Pattern: defaults plus numeric clamping.

**Mount descriptor:**
- Purpose: describes where the meter should be inserted in the Codex composer UI.
- Examples: `findInlineMount()` and `mountRoot()` in `codex-context-used-meter.js`.
- Pattern: `{ parent, before }` object with cached validation.

## Entry Points

**User script injection:**
- Location: `codex-context-used-meter.js`.
- Triggers: Codex++ loading the script from `%APPDATA%\Codex++\user_scripts`.
- Responsibilities: singleton install, UI setup, Provider listener registration, initial update, and page API exposure.

**Provider helper CLI:**
- Location: `tools/provider-helper.js`.
- Triggers: `node .\tools\provider-helper.js`, optional `--once`, `--no-cdp`, `--print-summary`, and `--verbose` flags.
- Responsibilities: config loading, Provider fetch, summary normalization, and optional CDP publishing.

**Provider supervisor:**
- Location: `tools/provider-supervisor.js`.
- Triggers: Windows scheduled task created by `tools/install-provider-supervisor.ps1`.
- Responsibilities: detect Codex, start/stop helper, enforce single instance, and write local logs.

## Architectural Constraints

- **Threading:** All renderer behavior runs on the browser main thread in `codex-context-used-meter.js`; helper and supervisor run as separate Node.js processes.
- **Global state:** Renderer globals are limited to `window.__codexContextMeter*` keys in `codex-context-used-meter.js`.
- **Circular imports:** Not applicable; there are no module imports in the renderer script and no local module graph between helper files.
- **Codex internals:** `codex-context-used-meter.js` intentionally depends on Codex DOM attributes, React private keys, and app asset module names.
- **Platform:** Supervisor installation and process detection are Windows-specific in `tools/*.ps1` and `tools/provider-supervisor.js`.

## Anti-Patterns

### Reading Provider secrets in the renderer

**What happens:** Placing token or user ID access in `codex-context-used-meter.js` would expose secrets to the page.
**Why it's wrong:** The documented security boundary in `README.md` and `config/README.md` requires real credentials to stay in the local helper process.
**Do this instead:** Keep secret reads in `tools/provider-helper.js` and publish only sanitized summary fields through `setProviderSummary()`.

### Hardcoding Codex asset hashes as the only app signal path

**What happens:** Depending only on fallback asset filenames would break when Codex changes hashed bundle names.
**Why it's wrong:** `codex-context-used-meter.js` already searches loaded scripts, links, and performance resources in `findLoadedAssetUrl()`.
**Do this instead:** Preserve the loaded-resource discovery path and update fallback names only when Codex changes asset layout.

### Treating fallback scans as the primary data source

**What happens:** Always walking React/window state would make the script heavier and more fragile.
**Why it's wrong:** `detectReading()` prioritizes app signals and only runs expensive fallback scans inside throttled windows.
**Do this instead:** Use app signal reads first and keep fallback limits such as `EXPENSIVE_FALLBACK_INTERVAL_MS`, `REACT_HOST_SCAN_LIMIT`, and `WINDOW_KEY_CACHE_MS`.

## Error Handling

**Strategy:** Renderer failures generally degrade to hidden UI or cached readings; helper failures become sanitized status objects or process exit codes.

**Patterns:**
- UI read failures return `null` and let `updateMeter()` hide the relevant card in `codex-context-used-meter.js`.
- Provider request failures are classified by `classifyProviderError()` in `tools/provider-helper.js`.
- Supervisor failures are logged to the runtime log path in `tools/provider-supervisor.js`.

## Cross-Cutting Concerns

**Logging:** Renderer logging is intentionally absent; helper uses stdout/stderr; supervisor uses a local rotating log.
**Validation:** Provider URLs are constrained by `isSafeProviderUrl()` in `tools/provider-helper.js`; UI numeric inputs are clamped by `normalizeUiConfig()`.
**Authentication:** Only `tools/provider-helper.js` builds Provider auth headers from runtime secret values.

---

*Architecture analysis: 2026-05-29*
