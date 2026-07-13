const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "codex-context-used-meter.js"),
  "utf8",
);
const start = source.indexOf("function pruneSpendHistory(now = Date.now())");
const end = source.indexOf("function formatHistoryTime(time)");
assert.ok(start >= 0 && end > start);
const code = source.slice(start, end);

const state = {
  spendHistory: { context: [], provider: [] },
  contextSessionTotalsByConversationId: new Map(),
  providerSessionTotalsByConversationId: new Map(),
  activeConversationId: "a",
  root: null,
};
const normalizeConversationId = (value) => value == null ? null : String(value).trim().toLowerCase() || null;
const metaConversationId = () => normalizeConversationId(state.activeConversationId || "__unknown__") || "__unknown__";
const build = new Function(
  "state",
  "normalizeConversationId",
  "metaConversationId",
  "SPEND_HISTORY_WINDOW_MS",
  "SPEND_HISTORY_MAX_ITEMS",
  `${code}; return { pruneSpendHistory, recordSpend };`,
);
const { pruneSpendHistory, recordSpend } = build(
  state,
  normalizeConversationId,
  metaConversationId,
  60 * 60 * 1000,
  200,
);

const base = Date.UTC(2026, 6, 10, 23, 0, 0);
const originalNow = Date.now;
let now = base - 30 * 60 * 1000;
Date.now = () => now;
try {
  recordSpend("context", 1200, "A");
  recordSpend("context", 0, "A");
  recordSpend("context", -500, "A");
  now += 10 * 60 * 1000;
  recordSpend("context", 3400, "B");
  recordSpend("provider", 1.25, "relay");

  assert.equal(state.spendHistory.context.length, 2, "only positive context deltas must be recorded");
  assert.deepEqual(state.spendHistory.context.map((item) => item.conversationId), ["a", "b"]);
  assert.equal(state.contextSessionTotalsByConversationId.get("a"), 1200);
  assert.equal(state.contextSessionTotalsByConversationId.get("b"), 3400);
  assert.equal(state.spendHistory.provider.length, 1, "provider history must remain unchanged");

  pruneSpendHistory(base + 31 * 60 * 1000);
  assert.equal(state.spendHistory.context.length, 1, "events older than one hour must be pruned");
  assert.equal(state.spendHistory.context[0].conversationId, "b");
  console.log("context spend history state: OK");
} finally {
  Date.now = originalNow;
}
