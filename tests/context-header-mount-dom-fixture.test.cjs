const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(
  path.join(__dirname, "..", "codex-context-used-meter.js"),
  "utf8",
);

const ROOT_ID = "codex-context-meter";
const HISTORY_PORTAL_ID = "codex-context-meter-history-portal";
const HEADER_CONTROL_GAP = 12;
const HEADER_TITLE_GAP = 18;
const HEADER_STABLE_SLOT_MIN_OFFSET = 210;
const HEADER_STABLE_SLOT_RATIO = 0.18;
const HEADER_SAFE_LEFT_INSET = 140;
const HEADER_MIN_CARD_WIDTH = 150;
const HEADER_NORMAL_CARD_WIDTH = 260;

function between(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `missing ${startMarker}`);
  assert.ok(end > start, `missing ${endMarker} after ${startMarker}`);
  return source.slice(start, end);
}

function dataKey(name) {
  return name
    .slice("data-".length)
    .split("-")
    .map((part, index) => index === 0 ? part : part[0].toUpperCase() + part.slice(1))
    .join("");
}

class FixtureElement {
  constructor(tagName, options = {}) {
    this.tagName = tagName.toUpperCase();
    this.id = options.id || "";
    this.className = options.className || "";
    this.textContent = options.textContent || "";
    this.role = options.role || "";
    this.testId = options.testId || "";
    this.rect = { ...options.rect };
    this.children = [];
    this.parentElement = null;
    this.dataset = { ...(options.dataset || {}) };
    this.attributes = new Map();
    this.hidden = false;
    this.style = {
      values: new Map(),
      setProperty: (name, value) => this.style.values.set(name, String(value)),
    };
  }

  get parentNode() {
    return this.parentElement;
  }

  get nextSibling() {
    if (!this.parentElement) return null;
    const index = this.parentElement.children.indexOf(this);
    return index >= 0 ? this.parentElement.children[index + 1] || null : null;
  }

  get isConnected() {
    for (let current = this; current; current = current.parentElement) {
      if (current.tagName === "BODY") return true;
    }
    return false;
  }

  appendChild(child) {
    return this.insertBefore(child, null);
  }

  insertBefore(child, before) {
    if (child.parentElement) {
      const previousIndex = child.parentElement.children.indexOf(child);
      if (previousIndex >= 0) child.parentElement.children.splice(previousIndex, 1);
    }
    const index = before ? this.children.indexOf(before) : -1;
    if (before && index < 0) throw new Error("fixture insertBefore target is not a child");
    child.parentElement = this;
    if (index < 0) this.children.push(child);
    else this.children.splice(index, 0, child);
    return child;
  }

  contains(node) {
    for (let current = node; current; current = current.parentElement) {
      if (current === this) return true;
    }
    return false;
  }

  setAttribute(name, value) {
    const stringValue = String(value);
    this.attributes.set(name, stringValue);
    if (name.startsWith("data-")) this.dataset[dataKey(name)] = stringValue;
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name.startsWith("data-")) delete this.dataset[dataKey(name)];
  }

  getBoundingClientRect() {
    const left = this.rect.left || 0;
    const top = this.rect.top || 0;
    const width = this.rect.width || 0;
    const height = this.rect.height || 0;
    return {
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    };
  }

  matches(selector) {
    return selector.split(",").some((part) => this.matchesOne(part.trim()));
  }

  matchesOne(selector) {
    if (selector.startsWith("#")) return this.id === selector.slice(1);
    if (selector === "header" || selector === "aside" || selector === "nav" ||
        selector === "button" || selector === "a" || selector === "h1" ||
        selector === "h2" || selector === "h3" || selector === "span") {
      return this.tagName === selector.toUpperCase();
    }
    if (selector === "[role='banner']") return this.role === "banner";
    if (selector === "[role='button']") return this.role === "button";
    if (selector === "[role='heading']") return this.role === "heading";
    if (selector === "[data-testid*='header']") return this.testId.includes("header");
    if (selector === "[data-testid*='title']") return this.testId.includes("title");
    if (selector === "[class*='header']") return this.className.includes("header");
    if (selector === "[class*='title']") return this.className.includes("title");
    return false;
  }

  closest(selector) {
    for (let current = this; current; current = current.parentElement) {
      if (current.matches(selector)) return current;
    }
    return null;
  }

  querySelectorAll(selector) {
    const result = [];
    const visit = (node) => {
      for (const child of node.children) {
        if (child.matches(selector)) result.push(child);
        visit(child);
      }
    };
    visit(this);
    return result;
  }
}

