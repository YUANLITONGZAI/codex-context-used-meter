# Codebase Concerns

**Analysis Date:** 2026-05-29

## Tech Debt

**Monolithic renderer script:**
- Issue: `codex-context-used-meter.js` contains UI rendering, Codex signal discovery, Provider rendering, spend effects, history charts, and lifecycle management in one file.
- Files: `codex-context-used-meter.js`.
- Impact: Small changes can affect unrelated behavior, and there is no module boundary to test or review in isolation.
- Fix approach: If a build step is introduced, split renderer code into modules for UI, signal discovery, Provider rendering, and history state while keeping the final output as one Codex++ user script.

**No package metadata:**
- Issue: The repository has no `package.json`, so there are no declared Node engine requirements, scripts, or test commands.
- Files: `tools/provider-helper.js`, `tools/provider-supervisor.js`.
- Impact: Helper runtime requirements such as built-in `fetch()` and `WebSocket` are implicit.
- Fix approach: Add package metadata if automated tests or packaging are introduced, and document the minimum Node.js version explicitly.

## Known Bugs

**None documented in tracked issue files:**
- Symptoms: Not applicable.
- Files: `README.md`, `config/README.md`.
- Trigger: Not applicable.
- Workaround: Existing troubleshooting content in `README.md` covers Context visibility, Provider visibility, and stale injected scripts.

## Security Considerations

**Public secrets template must remain placeholder-only:**
- Risk: A user could accidentally commit real Provider credentials into a tracked template file.
- Files: `config/provider-secrets.json`, `.gitignore`, `README.md`, `config/README.md`.
- Current mitigation: Documentation repeatedly states that real token/user ID values belong under `%APPDATA%\codex-context-used-meter`, and `.gitignore` excludes root-level local secret files.
- Recommendations: Add an automated secret scan before release or CI if a CI pipeline is introduced.

**Provider summary must stay sanitized before CDP publication:**
- Risk: Any future change that includes raw Provider responses, headers, tokens, user IDs, or Provider URLs in the summary would expose sensitive data to the renderer page.
- Files: `tools/provider-helper.js`, `codex-context-used-meter.js`.
- Current mitigation: `normalizeSubscription()` creates a reduced summary, and `codex-context-used-meter.js` only renders summary fields.
- Recommendations: Keep `providerSummaryExpression()` inputs limited to sanitized fields and add tests around summary shape.

**CDP target publication executes code in Codex page:**
- Risk: `publishSummaryToCodex()` uses `Runtime.evaluate`; unsafe string construction could become an injection path.
- Files: `tools/provider-helper.js`.
- Current mitigation: `providerSummaryExpression()` embeds summary data through `JSON.stringify()`.
- Recommendations: Keep CDP expressions data-only and avoid interpolating untrusted strings outside JSON serialization.

## Performance Bottlenecks

**Fallback state scans:**
- Problem: React/window fallback scanning can become expensive if Codex internals change and app signal reads stop working.
- Files: `codex-context-used-meter.js`.
- Cause: `findStatusContextUsageObject()`, `findAppSignalScopeInValue()`, and `scanWindowForContextUsage()` traverse nested runtime objects.
- Improvement path: Preserve throttles and limits such as `EXPENSIVE_FALLBACK_INTERVAL_MS`, `REACT_HOST_SCAN_LIMIT`, `APP_SIGNAL_SELECTOR_SCAN_LIMIT`, and `WINDOW_KEY_CACHE_MS`; update app signal selectors before widening fallback scans.

**Large inline CSS and DOM template:**
- Problem: `installStyle()` and `ensureRoot()` keep all UI structure in the same script.
- Files: `codex-context-used-meter.js`.
- Cause: The project ships as a single Codex++ user script without a build step.
- Improvement path: Only introduce modular source files if the release process still produces a single installable `codex-context-used-meter.js`.

## Fragile Areas

