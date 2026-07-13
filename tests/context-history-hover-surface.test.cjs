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

class FakeSurface {
  constructor() {
    this.nodeType = 1;
    this.hidden = false;
    this.isConnected = true;
    this.dataset = { historyOpen: "false" };
    this.listeners = new Map();
    this.children = new Set();
    this.attributes = new Map();
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  contains(node) {
    return node === this || this.children.has(node);
  }

  emit(type, relatedTarget = null) {
    for (const listener of this.listeners.get(type) || []) listener({ type, relatedTarget });
  }

  listenerCount(type) {
    return this.listeners.get(type)?.size || 0;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
}

function makeHarness() {
  const root = new FakeSurface();
  const portal = new FakeSurface();
  const panel = new FakeSurface();
  portal.children.add(panel);

  const state = {
    root,
    historyPortal: portal,
    historyPanel: panel,
    historyCloseTimer: 0,
    historyPointerInside: false,
    historyFocusInside: false,
    historyHoverCleanup: null,
  };

  let nextTimerId = 1;
  const timers = new Map();
  const fakeWindow = new FakeSurface();
  const fakeDocument = new FakeSurface();
  fakeWindow.setTimeout = (callback) => {
    const timerId = nextTimerId;
    nextTimerId += 1;
    timers.set(timerId, callback);
    return timerId;
  };
  fakeWindow.clearTimeout = (timerId) => timers.delete(timerId);

  const code = between("function openSpendHistory()", "function clearSpendEffects()");
  const lifecycle = new Function(
    "state",
    "window",
    "document",
    "ensureHistoryPortal",
    "renderSpendHistory",
    "clampHistoryPanelToViewport",
    "HISTORY_CLOSE_GRACE_MS",
    `${code}; return { openSpendHistory, closeSpendHistory, installHistoryHover };`,
  )(
    state,
    fakeWindow,
    fakeDocument,
    () => {
      state.historyPortal = portal;
      state.historyPanel = panel;
      return portal;
    },
    () => {},
    () => {},
    120,
  );

  const flushTimers = () => {
    const pending = Array.from(timers.values());
    timers.clear();
    for (const callback of pending) callback();
  };

  lifecycle.installHistoryHover(root);
  return { state, root, portal, panel, fakeWindow, fakeDocument, flushTimers, ...lifecycle };
}

test("the card and detached history portal form one pointer surface", () => {
  const { root, portal, panel, state, flushTimers } = makeHarness();

  root.emit("pointerenter");
  assert.equal(root.dataset.historyOpen, "true");
  assert.equal(portal.dataset.historyOpen, "true");

  root.emit("pointerleave", panel);
  panel.emit("pointerenter", root);
  flushTimers();
  assert.equal(root.dataset.historyOpen, "true", "crossing from the card to the panel must keep the panel open");

  panel.emit("pointerleave");
  assert.equal(root.dataset.historyOpen, "true", "close grace must avoid flicker at the panel edge");
  flushTimers();
  assert.equal(root.dataset.historyOpen, "false");
  assert.equal(state.historyCloseTimer, 0);
});

test("entering the panel during close grace cancels the pending close", () => {
  const { root, portal, panel, flushTimers } = makeHarness();

  root.emit("pointerenter");
  root.emit("pointerleave");
  panel.emit("pointerenter");
  flushTimers();

  assert.equal(root.dataset.historyOpen, "true");
  assert.equal(portal.dataset.historyOpen, "true");
});

test("keyboard focus on a history bar keeps the panel open after the pointer leaves", () => {
  const { root, panel, state, flushTimers } = makeHarness();
  const outside = new FakeSurface();

  root.emit("pointerenter");
  panel.emit("focusin");
  panel.emit("pointerleave", outside);
  flushTimers();
  assert.equal(root.dataset.historyOpen, "true", "focused chart controls remain interactive");

  panel.emit("focusout", outside);
  flushTimers();
  assert.equal(root.dataset.historyOpen, "false");
  assert.equal(state.historyFocusInside, false);
});

test("window blur closes immediately and cleanup removes every surface listener", () => {
  const { root, panel, fakeWindow, fakeDocument, state, flushTimers, installHistoryHover } = makeHarness();

  root.emit("pointerenter");
  root.emit("pointerleave");
  fakeWindow.emit("blur");
  assert.equal(root.dataset.historyOpen, "false", "blur must not wait for close grace");
  flushTimers();
  assert.equal(root.dataset.historyOpen, "false");

  installHistoryHover(root);
  assert.equal(root.listenerCount("pointerenter"), 1);
  assert.equal(panel.listenerCount("focusin"), 1);
  assert.equal(fakeWindow.listenerCount("blur"), 1, "reinstalling on the same root must not duplicate listeners");
  assert.equal(fakeDocument.listenerCount("mouseleave"), 1);

  state.historyHoverCleanup();
  assert.equal(root.listenerCount("pointerenter"), 0);
  assert.equal(root.listenerCount("pointerleave"), 0);
  assert.equal(root.listenerCount("focusin"), 0);
  assert.equal(root.listenerCount("focusout"), 0);
  assert.equal(panel.listenerCount("pointerenter"), 0);
  assert.equal(panel.listenerCount("focusin"), 0);
  assert.equal(fakeWindow.listenerCount("blur"), 0);
  assert.equal(fakeDocument.listenerCount("mouseleave"), 0);
});

test("the lifecycle no longer uses document-wide pointer movement and closes on transaction changes", () => {
  const tracker = between("function installHistoryPointerTracker(root)", "function installHistoryHover(root)");
  assert.doesNotMatch(tracker, /document\.addEventListener\("(?:pointermove|pointerdown)"/);
  assert.match(tracker, /document\.addEventListener\("mouseleave"/);
  assert.match(tracker, /document\.removeEventListener\("mouseleave"/);
  assert.match(tracker, /surface\.addEventListener\("pointerenter"/);
  assert.match(tracker, /surface\.addEventListener\("pointerleave"/);
  assert.match(tracker, /surface\.addEventListener\("focusin"/);
  assert.match(tracker, /surface\.addEventListener\("focusout"/);

  const activation = between("function activateConversationId(", "function retainConversationId(");
  assert.match(activation, /window\.clearTimeout\(state\.historyCloseTimer\)/);
  assert.match(activation, /state\.root\.dataset\.historyOpen = "false"/);
  assert.match(activation, /state\.historyPortal\.dataset\.historyOpen = "false"/);
  assert.match(activation, /state\.historyPanel\.setAttribute\("aria-hidden", "true"\)/);

  const destroy = between("destroy() {", "getState() {");
  assert.match(destroy, /closeSpendHistory\(\)/, "destroy must close the portal before removing listeners");
  assert.match(destroy, /state\.historyHoverCleanup\(\)/);
});