function makeFixture({ includeAdjacentAction = true, coordinatorManaged = false } = {}) {
  const body = new FixtureElement("body", { rect: { left: 0, top: 0, width: 1440, height: 900 } });
  const outerHeader = new FixtureElement("header", {
    className: "app-header",
    rect: { left: 180, top: 40, width: 1080, height: 64 },
  });
  const titleRail = new FixtureElement("div", {
    className: "conversation-title-rail",
    rect: { left: 200, top: 44, width: 1020, height: 56 },
  });
  const titleBranch = new FixtureElement("div", {
    className: "title-local-controls",
    rect: { left: 210, top: 48, width: 250, height: 48 },
  });
  const title = new FixtureElement("h1", {
    textContent: "当前任务标题",
    rect: { left: 220, top: 58, width: 126, height: 24 },
  });
  const adjacentAction = new FixtureElement("button", {
    textContent: "任务操作",
    rect: { left: 356, top: 54, width: 38, height: 32 },
  });
  const rightControls = new FixtureElement("div", {
    className: "header-right-controls",
    rect: { left: 980, top: 48, width: 220, height: 48 },
  });
  const openLocation = new FixtureElement("button", {
    textContent: "打开位置",
    rect: { left: 994, top: 54, width: 92, height: 32 },
  });
  const root = new FixtureElement("div", {
    id: ROOT_ID,
    rect: { left: 0, top: 0, width: 260, height: 48 },
  });

  body.appendChild(outerHeader);
  outerHeader.appendChild(titleRail);
  titleRail.appendChild(titleBranch);
  titleBranch.appendChild(title);
  if (includeAdjacentAction) titleBranch.appendChild(adjacentAction);
  titleRail.appendChild(rightControls);
  rightControls.appendChild(openLocation);
  body.appendChild(root);

  if (coordinatorManaged) {
    root.setAttribute("data-codex-rail-managed", "true");
    root.dataset.layout = "rail-managed";
    root.dataset.placement = "rail-managed";
  }

  const document = {
    body,
    documentElement: { clientWidth: 1440, clientHeight: 900 },
    querySelectorAll: (selector) => body.querySelectorAll(selector),
    getElementById: (id) => body.querySelectorAll(`#${id}`)[0] || null,
  };
  return {
    document,
    body,
    outerHeader,
    titleRail,
    titleBranch,
    title,
    adjacentAction,
    rightControls,
    openLocation,
    root,
  };
}

function makeHeaderLayout(fixture, state = { root: fixture.root }) {
  const code = between("function directChildOf(parent, node)", "function isHeaderMountCurrent(root)");
  return new Function(
    "document",
    "window",
    "Element",
    "isVisibleElement",
    "ROOT_ID",
    "HISTORY_PORTAL_ID",
    "HEADER_EDGE_GAP",
    "HEADER_CONTROL_GAP",
    "HEADER_TITLE_GAP",
    "HEADER_STABLE_SLOT_MIN_OFFSET",
    "HEADER_STABLE_SLOT_RATIO",
    "HEADER_SAFE_LEFT_INSET",
    "HEADER_MIN_CARD_WIDTH",
    "HEADER_NORMAL_CARD_WIDTH",
    "clampNumber",
    "state",
    `${code}; return { findHeaderMount, positionHeaderRoot };`,
  )(
    fixture.document,
    { innerWidth: 1440, innerHeight: 900 },
    FixtureElement,
    (node) => {
      const rect = node.getBoundingClientRect();
      return !node.hidden && rect.width > 0 && rect.height > 0;
    },
    ROOT_ID,
    HISTORY_PORTAL_ID,
    16,
    HEADER_CONTROL_GAP,
    HEADER_TITLE_GAP,
    HEADER_STABLE_SLOT_MIN_OFFSET,
    HEADER_STABLE_SLOT_RATIO,
    HEADER_SAFE_LEFT_INSET,
    HEADER_MIN_CARD_WIDTH,
    HEADER_NORMAL_CARD_WIDTH,
    (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value)),
    state,
  );
}

