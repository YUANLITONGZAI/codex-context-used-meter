const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const contextMeter = fs.readFileSync(
  path.join(root, "codex-context-used-meter.js"),
  "utf8",
);
const contextStart = contextMeter.indexOf("function niceContextHistoryAxisMax(value)");
const providerStart = contextMeter.indexOf("function makeSpendHistoryChart(items, kind)");
assert.ok(contextStart >= 0, "context time-bar renderer must exist");
assert.ok(providerStart > contextStart, "provider renderer must follow the context renderer");
const contextRenderer = contextMeter.slice(contextStart, providerStart);

assert.match(contextMeter, /spendHistory: \{\s*context: \[\],\s*provider: \[\]/);
assert.match(contextMeter, /function recordSpend\(kind, amount, meta\)/);
assert.match(contextMeter, /if \(!Number\.isFinite\(amount\) \|\| amount <= 0/);
assert.match(contextMeter, /recordSpend\("context", deltaTokens, conversationId\);/);
assert.match(contextMeter, /function makeSpendHistoryChart\(items, kind\) \{\s*if \(kind === "context"\) return makeContextSpendTimeBarChart\(items\);/);
assert.match(contextMeter, /const CONTEXT_HISTORY_TIME_GRID_MS = 5 \* 60 \* 1000;/);
assert.match(contextMeter, /const CONTEXT_HISTORY_TIME_LABEL_INTERVALS_MS = \[5, 10, 15, 30\]/);
assert.match(contextMeter, /const CONTEXT_HISTORY_TIME_LABEL_MIN_WIDTH = 46;/);
assert.match(contextMeter, /const CONTEXT_HISTORY_TIME_MIN_WINDOW_MS = 15 \* 60 \* 1000;/);
assert.match(contextMeter, /const CONTEXT_HISTORY_MIN_BAR_PITCH = 5;/);
assert.match(contextRenderer, /chart\.dataset\.historyRenderer = "context-time-bars";/);
assert.match(contextRenderer, /niceContextHistoryAxisMax/);
assert.match(contextRenderer, /\[\[axisMax, false\], \[axisMax \/ 2, false\], \[0, true\]\]/);
assert.match(contextRenderer, /function makeContextHistoryTimeDomain\(items\)/);
assert.match(contextRenderer, /Math\.floor\(firstTime \/ CONTEXT_HISTORY_TIME_GRID_MS\)/);
assert.match(contextRenderer, /Math\.ceil\(lastTime \/ CONTEXT_HISTORY_TIME_GRID_MS\)/);
assert.match(contextRenderer, /function chooseContextHistoryTimeLabelInterval\(start, end, innerWidth\)/);
assert.match(contextRenderer, /const xForTime = \(time\) => plotLeft \+ \(\(time - timeDomain\.start\) \/ timeSpan\) \* innerWidth;/);
assert.match(contextRenderer, /chooseContextHistoryTimeLabelInterval\(timeDomain\.start, timeDomain\.end, innerWidth\)/);
assert.match(contextRenderer, /tick % labelInterval === 0/);
assert.match(contextRenderer, /class", "ccm-context-history-time-gridline"/);
assert.match(contextRenderer, /"ccm-context-history-bar ccm-context-history-latest-bar"/);
assert.match(contextRenderer, /const barWidth = 3;/);
assert.doesNotMatch(contextRenderer, /nearestDistance|previousDistance|nextDistance/);
assert.match(contextRenderer, /hit\.setAttribute\("aria-label", formatHistoryPointTitle\("context", point\)\)/);
assert.match(contextRenderer, /class", "ccm-context-history-tooltip"/);
assert.match(contextRenderer, /class", "ccm-context-history-pointer-layer"/);
assert.match(contextRenderer, /pointerLayer\.addEventListener\("pointermove"/);
assert.match(contextRenderer, /tooltipValue\.textContent = point\.item\.eventCount > 1\s*\? `Total \$\{deltaLabel\.replace\(" Tokens", " tokens"\)\}`\s*: deltaLabel/);
assert.match(contextRenderer, /Math\.max\(barWidth, 8\)/);
assert.doesNotMatch(contextRenderer, /ccm-history-caption|Latest \$\{formatHistoryDelta/);
assert.match(contextMeter, /let chartItems = state\.spendHistory\[kind\]\.filter/);
assert.doesNotMatch(contextMeter, /contextUsageHistory|recordContextUsageSnapshot|makeContextUsageHistoryChart|context-step-area/);
assert.doesNotMatch(contextRenderer, /ccm-context-history-stem|ccm-context-history-marker|ccm-context-history-latest-halo/);
assert.doesNotMatch(contextRenderer, /ccm-context-history-area|ccm-context-history-line|stepPath/);
assert.doesNotMatch(contextMeter, /CONTEXT_SPEND_HISTORY_BUCKET_COUNT|makeContextSpendHistoryChart/);
assert.match(contextMeter, /function clearContextNativeTitles\(\)/);
assert.match(contextMeter, /root\.addEventListener\("pointerover", clearContextNativeTitles, true\)/);
assert.match(contextMeter, /class="ccm-context-summary" hidden/);
assert.match(contextMeter, /data-context-summary-value="left"/);
assert.match(contextMeter, /data-context-summary-value="used"/);
assert.match(contextMeter, /data-context-summary-value="total"/);
assert.match(contextMeter, /root\.dataset\.historyOpen === "true"\) \{\s*renderSpendHistory\(\);/);
assert.match(contextMeter, /renderSpendHistory\(\);\s*clampHistoryPanelToViewport\(root\);\s*if \(root\.dataset\.historyOpen !== "true"\) root\.dataset\.historyOpen = "true";/);
assert.match(contextMeter, /Session \$\{formattedTotal\.replace\(" Tokens", ""\)\}/);

console.log("context history time-bar contract: OK");

