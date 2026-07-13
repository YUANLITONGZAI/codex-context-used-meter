const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "..", "codex-context-used-meter.js"),
  "utf8",
);
const rendererStart = source.indexOf("function niceContextHistoryAxisMax(value)");
const rendererEnd = source.indexOf("function makeSpendHistoryChart(items, kind)");
assert.ok(rendererStart >= 0 && rendererEnd > rendererStart);

function makeNode(tagName) {
  return {
    tagName,
    attrs: {},
    dataset: {},
    children: [],
    className: "",
    textContent: "",
    listeners: {},
    setAttribute(name, value) { this.attrs[name] = String(value); },
    addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); },
    append(...nodes) { this.children.push(...nodes); },
    appendChild(node) { this.children.push(node); return node; },
    getBoundingClientRect() { return { left: 0, width: 244 }; },
  };
}

const document = {
  createElement: makeNode,
  createElementNS: (_namespace, tagName) => makeNode(tagName),
};
const fixedNow = Date.UTC(2026, 6, 10, 23, 0, 0);
const formatTime = (time) => new Date(time).toISOString().slice(11, 16);
const formatAxis = (_kind, value) => value >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(Math.round(value));
const formatDelta = (_kind, value) => `\u2212${Math.round(value).toLocaleString("en-US")} Tokens`;
const formatTitle = (_kind, point) => `${point.item.eventCount > 1 ? `${formatTime(point.item.firstTime)} \u00b7 ${point.item.eventCount} events Total` : formatTime(point.item.time)} ${formatDelta("context", point.item.amount).replace(" Tokens", point.item.eventCount > 1 ? " tokens" : " Tokens")}`;
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const rendererCode = source.slice(rendererStart, rendererEnd);
const buildRenderer = new Function(
  "document",
  "clampNumber",
  "formatHistoryTime",
  "formatHistoryAxisValue",
  "formatHistoryDelta",
  "formatHistoryPointTitle",
  "svgPoint",
  "SPEND_HISTORY_WINDOW_MS",
  "SPEND_HISTORY_CHART_WIDTH",
  "SPEND_HISTORY_CHART_HEIGHT",
  "CONTEXT_HISTORY_TIME_GRID_MS",
  "CONTEXT_HISTORY_TIME_LABEL_INTERVALS_MS",
  "CONTEXT_HISTORY_TIME_LABEL_MIN_WIDTH",
  "CONTEXT_HISTORY_TIME_MIN_WINDOW_MS",
  "CONTEXT_HISTORY_MIN_BAR_PITCH",
  `${rendererCode}; return makeContextSpendTimeBarChart;`,
);
const render = buildRenderer(
  document,
  clamp,
  formatTime,
  formatAxis,
  formatDelta,
  formatTitle,
  (value) => Number.isFinite(value) ? value.toFixed(1) : "0.0",
  60 * 60 * 1000,
  244,
  72,
  5 * 60 * 1000,
  [5, 10, 15, 30].map((minutes) => minutes * 60 * 1000),
  46,
  15 * 60 * 1000,
  5,
);
const originalNow = Date.now;
Date.now = () => fixedNow;
try {
  const chart = render([
    { time: fixedNow - 45 * 60 * 1000, amount: 1200 },
    { time: fixedNow - 20 * 60 * 1000, amount: 8000 },
    { time: fixedNow - 5 * 60 * 1000, amount: 3500 },
    { time: fixedNow - 70 * 60 * 1000, amount: 99999 },
    { time: fixedNow - 2 * 60 * 1000, amount: -100 },
  ]);
  const svg = chart.children[0];
  const classList = (name) => svg.children.filter((node) => String(node.attrs.class || "").split(" ").includes(name));
  const bars = classList("ccm-context-history-bar");
  const timeGridlines = classList("ccm-context-history-time-gridline");
  const timeLabels = classList("ccm-context-history-time-label");
  const horizontalGridlines = classList("ccm-context-history-gridline");

  assert.equal(chart.dataset.historyRenderer, "context-time-bars");
  assert.equal(bars.length, 3, "each positive in-window change must render one time-positioned bar");
  assert.equal(classList("ccm-context-history-latest-bar").length, 1, "latest change must be highlighted");
  assert.equal(horizontalGridlines.length, 3, "zero, midpoint, and nice maximum gridlines must render");
  assert.equal(horizontalGridlines[2].dataset.baseline, "true", "zero gridline must be the baseline");
  assert.equal(timeGridlines.length, 11, "aligned active range must keep five-minute time divisions");
  assert.deepEqual(timeLabels.map((node) => node.textContent), ["22:15", "22:30", "22:45", "23:00"]);
  assert.equal(chart.children.length, 1, "context chart must not render a redundant caption row");
  assert.match(svg.attrs["aria-label"], /across the active time range with 3 positive changes/);
  assert.equal(svg.children.filter((node) => String(node.attrs.class || "").includes("ccm-context-history-stem")).length, 0);
  assert.equal(svg.children.filter((node) => String(node.attrs.class || "").includes("ccm-context-history-marker")).length, 0);
  assert.equal(svg.children.filter((node) => node.attrs.class === "ccm-context-history-axis-label")[0].textContent, "10.0K");  const hits = classList("ccm-context-history-hit");
  const pointerLayer = classList("ccm-context-history-pointer-layer")[0];
  const tooltip = classList("ccm-context-history-tooltip")[0];
  assert.equal(hits.length, 3, "each event must keep a keyboard-focusable exact-value target");
  assert.ok(hits.every((hit) => hit.attrs.tabindex === "0" && hit.attrs["aria-label"]), "event targets must expose their exact values accessibly");
  assert.ok(hits.every((hit) => hit.children.length === 0), "native SVG title prompts must not remain");
  assert.ok(pointerLayer, "chart must include one pointer layer for nearest-event selection");
  assert.ok(tooltip, "chart must include one controlled tooltip");
  pointerLayer.listeners.pointermove[0]({ clientX: 218.5 });
  assert.equal(tooltip.dataset.visible, "true", "hovering near a bar must reveal its tooltip");
  assert.equal(tooltip.children[1].textContent, "22:55");
  assert.equal(tooltip.children[2].textContent, "−3,500 Tokens");
  assert.equal(bars[2].dataset.active, "true", "hovered bar must be emphasized");
  pointerLayer.listeners.pointerleave[0]();
  assert.equal(tooltip.dataset.visible, "false", "leaving the plot must hide the tooltip");

  const barCenter = (bar) => Number(bar.attrs.x) + Number(bar.attrs.width) / 2;
  assert.ok(Math.abs(barCenter(bars[0]) - 54.5) < 0.1, "22:15 event must keep its proportional position in the aligned activity range");
  assert.ok(Math.abs(barCenter(bars[1]) - 157) < 0.1, "22:40 event must keep its proportional position in the aligned activity range");
  assert.ok(Math.abs(barCenter(bars[2]) - 218.5) < 0.1, "22:55 event must keep its proportional position in the aligned activity range");

  const denseItems = Array.from({ length: 25 }, (_, index) => ({
    time: fixedNow - (25 - index) * 60 * 1000,
    amount: 1000 + index * 10,
  }));
  const denseChart = render(denseItems);
  const denseSvg = denseChart.children[0];
  const denseBars = denseSvg.children.filter((node) => String(node.attrs.class || "").includes("ccm-context-history-bar"));
  assert.equal(denseBars.length, 25, "dense history must retain every individual increment");
  assert.ok(denseBars.every((bar) => Number(bar.attrs.width) === 3), "every event must use one consistent visual width");

  const shortRangeChart = render([
    { time: fixedNow - 31 * 60 * 1000, amount: 1800 },
    { time: fixedNow - 29 * 60 * 1000, amount: 2400 },
  ]);
  assert.deepEqual(shortRangeChart.children[0].children.filter((node) => node.attrs.class === "ccm-context-history-time-label").map((node) => node.textContent), ["22:20", "22:25", "22:30", "22:35"], "22:29–22:31 activity must use aligned five-minute ticks");
  const shortRangeSvg = shortRangeChart.children[0];
  const shortRangeBars = shortRangeSvg.children.filter((node) => String(node.attrs.class || "").includes("ccm-context-history-bar"));
  const shortRangeCenter = (bar) => Number(bar.attrs.x) + Number(bar.attrs.width) / 2;
  assert.ok(Math.abs(shortRangeCenter(shortRangeBars[0]) - 157) < 0.1, "22:29 must retain its proportional timestamp position");
  assert.ok(Math.abs(shortRangeCenter(shortRangeBars[1]) - 184.3) < 0.1, "22:31 must retain its proportional timestamp position");

  const singlePointChart = render([{ time: fixedNow - 28 * 60 * 1000, amount: 1600 }]);
  assert.deepEqual(singlePointChart.children[0].children.filter((node) => node.attrs.class === "ccm-context-history-time-label").map((node) => node.textContent), ["22:20", "22:25", "22:30", "22:35"], "one off-boundary event must receive one five-minute segment");

  const clusteredChart = render([
    { time: fixedNow - 10 * 60 * 1000, amount: 1000 },
    { time: fixedNow - 10 * 60 * 1000 + 1000, amount: 1200 },
  ]);
  const clusteredBars = clusteredChart.children[0].children.filter((node) => String(node.attrs.class || "").includes("ccm-context-history-bar"));
  assert.equal(clusteredBars.length, 1, "events closer than the visual pitch must merge into one display bar");
  assert.equal(Number(clusteredBars[0].attrs.width), 3, "merged bars must retain the standard width");
  assert.match(clusteredChart.children[0].attrs["aria-label"], /2 positive changes in 1 display bars/);
  const clusteredHit = clusteredChart.children[0].children.find((node) => node.attrs.class === "ccm-context-history-hit");
  assert.match(clusteredHit.attrs["aria-label"], /2 events/);
  assert.match(clusteredHit.attrs["aria-label"], /Total .*2,200 tokens/);
  const clusteredPointerLayer = clusteredChart.children[0].children.find((node) => node.attrs.class === "ccm-context-history-pointer-layer");
  const clusteredTooltip = clusteredChart.children[0].children.find((node) => node.attrs.class === "ccm-context-history-tooltip");
  clusteredPointerLayer.listeners.pointermove[0]({ clientX: Number(clusteredBars[0].attrs.x) + 1.5 });
  assert.equal(clusteredTooltip.children[2].textContent, "Total \u22122,200 tokens", "merged bars must identify their summed value");

  const alignedStart = fixedNow - 50 * 60 * 1000;
  const alignedSpan = 25 * 60 * 1000;
  const adjacentBucketBoundary = alignedStart + (alignedSpan / 41) * 10;
  const boundaryCollisionChart = render([
    { time: fixedNow - 45 * 60 * 1000, amount: 900 },
    { time: adjacentBucketBoundary - 100, amount: 1000 },
    { time: adjacentBucketBoundary + 100, amount: 1200 },
    { time: fixedNow - 30 * 60 * 1000, amount: 1500 },
  ]);
  const boundaryCollisionSvg = boundaryCollisionChart.children[0];
  const boundaryCollisionBars = boundaryCollisionSvg.children.filter((node) => String(node.attrs.class || "").includes("ccm-context-history-bar"));
  assert.equal(boundaryCollisionBars.length, 3, "events on opposite bucket sides must still merge when their projected centers collide");
  const boundaryCenters = boundaryCollisionBars.map(barCenter);
  assert.ok(boundaryCenters.slice(1).every((center, index) => center - boundaryCenters[index] >= 5), "rendered bar centers must respect the five-pixel pitch");
  const boundaryCollisionHits = boundaryCollisionSvg.children.filter((node) => node.attrs.class === "ccm-context-history-hit");
  assert.match(boundaryCollisionHits[1].attrs["aria-label"], /2 events/);
  assert.match(boundaryCollisionHits[1].attrs["aria-label"], /Total .*2,200 tokens/);

  const exactPitchStart = alignedStart + 500000;
  const exactPitchChart = render([
    { time: fixedNow - 45 * 60 * 1000, amount: 900 },
    { time: exactPitchStart, amount: 1000 },
    { time: exactPitchStart + (alignedSpan * 5) / 205, amount: 1200 },
    { time: fixedNow - 30 * 60 * 1000, amount: 1500 },
  ]);
  const exactPitchBars = exactPitchChart.children[0].children.filter((node) => String(node.attrs.class || "").includes("ccm-context-history-bar"));
  assert.equal(exactPitchBars.length, 4, "events exactly five pixels apart must remain separate");


  const empty = render([{ time: fixedNow - 61 * 60 * 1000, amount: 1000 }]);
  assert.equal(empty.children[1].textContent, "No spend in the last hour");
  console.log("context history time-bar render: OK");
} finally {
  Date.now = originalNow;
}
