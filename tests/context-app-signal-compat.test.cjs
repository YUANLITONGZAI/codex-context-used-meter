const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "codex-context-used-meter.js"),
  "utf8",
);

const readerStart = source.indexOf("function readSignalValue(scope, selector, argument");
const readerEnd = source.indexOf("function scanAppSignalContextUsage(activeConversationId)");
assert.ok(readerStart >= 0 && readerEnd > readerStart, "app-signal reader functions must remain testable");

function parseUsage(value, sourceName, conversationId) {
  if (!value || typeof value !== "object") return null;
  const contextWindow = Number(value.modelContextWindow);
  const totalTokens = Number(value.last && value.last.totalTokens);
  if (!Number.isFinite(contextWindow) || contextWindow <= 0) return null;
  if (!Number.isFinite(totalTokens) || totalTokens < 0) return null;
  return {
    source: sourceName,
    conversationId,
    usedTokens: totalTokens,
    contextWindow,
  };
}

function makeReader(state) {
  const code = source.slice(readerStart, readerEnd);
  return new Function(
    "state",
    "parseStatusContextUsageObject",
    "firstFiniteNumber",
    "conversationIdsMatch",
    `${code}; return { readSignalValue, readAppSignalContextUsage };`,
  )(
    state,
    parseUsage,
    (...values) => {
      for (const value of values) {
        const number = Number(value);
        if (Number.isFinite(number)) return number;
      }
      return null;
    },
    (left, right) => left === right,
  );
}

function usage(totalTokens = 161348) {
  return {
    total: { totalTokens },
    last: { totalTokens },
    modelContextWindow: 353400,
  };
}

{
  const state = {
    appSignalModules: { appServerSignals: { direct: "direct-selector" }, signalStorage: null },
    appSignalTokenUsageSelector: null,
  };
  const { readAppSignalContextUsage } = makeReader(state);
  let calls = 0;
  const directValue = usage();
  const scope = {
    get(selector, argument) {
      calls += 1;
      assert.equal(selector, "direct-selector");
      assert.equal(argument, "conversation-direct");
      return directValue;
    },
  };

  const reading = readAppSignalContextUsage(
    scope,
    state.appSignalModules,
    "conversation-direct",
  );
  assert.equal(reading && reading.usedTokens, 161348, "direct scope.get value must be parsed first");
  assert.equal(calls, 1, "a valid direct value must not be passed back into scope.get");
}

{
  const state = {
    appSignalModules: { appServerSignals: { legacy: "legacy-selector" }, signalStorage: null },
    appSignalTokenUsageSelector: null,
  };
  const { readAppSignalContextUsage } = makeReader(state);
  const handle = { id: "legacy-handle" };
  const calls = [];
  const scope = {
    get(selector, argument) {
      calls.push([selector, argument]);
      if (selector === "legacy-selector") return handle;
      if (selector === handle) return usage(120000);
      return null;
    },
  };

  const reading = readAppSignalContextUsage(
    scope,
    state.appSignalModules,
    "conversation-legacy",
  );
  assert.equal(reading && reading.usedTokens, 120000, "legacy nested signal protocol must remain supported");
  assert.deepEqual(calls, [
    ["legacy-selector", "conversation-legacy"],
    [handle, undefined],
  ]);
}

{
  const appServerSignals = {};
  for (let index = 0; index < 120; index += 1) {
    appServerSignals[`export${String(index).padStart(3, "0")}`] = `selector-${index}`;
  }
  appServerSignals.rt = "selector-target";

  const state = {
    appSignalModules: { appServerSignals, signalStorage: null },
    appSignalTokenUsageSelector: null,
  };
  const { readAppSignalContextUsage } = makeReader(state);
  let targetCalls = 0;
  const scope = {
    get(selector) {
      if (selector === "selector-5") return { percent: 42 };
      if (selector === "selector-target") {
        targetCalls += 1;
        return usage(150000);
      }
      return null;
    },
  };

  const first = readAppSignalContextUsage(scope, state.appSignalModules, "conversation-wide-scan");
  assert.equal(first && first.usedTokens, 150000, "selectors after export 96 must be scanned");
  assert.equal(state.appSignalTokenUsageSelector, "selector-target", "validated selector must be cached");

  const second = readAppSignalContextUsage(scope, state.appSignalModules, "conversation-wide-scan");
  assert.equal(second && second.usedTokens, 150000);
  assert.equal(targetCalls, 2, "cached selector must be reusable on the next read");
}
{
  const state = {
    appSignalModules: {
      appServerSignals: { pending: "selector-pending", valid: "selector-valid" },
      signalStorage: null,
    },
    appSignalTokenUsageSelector: null,
  };
  const { readAppSignalContextUsage } = makeReader(state);
  const scope = {
    get(selector) {
      if (selector === "selector-pending") {
        return { modelContextWindow: 0, last: { totalTokens: 0 } };
      }
      if (selector === "selector-valid") return usage(145000);
      return null;
    },
  };

  const reading = readAppSignalContextUsage(scope, state.appSignalModules, "conversation-valid-after-pending");
  assert.equal(reading && reading.usedTokens, 145000, "a pending candidate must not starve a later valid selector");
  assert.equal(state.appSignalTokenUsageSelector, "selector-valid", "only a validated selector may be cached");
}