function makeHeaderMounter(fixture) {
  const code = between("function mountRoot(root)", "function applyFloatingUiState(root)");
  const state = {
    root: fixture.root,
    uiState: { mode: "header" },
    headerHost: null,
    headerTitle: null,
    headerBefore: null,
    headerMountPending: false,
    inlineHost: null,
    inlineBefore: null,
    inlineMountCache: null,
    inlineMountPending: false,
  };
  const { findHeaderMount, positionHeaderRoot } = makeHeaderLayout(fixture, state);
  const mountRoot = new Function(
    "state",
    "readUiState",
    "findHeaderMount",
    "positionHeaderRoot",
    "document",
    "scheduleUpdate",
    "SWITCH_RETRY_INTERVAL_MS",
    "closeSpendHistory",
    "HEADER_MIN_CARD_WIDTH",
    "HEADER_NORMAL_CARD_WIDTH",
    "applyFloatingUiState",
    "refreshOpenSpendHistory",
    "findInlineMount",
    `${code}; return mountRoot;`,
  )(
    state,
    () => ({ mode: "header" }),
    findHeaderMount,
    positionHeaderRoot,
    fixture.document,
    () => {},
    700,
    () => {},
    HEADER_MIN_CARD_WIDTH,
    HEADER_NORMAL_CARD_WIDTH,
    () => {},
    () => {},
    () => null,
  );
  return { mountRoot, positionHeaderRoot, state };
}

test("uses the nearest common ancestor of the title and the distinct right-control branch", () => {
  const fixture = makeFixture();
  const { findHeaderMount } = makeHeaderLayout(fixture);
  const mount = findHeaderMount();

  assert.ok(mount, "the adjacent title-local action must not starve the distant right control");
  assert.equal(mount.parent, fixture.titleRail, "the inner title rail is the nearest common ancestor");
  assert.equal(mount.before, fixture.rightControls, "Context must mount before the distinct right-control branch");
  assert.ok(mount.available >= HEADER_MIN_CARD_WIDTH);
});

test("repeated refresh and mutation passes keep one deterministic header host", () => {
  const fixture = makeFixture();
  const { mountRoot, state } = makeHeaderMounter(fixture);
  const hosts = [];
  const leftPositions = [];

  for (let pass = 0; pass < 5; pass += 1) {
    mountRoot(fixture.root);
    hosts.push(fixture.root.parentElement);
    leftPositions.push(fixture.root.style.values.get("--ccm-header-left"));
    fixture.title.textContent = pass % 2 ? "当前任务标题" : "当前任务标题已加载";
  }

  assert.deepEqual(hosts, Array(5).fill(fixture.body), "header mode must keep one body-fixed owner across refreshes");
  assert.deepEqual(leftPositions, Array(5).fill("412px"), "a short title group must keep the stable v81 title-after anchor across refreshes");
  assert.equal(state.headerHost, fixture.titleRail);
  assert.equal(state.headerTitle, fixture.title);
  assert.equal(state.headerBefore, fixture.rightControls);
  assert.equal(fixture.root.style.values.get("--ccm-header-top"), "72px", "the card must stay vertically centered in the title rail");
  assert.equal(state.headerMountPending, false);
});

