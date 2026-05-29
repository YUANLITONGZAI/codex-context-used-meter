# Coding Conventions

**Analysis Date:** 2026-05-29

## Naming Patterns

**Files:**
- Use lower-case kebab case for scripts and tools: `codex-context-used-meter.js`, `tools/provider-helper.js`, and `tools/provider-supervisor.js`.
- Use conventional root documentation names: `README.md`, `AGENTS.md`, and `LICENSE`.
- Use explicit template names under `config/`: `provider-config.json`, `provider-secrets.json`, and `ui-config.json`.

**Functions:**
- Use camelCase for JavaScript functions: `ensureRoot()`, `detectReading()`, `normalizeSubscription()`, and `publishSummaryToCodex()`.
- Use small single-purpose helper functions for normalization, clamping, parsing, and DOM lookup in `codex-context-used-meter.js`.

**Variables:**
- Use `const` for stable configuration and `let` for mutable process state.
- Use upper snake case for constants: `SCRIPT_VERSION`, `UPDATE_INTERVAL_MS`, `REQUEST_TIMEOUT_MS`, and `MAX_LOG_BYTES`.
- Use a single module-level `state` object for renderer mutable state in `codex-context-used-meter.js`.

**Types:**
- No TypeScript types are present.
- Plain JavaScript objects carry implicit shapes such as readings, Provider summaries, UI state, and supervisor state.

## Code Style

**Formatting:**
- JavaScript uses two-space indentation, semicolons, double quotes for string literals, and trailing commas in multiline object/array literals where already present.
- PowerShell uses `$ErrorActionPreference = "Stop"` and UTF-8 console/native pipe setup at the top of both scripts in `tools/`.

**Linting:**
- No lint configuration is present.
- No `package.json` scripts exist for linting or formatting.

## Import Organization

**Order:**
1. Node core `require()` calls at the top of Node scripts, as in `tools/provider-helper.js` and `tools/provider-supervisor.js`.
2. Constants immediately after imports.
3. Module-level mutable state after constants.
4. Helper functions grouped by responsibility.
5. Entry-point `main()` and `module.exports` at the bottom where applicable.

**Path Aliases:**
- None detected.

## Error Handling

**Patterns:**
- Renderer code catches unstable DOM/React/app-state access and returns `null` or falls back to a safer path in `codex-context-used-meter.js`.
- Provider helper wraps domain failures with coded errors through `providerError()` and `classifyProviderError()` in `tools/provider-helper.js`.
- Provider supervisor logs recoverable failures and continues polling in `tools/provider-supervisor.js`.
- PowerShell scripts set `$ErrorActionPreference = "Stop"` and use `-ErrorAction SilentlyContinue` only around cleanup and optional resources.

## Logging

**Framework:** console and local file append.

**Patterns:**
- `tools/provider-helper.js` uses `console.log()` for one-shot/verbose summaries and `console.error()` for failures.
- `tools/provider-supervisor.js` writes timestamped log lines to the runtime config directory and rotates at `MAX_LOG_BYTES`.
- `codex-context-used-meter.js` avoids console output during normal renderer operation.

## Comments

**When to Comment:**
- Use comments for fragile Codex internals, browser/runtime constraints, and performance-sensitive fallback behavior.
- Existing comments in `codex-context-used-meter.js` explain why React private keys, app signal discovery, and fallback scans are constrained.

**JSDoc/TSDoc:**
- Not used.

## Function Design

**Size:** Keep new helper functions focused; large feature code should still be split into named helpers inside the same file rather than added as anonymous blocks.

**Parameters:** Pass plain values and objects; existing code avoids class instances and custom prototypes.

**Return Values:** Prefer `null` for unavailable optional readings in renderer helpers and structured status objects for Provider helper failures.

## Module Design

**Exports:**
- `codex-context-used-meter.js` exposes only the page API at `window.__codexContextMeter`.
- `tools/provider-helper.js` exports selected pure or semi-pure helpers through `module.exports`.
- `tools/provider-supervisor.js` is a process entry point and does not export an API.

**Barrel Files:**
- Not used.

---

*Convention analysis: 2026-05-29*
