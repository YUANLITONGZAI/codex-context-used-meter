const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(
  path.join(__dirname, "..", "codex-context-used-meter.js"),
  "utf8",
);

function between(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `missing ${startMarker}`);
  assert.ok(end > start, `missing ${endMarker}`);
  return source.slice(start, end);
}

function normalizeConversationId(value) {
  if (value == null) return null;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  return text ? text.toLowerCase() : null;
}

function conversationIdsMatch(left, right) {
  const normalizedLeft = normalizeConversationId(left);
  const normalizedRight = normalizeConversationId(right);
  return !!normalizedLeft && normalizedLeft === normalizedRight;
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function makeProductionStatusParser() {
  const code = between(
    "function parseStatusContextUsageObject(value, source, conversationId)",
    "function looksLikeStatusContextUsageObject(value)",
  );
  return new Function(
    "firstFiniteNumber",
    "makeReading",
    "withConversationId",
    `${code}; return parseStatusContextUsageObject;`,
  )(
    firstFiniteNumber,
    (percent, sourceName, raw, used, limit) => ({
      percent,
      source: sourceName,
      raw,
      used,
      limit,
      conversationId: null,
    }),
    (reading, conversationId) => {
      if (reading) reading.conversationId = normalizeConversationId(conversationId);
      return reading;
    },
  );
}

function makeProductionAppSignalReader(state) {
  const code = between(
    "function readSignalValue(scope, selector, argument, isValidValue)",
    "function scanAppSignalContextUsage(activeConversationId)",
  );
  return new Function(
    "state",
    "parseStatusContextUsageObject",
    "firstFiniteNumber",
    "conversationIdsMatch",
    `${code}; return readAppSignalContextUsage;`,
  )(
    state,
    makeProductionStatusParser(),
    firstFiniteNumber,
    conversationIdsMatch,
  );
}

function tokenUsage(ownerConversationId) {
  return {
    conversationId: ownerConversationId,
    modelContextWindow: 353400,
    last: { totalTokens: 120000 },
  };
}

test("App Signal must reject a token-usage object owned by another conversation", () => {
  const state = {
    appSignalModules: {
      appServerSignals: { tokenUsage: "token-usage-selector" },
      signalStorage: null,
    },
    appSignalTokenUsageSelector: null,
    appSignalLastReadError: null,
    conversationGeneration: 7,
  };
  const readAppSignalContextUsage = makeProductionAppSignalReader(state);
  const scope = {
    get() {
      return tokenUsage("conversation-b");
    },
  };

  const reading = readAppSignalContextUsage(
    scope,
    state.appSignalModules,
    "conversation-a",
  );

  assert.equal(
    reading,
    null,
    "a value explicitly owned by conversation B must not be relabeled and committed as conversation A",
  );
  assert.equal(
    state.appSignalTokenUsageSelector,
    null,
    "a selector returning another conversation's value must not become authoritative",
  );
});

test("ownerless App Signal data must be rejected when the discovered scope belongs to another conversation", () => {
  const scanCode = between(
    "function scanAppSignalContextUsage(activeConversationId)",
    "function collectContextUsageSampleConversationIds(activeConversationId)",
  );
  const state = {
    appSignalCachedReading: null,
    appSignalCachedConversationId: null,
    appSignalCachedGeneration: 0,
    appSignalCachedAt: 0,
    appSignalModulesPromise: null,
    appSignalScopeRetryConversationId: null,
    appSignalScopeRetryCount: 0,
    appSignalScopeInvalidations: 0,
    appSignalScope: null,
    appSignalLastLookupAt: 0,
    appSignalLastSuccessAt: 0,
    conversationGeneration: 11,
    switchRetryUntil: Date.now() + 1000,
    waitingForAppSignalModules: false,
  };
  const staleScope = { value: { conversationId: "conversation-b" } };
  state.appSignalScope = staleScope;

  const scanAppSignalContextUsage = new Function(
    "state",
    "ensureAppSignalModules",
    "findAppSignalScope",
    "normalizeConversationId",
    "conversationIdsMatch",
    "readAppSignalContextUsage",
    "scheduleUpdate",
    "APP_SIGNAL_READING_CACHE_MS",
    "SWITCH_RETRY_INTERVAL_MS",
    "APP_SIGNAL_IMPORT_GRACE_MS",
    `${scanCode}; return scanAppSignalContextUsage;`,
  )(
    state,
    () => ({ appServerSignals: { tokenUsage: "selector" } }),
    () => staleScope,
    normalizeConversationId,
    conversationIdsMatch,
    () => ({
      conversationId: "conversation-a",
      captureGeneration: state.conversationGeneration,
      ownership: "app-signal",
      used: 120000,
      limit: 353400,
    }),
    () => {},
    1000,
    100,
    100,
  );

  const reading = scanAppSignalContextUsage("conversation-a");

  assert.equal(
    reading,
    null,
    "ownerless usage may only be accepted after the current scope is validated for conversation A",
  );
  assert.equal(
    state.appSignalCachedReading,
    null,
    "an ownerless reading from conversation B's stale scope must not enter conversation A's cache",
  );
});

test("a missing active marker during navigation must enter an unknown transaction instead of retaining the old reading", () => {
  const updateCode = between(
    "function updateActiveConversationId()",
    "function parseStatusContextUsageObject(value, source, conversationId)",
  );
  const state = {
    activeConversationId: "conversation-a",
    cachedActiveConversationId: "conversation-a",
    activeConversationIdLookupAt: 0,
    lastReading: {
      conversationId: "conversation-a",
      captureGeneration: 3,
      used: 120000,
    },
    renderedContextReading: {
      conversationId: "conversation-a",
      used: 120000,
    },
    renderedContextConversationId: "conversation-a",
    navigationPendingUntil: Date.now() + 1000,
    switchRetryUntil: Date.now() + 1000,
  };
  let retainedConversationId = null;

  const updateActiveConversationId = new Function(
    "state",
    "readActiveConversationId",
    "hasThreadContentSurface",
    "conversationIdsMatch",
    "activateConversationId",
    "retainConversationId",
    "clearRetryUpdate",
    `${updateCode}; return updateActiveConversationId;`,
  )(
    state,
    () => null,
    () => true,
    conversationIdsMatch,
    () => false,
    (conversationId) => {
      retainedConversationId = conversationId;
      return true;
    },
    () => {},
  );

  const activeConversationId = updateActiveConversationId();

  assert.equal(
    activeConversationId,
    null,
    "the old conversation ID must not remain render-authoritative while navigation identity is unknown",
  );
  assert.equal(retainedConversationId, null, "the old conversation must not be retained during the pending interval");
  assert.equal(state.lastReading, null, "the old transaction reading must be cleared while identity is unknown");
  assert.equal(state.renderedContextReading, null, "the old rendered snapshot must be hidden while identity is unknown");
  assert.equal(state.renderedContextConversationId, null);
});

test("ownerless App Signal data is accepted only when the scope anchor owns the requested conversation", () => {
  const scanCode = between(
    "function scanAppSignalContextUsage(activeConversationId)",
    "function collectContextUsageSampleConversationIds(activeConversationId)",
  );
  const state = {
    appSignalCachedReading: null,
    appSignalCachedConversationId: null,
    appSignalCachedGeneration: 0,
    appSignalCachedAt: 0,
    appSignalModulesPromise: null,
    appSignalScopeRetryConversationId: null,
    appSignalScopeRetryCount: 0,
    appSignalScopeInvalidations: 0,
    appSignalScope: null,
    appSignalScopeOwnerConversationId: "conversation-a",
    appSignalLastLookupAt: 0,
    appSignalLastSuccessAt: 0,
    conversationGeneration: 12,
    switchRetryUntil: Date.now() + 1000,
    waitingForAppSignalModules: false,
  };
  const verifiedScope = { value: {} };
  state.appSignalScope = verifiedScope;

  const scanAppSignalContextUsage = new Function(
    "state",
    "ensureAppSignalModules",
    "findAppSignalScope",
    "normalizeConversationId",
    "conversationIdsMatch",
    "readAppSignalContextUsage",
    "scheduleUpdate",
    "APP_SIGNAL_READING_CACHE_MS",
    "SWITCH_RETRY_INTERVAL_MS",
    "APP_SIGNAL_IMPORT_GRACE_MS",
    `${scanCode}; return scanAppSignalContextUsage;`,
  )(
    state,
    () => ({ appServerSignals: { tokenUsage: "selector" } }),
    () => verifiedScope,
    normalizeConversationId,
    conversationIdsMatch,
    () => ({
      conversationId: "conversation-a",
      appSignalOwnerConversationId: null,
      captureGeneration: state.conversationGeneration,
      ownership: "app-signal",
      used: 120000,
      limit: 353400,
    }),
    () => {},
    1000,
    100,
    100,
  );

  const reading = scanAppSignalContextUsage("conversation-a");

  assert.ok(reading, "the current conversation anchor is sufficient provenance for an ownerless value");
  assert.equal(reading.conversationId, "conversation-a");
  assert.equal(state.appSignalCachedReading, reading);
});
test("starting a new conversation transaction hides the previous card synchronously", () => {
  const activateCode = between(
    "function activateConversationId(activeConversationId, options = {})",
    "function retainConversationId(conversationId)",
  );
  const root = { hidden: false, dataset: { historyOpen: "true" } };
  const historyPortal = { dataset: { historyOpen: "true" } };
  const historyPanel = { setAttribute(name, value) { this[name] = value; } };
  const state = {
    activeConversationId: "conversation-a",
    cachedActiveConversationId: "conversation-a",
    activeConversationIdLookupAt: 0,
    conversationGeneration: 3,
    activationEpoch: 3,
    lastReading: { conversationId: "conversation-a" },
    renderedContextReading: { conversationId: "conversation-a" },
    renderedContextConversationId: "conversation-a",
    authoritySnapshot: { conversationId: "conversation-a" },
    pendingUpdate: 0,
    pendingUpdateDueAt: 0,
    root,
    historyPortal,
    historyPanel,
  };
  const activateConversationId = new Function(
    "state",
    "normalizeConversationId",
    "clearRetryUpdate",
    "window",
    "clearAppSignalTransactionState",
    "scheduleRetryUpdate",
    "refreshOpenSpendHistory",
    "NAVIGATION_PENDING_MS",
    "SWITCH_RETRY_WINDOW_MS",
    `${activateCode}; return activateConversationId;`,
  )(
    state,
    normalizeConversationId,
    () => {},
    { clearTimeout() {} },
    () => {},
    () => {},
    () => {},
    1500,
    8000,
  );

  const changed = activateConversationId("conversation-b", { pendingNavigation: true });

  assert.equal(changed, true);
  assert.equal(state.activeConversationId, "conversation-b");
  assert.equal(root.hidden, true, "the old card must not remain visible until the delayed refresh");
  assert.equal(root.dataset.historyOpen, "false");
  assert.equal(historyPortal.dataset.historyOpen, "false");
  assert.equal(historyPanel["aria-hidden"], "true");
});