{
  const state = {
    appSignalModules: { appServerSignals: { pending: "selector-pending" }, signalStorage: null },
    appSignalTokenUsageSelector: null,
  };
  const { readAppSignalContextUsage } = makeReader(state);
  const scope = {
    get() {
      return { modelContextWindow: 0, last: { totalTokens: 0 } };
    },
  };

  assert.deepEqual(readAppSignalContextUsage(scope, state.appSignalModules, "conversation-pending"), { kind: "pending" });
  assert.equal(state.appSignalTokenUsageSelector, null, "pending alone must not validate or cache a selector");
}

{
  const state = {
    appSignalModules: {
      appServerSignals: { pending: "selector-pending", other: "selector-other" },
      signalStorage: null,
    },
    appSignalTokenUsageSelector: "selector-pending",
  };
  const { readAppSignalContextUsage } = makeReader(state);
  let otherCalls = 0;
  const scope = {
    get(selector) {
      if (selector === "selector-pending") return { modelContextWindow: 0, last: { totalTokens: 0 } };
      otherCalls += 1;
      return usage(145000);
    },
  };

  assert.deepEqual(readAppSignalContextUsage(scope, state.appSignalModules, "conversation-pending"), { kind: "pending" });
  assert.equal(otherCalls, 0, "a previously validated pending selector remains authoritative for the active conversation");
}

// The optional setting-storage helper may disappear between Codex builds.
// Its absence must not be coupled to the required app-server module import.
const moduleLoaderStart = source.indexOf("function ensureAppSignalModules()");
assert.ok(moduleLoaderStart >= 0 && moduleLoaderStart < readerStart);
const moduleLoaderCode = source.slice(moduleLoaderStart, readerStart);
assert.doesNotMatch(
  moduleLoaderCode,
  /Promise\.all\s*\(\s*\[\s*import\(appServerUrl\)[\s\S]*?import\(signalUrl\)/,
  "required and optional module imports must not share one Promise.all failure path",
);

assert.doesNotMatch(
  moduleLoaderCode,
  /await optionalSignalStorage/,
  "optional setting-storage must not delay required module readiness",
);

const scannerStart = source.indexOf("function scanAppSignalContextUsage(activeConversationId)");
const scannerEnd = source.indexOf("function shouldWaitForAppSignalModules(now)");
assert.ok(scannerStart >= 0 && scannerEnd > scannerStart, "app-signal scanner must remain testable");
const scannerCode = source.slice(scannerStart, scannerEnd);
assert.match(
  scannerCode,
  /if \(state\.appSignalScope === scope\) \{[\s\S]*?state\.appSignalScope = null;/,
  "an unvalidated structural scope must be invalidated",
);
assert.match(
  scannerCode,
  /state\.appSignalScopeRetryCount < 2/,
  "scope rediscovery retries must remain bounded",
);
assert.match(
  scannerCode,
  /scheduleUpdate\(APP_SIGNAL_IMPORT_GRACE_MS\)/,
  "scope rediscovery must be scheduled after hydration",
);

assert.match(moduleLoaderCode, /appSignalModule(?:Error|Diagnostic)/, "required import failures must be recorded");

assert.match(moduleLoaderCode, /APP_SIGNAL_IMPORT_RETRY_MS/, "required module failures must use an explicit retry delay");
assert.match(moduleLoaderCode, /appSignalModuleRetryAt\s*>\s*now/, "required module imports must honor the retry deadline");
assert.match(moduleLoaderCode, /appSignalModuleRetryAt\s*=\s*Date\.now\(\)\s*\+\s*APP_SIGNAL_IMPORT_RETRY_MS/, "required import failures must set the next retry deadline");
assert.match(scannerCode, /now\s*<\s*state\.switchRetryUntil/, "pending fast retry must be bounded by the active transaction window");

console.log("context app-signal compatibility: OK");