**Codex internal state discovery:**
- Files: `codex-context-used-meter.js`.
- Why fragile: The script depends on Codex app signal module names, React private key shapes, DOM attributes, and route conventions.
- Safe modification: Change one discovery path at a time and verify live Codex++ injection after copying to `%APPDATA%\Codex++\user_scripts`.
- Test coverage: No automated browser or DOM tests exist.

**Provider helper runtime assumptions:**
- Files: `tools/provider-helper.js`.
- Why fragile: CDP publication depends on a local debug port, Codex target selection, and Node.js WebSocket availability.
- Safe modification: Preserve `--once --no-cdp --print-summary` as the non-injecting validation path and keep CDP errors classified.
- Test coverage: No automated tests exist for CDP target selection or Provider normalization.

**Windows scheduled-task lifecycle:**
- Files: `tools/install-provider-supervisor.ps1`, `tools/uninstall-provider-supervisor.ps1`, `tools/provider-supervisor.js`.
- Why fragile: It depends on current-user scheduled tasks, `node.exe` on `PATH`, and Windows process command-line inspection.
- Safe modification: Test install and uninstall on Windows, and avoid hardcoding user-specific absolute paths in committed docs.
- Test coverage: No automated PowerShell tests exist.

## Scaling Limits

**Spend history:**
- Current capacity: `SPEND_HISTORY_MAX_ITEMS` limits each in-page history series to 200 points over `SPEND_HISTORY_WINDOW_MS`.
- Limit: Very long sessions retain only the latest bounded in-memory history.
- Scaling path: Keep bounded history for renderer performance; persist only if there is a clear product requirement.

**Provider polling:**
- Current capacity: refresh interval defaults to `DEFAULT_PROVIDER_REFRESH_INTERVAL_MS` in `tools/provider-helper.js`.
- Limit: Very short intervals can increase Provider API and CDP traffic.
- Scaling path: Keep per-provider `refreshIntervalMs` bounded and consider backoff after repeated Provider errors.

## Dependencies at Risk

**Codex private renderer internals:**
- Risk: Codex DOM attributes, React private fields, or app signal asset names can change without notice.
- Impact: Context readings may disappear or fall back to slower scans.
- Migration plan: Prefer updating app signal discovery and DOM anchors in `codex-context-used-meter.js` before adding broad scans.

**Node.js global WebSocket:**
- Risk: Some Node.js versions do not expose a global `WebSocket`.
- Impact: `tools/provider-helper.js` cannot publish Provider summaries over CDP, although `--no-cdp` validation can still run.
- Migration plan: Declare a minimum Node.js version or add a small explicit WebSocket dependency if package metadata is introduced.

## Missing Critical Features

**Automated verification:**
- Problem: There is no automated test suite, lint check, or CI pipeline.
- Blocks: Safe refactoring of `codex-context-used-meter.js`, helper security hardening, and compatibility checks across Codex UI changes.

**Runtime version declaration:**
- Problem: Node.js and PowerShell requirements are documented implicitly through code and README commands.
- Blocks: Predictable Provider helper installation on machines with older Node runtimes.

## Test Coverage Gaps

**Provider normalization and URL safety:**
- What's not tested: `normalizeSubscription()`, `isSafeProviderUrl()`, `buildProviderUrl()`, and `buildProviderHeaders()`.
- Files: `tools/provider-helper.js`.
- Risk: Provider response changes or URL validation regressions could break optional balance display.
- Priority: High.

**Renderer context detection:**
- What's not tested: `detectReading()`, conversation ID retention, app signal fallback, and spend dedupe behavior.
- Files: `codex-context-used-meter.js`.
- Risk: Codex UI changes could silently break readings.
- Priority: High.

**Supervisor lifecycle:**
- What's not tested: single-instance pipe behavior, helper restart/stop timing, and scheduled-task install/uninstall behavior.
- Files: `tools/provider-supervisor.js`, `tools/install-provider-supervisor.ps1`, `tools/uninstall-provider-supervisor.ps1`.
- Risk: Helper processes could fail to start, fail to stop, or leave stale logs/processes.
- Priority: Medium.

---

*Concerns audit: 2026-05-29*
