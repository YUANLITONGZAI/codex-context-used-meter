const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "..", "codex-context-used-meter.js"), "utf8");
const between = (startMarker, endMarker) => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `missing ${startMarker}`);
  assert.ok(end > start, `missing ${endMarker}`);
  return source.slice(start, end);
};

assert.match(source, /renderedContextReading: null/);
assert.match(source, /renderedContextConversationId: null/);
const summary = between("function renderHistorySection(kind)", "function metaConversationId()");
assert.match(summary, /const reading = state\.renderedContextReading;/);
assert.match(summary, /normalizeConversationId\(state\.renderedContextConversationId\)/);
assert.match(summary, /conversationIdsMatch\(renderedConversationId, conversationId\)/);
assert.doesNotMatch(summary, /const reading = state\.lastReading;/);

const suppress = between("function clearContextNativeTitles()", "function isInlineMountCurrent(root)");
assert.match(suppress, /removeAttribute\("title"\)/);
assert.match(suppress, /root\.addEventListener\("pointerover", clearContextNativeTitles, true\)/);
assert.match(suppress, /root\.addEventListener\("focusin", clearContextNativeTitles, true\)/);
const hideMeter = between("function hideMeter(", "function hideProviderMeter(");
assert.match(hideMeter, /state\.renderedContextReading = null;/);
assert.match(hideMeter, /state\.renderedContextConversationId = null;/);
assert.match(hideMeter, /card\.removeAttribute\("title"\)/);
assert.doesNotMatch(hideMeter, /card\.title\s*=/);

const updateMeter = between("function updateMeter()", "function scheduleUpdate(");
assert.match(updateMeter, /state\.renderedContextReading = \{/);
assert.match(updateMeter, /state\.renderedContextConversationId = normalizeConversationId\(/);
assert.match(updateMeter, /clearContextNativeTitles\(\);/);
assert.doesNotMatch(source, /function formatContextTitle\(/);
assert.doesNotMatch(source, /Source: \$\{reading\.source\}/);
assert.match(source, /renderedContextReading: state\.renderedContextReading/);
assert.match(source, /renderedContextConversationId: state\.renderedContextConversationId/);
console.log("context rendered summary/title contract: OK");
