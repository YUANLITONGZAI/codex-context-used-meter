# Codebase Structure

**Analysis Date:** 2026-05-29

## Directory Layout

```text
codex-context-used-meter/
├── assets/                         # README media and UI screenshots
├── config/                         # Public config templates and config docs
├── local/                          # Ignored local workspace/runtime area
├── tools/                          # Optional Provider helper, supervisor, and Windows task scripts
├── AGENTS.md                       # Repository-specific agent/install contract
├── README.md                       # Bilingual user and agent documentation
├── codex-context-used-meter.js     # Codex++ user script artifact
├── LICENSE                         # MIT license
└── .gitignore                      # Local config and secret exclusion rules
```

## Directory Purposes

**Root:**
- Purpose: keep the installable user script and primary project docs at the top level.
- Contains: `codex-context-used-meter.js`, `README.md`, `AGENTS.md`, `LICENSE`, and `.gitignore`.
- Key files: `codex-context-used-meter.js`, `README.md`, `AGENTS.md`.

**`assets/`:**
- Purpose: store visual documentation assets used by `README.md`.
- Contains: screenshots, GIF demo, and MP4 demo.
- Key files: `assets/codex-context-meter-demo.gif`, `assets/floating-status-bar.png`, `assets/session-spend-history.png`.

**`config/`:**
- Purpose: store public templates and documentation for optional runtime config.
- Contains: Provider config template, Provider secrets template, UI config template, and bilingual config docs.
- Key files: `config/provider-config.json`, `config/provider-secrets.json`, `config/ui-config.json`, `config/README.md`.

**`tools/`:**
- Purpose: host optional Provider balance runtime tooling.
- Contains: helper process, supervisor process, and scheduled-task install/uninstall scripts.
- Key files: `tools/provider-helper.js`, `tools/provider-supervisor.js`, `tools/install-provider-supervisor.ps1`, `tools/uninstall-provider-supervisor.ps1`.

**`local/`:**
- Purpose: local-only ignored workspace area.
- Contains: not tracked by Git.
- Key files: not applicable.

## Key File Locations

**Entry Points:**
- `codex-context-used-meter.js`: browser IIFE injected by Codex++.
- `tools/provider-helper.js`: Node.js CLI for one-shot or continuous Provider summary publication.
- `tools/provider-supervisor.js`: Node.js supervisor started by Windows scheduled task.
- `tools/install-provider-supervisor.ps1`: scheduled-task installer.
- `tools/uninstall-provider-supervisor.ps1`: scheduled-task uninstaller.

**Configuration:**
- `config/provider-config.json`: public non-secret Provider config template.
- `config/provider-secrets.json`: public secrets template that must remain placeholder-only.
- `config/ui-config.json`: public UI config template.
- `.gitignore`: excludes local config and secret files at the repository root and under `local/`.

**Core Logic:**
- `codex-context-used-meter.js`: Context usage discovery, UI rendering, Provider rendering, history charts, and page API.
- `tools/provider-helper.js`: Provider fetch, normalization, CDP target discovery, and CDP publish.
- `tools/provider-supervisor.js`: Codex process detection and helper lifecycle.

**Testing:**
- No test files or test directories are present.
- `tools/provider-helper.js` exports selected functions through `module.exports`, which is the natural insertion point for future unit tests.

## Naming Conventions

**Files:**
- Root installable script uses lower-case kebab case: `codex-context-used-meter.js`.
- Tool scripts use lower-case kebab case: `provider-helper.js`, `provider-supervisor.js`.
- PowerShell scripts use verb-noun lower-case kebab case: `install-provider-supervisor.ps1`, `uninstall-provider-supervisor.ps1`.
- Markdown docs use uppercase root names for repository contracts (`README.md`, `AGENTS.md`, `LICENSE`) and regular README naming inside `config/`.

**Directories:**
- Top-level directories are lower-case and role-oriented: `assets/`, `config/`, `tools/`, and `local/`.

## Where to Add New Code

**New UI Feature:**
- Primary code: `codex-context-used-meter.js`.
- Add constants near existing top-level constants and keep state fields inside the `state` object.
- Add DOM/style changes through `installStyle()` and root infrastructure helpers in `codex-context-used-meter.js`.

**New Provider Runtime Feature:**
- Provider request/normalization code: `tools/provider-helper.js`.
- Provider process lifecycle code: `tools/provider-supervisor.js`.
- Windows scheduled-task behavior: `tools/install-provider-supervisor.ps1` and `tools/uninstall-provider-supervisor.ps1`.

**New Configuration Option:**
- Defaults: `codex-context-used-meter.js` and `tools/provider-helper.js` when both renderer and helper need the value.
- Templates: `config/ui-config.json` or `config/provider-config.json`.
- Documentation: `README.md` and `config/README.md`.

**Utilities:**
- Renderer-only utility functions stay in `codex-context-used-meter.js`.
- Helper-only utilities stay in `tools/provider-helper.js`.
- Do not add a package dependency without also adding package metadata and install instructions.

## Special Directories

**`assets/`:**
- Purpose: documentation media.
- Generated: No.
- Committed: Yes.

**`config/`:**
- Purpose: public templates only.
- Generated: No.
- Committed: Yes.

**`local/`:**
- Purpose: ignored local files.
- Generated: User/tool dependent.
- Committed: No.

**`%APPDATA%\Codex++\user_scripts`:**
- Purpose: actual Codex++ install target for the user script.
- Generated: No.
- Committed: No.

**`%APPDATA%\codex-context-used-meter`:**
- Purpose: runtime Provider/UI config and supervisor logs.
- Generated: User/tool dependent.
- Committed: No.

---

*Structure analysis: 2026-05-29*
