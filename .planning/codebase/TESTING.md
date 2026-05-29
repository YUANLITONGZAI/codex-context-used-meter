# Testing Patterns

**Analysis Date:** 2026-05-29

## Test Framework

**Runner:**
- Not detected.
- Config: not detected.

**Assertion Library:**
- Not detected.

**Run Commands:**
```bash
node tools/provider-helper.js --once --no-cdp --print-summary  # Smoke-check Provider config loading and response normalization
```

## Test File Organization

**Location:**
- No test files are present.

**Naming:**
- No repository convention is established.

**Structure:**
```text
No tests/ or __tests__/ directory detected.
No *.test.js or *.spec.js files detected.
```

## Test Structure

**Suite Organization:**
```javascript
// No current test suite exists.
// `tools/provider-helper.js` exports functions that can be imported by a future Node test runner.
```

**Patterns:**
- Current validation is manual/smoke oriented, centered on `tools/provider-helper.js --once --no-cdp --print-summary`.
- UI validation currently depends on installing `codex-context-used-meter.js` through Codex++ and inspecting the Codex renderer.
- Supervisor validation currently depends on Windows scheduled-task installation through `tools/install-provider-supervisor.ps1`.

## Mocking

**Framework:** Not detected.

**Patterns:**
```javascript
// No mocking pattern exists.
// Future tests for `tools/provider-helper.js` should mock Provider payloads and CDP target lists.
```

**What to Mock:**
- Provider API payloads consumed by `normalizeSubscription()` in `tools/provider-helper.js`.
- CDP target arrays consumed by `pickCdpTarget()` and `pickCdpTargets()` in `tools/provider-helper.js`.
- Unsafe and safe Provider URLs consumed by `isSafeProviderUrl()` and `buildProviderUrl()`.

**What NOT to Mock:**
- Template file paths in `config/`; tests should read fixtures or explicit sample objects instead of real runtime secrets.
- The Codex renderer DOM for low-level pure helper tests; reserve browser automation for actual UI behavior.

## Fixtures and Factories

**Test Data:**
```javascript
const activeSubscriptionPayload = {
  subscriptions: [{ status: "active", total: 1000, used: 250 }],
};
```

**Location:**
- Not present.
- Future fixtures should live under a new test directory rather than under `config/`, because `config/` is public runtime-template documentation.

## Coverage

**Requirements:** None enforced.

**View Coverage:**
```bash
# No coverage command exists.
```

## Test Types

**Unit Tests:**
- Not present.
- Natural first targets are `normalizeSubscription()`, `normalizeUiConfig()`, `buildProviderUrl()`, `isSafeProviderUrl()`, `providerSummaryExpression()`, `pickCdpTarget()`, and `pickCdpTargets()` from `tools/provider-helper.js`.

**Integration Tests:**
- Not present.
- Provider helper integration can be smoke-tested with `node tools/provider-helper.js --once --no-cdp --print-summary` using runtime config.

**E2E Tests:**
- Not present.
- UI behavior requires Codex++ injection into Codex and visual inspection or browser automation against the renderer.

## Common Patterns

**Async Testing:**
```javascript
// No current async test pattern exists.
// Future helper tests should await `fetchProvider()` with a mocked `fetch`.
```

**Error Testing:**
```javascript
// No current error test pattern exists.
// Future tests should assert coded statuses from `classifyProviderError()` and unsafe URL rejection.
```

---

*Testing analysis: 2026-05-29*
