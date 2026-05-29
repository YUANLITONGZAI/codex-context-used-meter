# Technology Stack

**Analysis Date:** 2026-05-29

## Languages

**Primary:**
- JavaScript - Browser user script in `codex-context-used-meter.js`; local Node.js helpers in `tools/provider-helper.js` and `tools/provider-supervisor.js`.

**Secondary:**
- PowerShell - Windows scheduled-task install and uninstall scripts in `tools/install-provider-supervisor.ps1` and `tools/uninstall-provider-supervisor.ps1`.
- Markdown - User-facing and agent-facing documentation in `README.md`, `AGENTS.md`, and `config/README.md`.
- JSON - Public configuration templates in `config/provider-config.json`, `config/provider-secrets.json`, and `config/ui-config.json`.

## Runtime

**Environment:**
- Codex renderer page injected through Codex++ for `codex-context-used-meter.js`.
- Node.js for `tools/provider-helper.js` and `tools/provider-supervisor.js`; no pinned runtime version is declared in the repository.
- Windows PowerShell for supervisor installation and removal.

**Package Manager:**
- Not detected.
- Lockfile: missing.
- No `package.json`, `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` is present.

## Frameworks

**Core:**
- Direct browser DOM APIs - UI creation, mounting, drag/resize interaction, mutation observation, and SVG chart rendering in `codex-context-used-meter.js`.
- Node.js core modules - `fs`, `path`, `net`, and `child_process` are used by `tools/provider-helper.js` and `tools/provider-supervisor.js`.
- Chrome DevTools Protocol over WebSocket - Provider summaries are injected by `tools/provider-helper.js` via `Runtime.evaluate`.

**Testing:**
- Not detected.
- No Jest, Vitest, Playwright, or other test framework configuration exists in the repository.

**Build/Dev:**
- Not detected.
- The shipped source is plain JavaScript and PowerShell; there is no bundler, transpiler, minifier, or build command in the repository.

## Key Dependencies

**Critical:**
- Codex++ user script injection - `README.md` and `AGENTS.md` define the install target as `%APPDATA%\Codex++\user_scripts\codex-context-used-meter.js`.
- Codex renderer runtime signals - `codex-context-used-meter.js` reads app signal modules, React private keys, and structured runtime objects to detect context usage.
- Node.js built-in `fetch` and `WebSocket` - `tools/provider-helper.js` uses `fetch()` for Provider API calls and requires `WebSocket` for CDP publishing.

**Infrastructure:**
- Windows Scheduled Tasks - `tools/install-provider-supervisor.ps1` registers `CodexContextMeterProviderSupervisor`.
- Windows process inspection - `tools/provider-helper.js` and `tools/provider-supervisor.js` use PowerShell/CIM queries to detect `Codex.exe` and remote-debugging ports.
- Local filesystem config - Runtime Provider and UI config lives under `%APPDATA%\codex-context-used-meter`, with repo files under `config/` kept as templates.

## Configuration

**Environment:**
- `CCM_PROVIDER_CONFIG` overrides the default Provider config path used by `tools/provider-helper.js`.
- `CCM_PROVIDER_SECRETS` overrides the default Provider secrets path used by `tools/provider-helper.js`.
- `CCM_UI_CONFIG` overrides the default UI config path used by `tools/provider-helper.js`.
- `CCM_CODEX_DEBUG_PORT` overrides the CDP debug port used by `tools/provider-helper.js`.

**Build:**
- No build configuration files are present.
- UI defaults are embedded in `codex-context-used-meter.js` and mirrored for the helper in `tools/provider-helper.js`.

## Platform Requirements

**Development:**
- Windows is the primary supported platform for the supervisor scripts in `tools/`.
- Codex++ must be installed and enabled before `codex-context-used-meter.js` can affect Codex.
- Node.js must be available on `PATH` for Provider helper and supervisor functionality.

**Production:**
- The production artifact for the UI is the single user script `codex-context-used-meter.js`.
- The optional Provider runtime is `tools/provider-helper.js`, optionally managed by `tools/provider-supervisor.js`.
- Runtime configuration should be copied to `%APPDATA%\codex-context-used-meter`, not edited in the repository templates.

---

*Stack analysis: 2026-05-29*