test("a stale Coordinator marker is released before v102 claims header ownership", () => {
  const fixture = makeFixture({ includeAdjacentAction: false, coordinatorManaged: true });
  const { mountRoot } = makeHeaderMounter(fixture);

  mountRoot(fixture.root);

  assert.equal(fixture.root.parentElement, fixture.body);
  assert.equal(fixture.root.dataset.placement, "header");
  assert.equal(fixture.root.hasAttribute("data-codex-rail-managed"), false, "one root must not advertise Coordinator and v102 ownership together");
  assert.notEqual(fixture.root.dataset.layout, "rail-managed");
});

test("a long title moves the card right only as far as collision avoidance requires", () => {
  const fixture = makeFixture();
  fixture.titleBranch.rect.width = 740;
  fixture.adjacentAction.rect = { left: 580, top: 54, width: 40, height: 32 };
  const { mountRoot, state } = makeHeaderMounter(fixture);

  mountRoot(fixture.root);

  assert.equal(fixture.root.parentElement, fixture.body);
  assert.equal(state.headerMountPending, false, "the flex branch box itself must not consume the safe region");
  assert.equal(state.headerBefore, fixture.rightControls);
  assert.equal(fixture.root.style.values.get("--ccm-header-width"), "260px");
  assert.equal(fixture.root.style.values.get("--ccm-header-left"), "638px", "the title-local action right edge plus the v81 18px title gap must clamp the card");
  assert.ok(Number.parseInt(fixture.root.style.values.get("--ccm-header-left"), 10) > 412, "a long title must move right from the normal v81 anchor");
  assert.equal(fixture.root.style.values.get("--ccm-header-top"), "72px");
  const cardLeft = Number.parseInt(fixture.root.style.values.get("--ccm-header-left"), 10);
  const cardWidth = Number.parseInt(fixture.root.style.values.get("--ccm-header-width"), 10);
  assert.ok(cardLeft + cardWidth <= fixture.rightControls.rect.left - HEADER_CONTROL_GAP);
});

test("header mode hides when the title and controls leave no safe card width", () => {
  const fixture = makeFixture();
  fixture.adjacentAction.rect = { left: 800, top: 54, width: 40, height: 32 };
  const { mountRoot, state } = makeHeaderMounter(fixture);

  mountRoot(fixture.root);

  assert.equal(state.headerMountPending, true);
  assert.equal(fixture.root.hidden, true);
  assert.equal(state.headerHost, null);
});


test("the history panel stays centered on the same Context card after header repositioning", () => {
  const code = between("function clampHistoryPanelToViewport(root)", "function openSpendHistory()");
  const fixture = makeFixture();
  const contextCard = new FixtureElement("div", {
    className: "ccm-context-card",
    rect: { left: 520, top: 48, width: 260, height: 48 },
  });
  const historyPanel = new FixtureElement("div", {
    className: "ccm-history-panel",
    rect: { left: 0, top: 0, width: 320, height: 220 },
  });
  fixture.root.appendChild(contextCard);
  const state = { contextCard, providerCard: null, historyPanel };
  const clampHistoryPanelToViewport = new Function(
    "state",
    "window",
    "document",
    "clampNumber",
    "HISTORY_PANEL_MIN_WIDTH",
    "HISTORY_PANEL_MIN_HEIGHT",
    "HISTORY_PANEL_VIEWPORT_PADDING",
    "HISTORY_PANEL_GAP",
    `${code}; return clampHistoryPanelToViewport;`,
  )(
    state,
    { innerWidth: 1440, innerHeight: 900 },
    fixture.document,
    (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value)),
    240,
    80,
    8,
    8,
  );

  clampHistoryPanelToViewport(fixture.root);
  const firstLeft = historyPanel.style.values.get("--ccm-history-left");
  fixture.root.rect.left = 800;
  clampHistoryPanelToViewport(fixture.root);
  const secondLeft = historyPanel.style.values.get("--ccm-history-left");

  assert.equal(firstLeft, "490px", "panel and Context card must share the same center axis");
  assert.equal(secondLeft, firstLeft, "moving the body-fixed root must not change the card-centered panel anchor");
});
