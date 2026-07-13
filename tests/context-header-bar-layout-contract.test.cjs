const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "codex-context-used-meter.js"), "utf8");
const between = (startMarker, endMarker) => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `missing ${startMarker}`);
  assert.ok(end > start, `missing ${endMarker} after ${startMarker}`);
  return source.slice(start, end);
};

assert.match(source, /const DEFAULT_FLOATING_UI = \{\s*mode: "header",/);
const readUiState = between("function readUiState()", "function writeUiState()");
assert.match(readUiState, /input\.mode === "floating" \|\| input\.mode === "inline" \|\| input\.mode === "header"/);
assert.match(readUiState, /: DEFAULT_FLOATING_UI\.mode/);
const setUiMode = between("function setUiMode(mode)", "function setUiTheme(theme)");
assert.match(setUiMode, /mode === "floating" \|\| mode === "inline" \? mode : "header"/);
assert.match(source, /createRadioItem\("mode", "header", "Header mode"/);

const headerFinder = between("function findHeaderMount()", "function positionHeaderRoot(root)");
assert.match(source, /function isHeaderTitleCandidate\(/);
assert.match(source, /function hasIndependentHeaderControls\(/);
assert.match(headerFinder, /isHeaderTitleCandidate\(node, rect\)/);
assert.match(headerFinder, /hasIndependentHeaderControls\(parent, title\)/);
assert.match(headerFinder, /return best && \{ parent: best\.parent, title: best\.title, before: best\.before, available: best\.available \}/);
assert.doesNotMatch(headerFinder, /daily|coordinator|ring\s*restore|provider/i);
const titleBoundary = between("function headerTitleContentRight(rail, title)", "function isHeaderTitleCandidate(");
assert.match(titleBoundary, /titleBranch\.querySelectorAll\("button, \[role='button'\], a"\)/);
assert.match(titleBoundary, /right = Math\.max\(right, rect\.right\)/);
assert.doesNotMatch(titleBoundary, /titleBranch\.getBoundingClientRect/);
assert.match(source, /railRect\.left \+ railRect\.width \* 0\.62/);

const positionHeader = between("function positionHeaderRoot(root)", "function rootContainsNode(node)");
assert.match(positionHeader, /root\.parentNode !== document\.body/);
assert.match(positionHeader, /const stableSlotLeft = hostRect\.left \+ Math\.max\(/);
assert.match(positionHeader, /HEADER_STABLE_SLOT_MIN_OFFSET/);
assert.match(positionHeader, /hostRect\.width \* HEADER_STABLE_SLOT_RATIO/);
assert.match(positionHeader, /const targetLeft = Math\.max\(stableSlotLeft, titleRight \+ HEADER_TITLE_GAP\);/);
assert.match(positionHeader, /hostRect\.left \+ HEADER_SAFE_LEFT_INSET/);
assert.match(positionHeader, /hostRect\.right - HEADER_CONTROL_GAP/);
assert.match(positionHeader, /controlRect\.left - HEADER_CONTROL_GAP/);
assert.match(positionHeader, /clampNumber\(/);
assert.match(positionHeader, /hostRect\.top \+ hostRect\.height \/ 2/);
assert.match(positionHeader, /available < HEADER_MIN_CARD_WIDTH/);

const mountRoot = between("function mountRoot(root)", "function applyFloatingUiState(root)");
const headerBranch = mountRoot.slice(0, mountRoot.indexOf('if (state.uiState.mode === "floating")'));
assert.match(headerBranch, /const mount = findHeaderMount\(\);/);
assert.match(headerBranch, /root\.dataset\.placement = "header"/);
assert.match(headerBranch, /state\.headerMountPending = true;/);
assert.match(headerBranch, /root\.hidden = true;/);
assert.match(headerBranch, /scheduleUpdate\(SWITCH_RETRY_INTERVAL_MS\);/);
assert.match(headerBranch, /document\.body\.appendChild\(root\)/);
assert.match(headerBranch, /state\.headerTitle = mount\.title/);
assert.match(headerBranch, /positionHeaderRoot\(root\)/);
assert.doesNotMatch(headerBranch, /mount\.parent\.insertBefore/);
assert.match(source, /root\.parentNode !== document\.body/);
assert.doesNotMatch(headerBranch, /findInlineMount\(/);
assert.match(source, /function isHeaderMountCurrent\(root\)/);
assert.match(source, /state\.headerHost/);
assert.match(source, /state\.headerTitle/);
assert.match(source, /state\.headerBefore/);
assert.match(source, /state\.headerMountPending && uiMode === "header"/);

const cssStart = source.indexOf('#${ROOT_ID}[data-placement="header"]');
const cssEnd = source.indexOf('#${ROOT_ID}[data-placement="floating"]', cssStart);
assert.ok(cssStart >= 0 && cssEnd > cssStart, "header placement CSS must precede floating CSS");
const headerCss = source.slice(cssStart, cssEnd);
assert.match(headerCss, /position:\s*fixed;/);
assert.match(headerCss, /left:\s*var\(--ccm-header-left/);
assert.match(headerCss, /top:\s*var\(--ccm-header-top/);
assert.match(headerCss, /transform:\s*translateY\(-50%\)/);
assert.match(headerCss, /\.ccm-context-card \{[\s\S]*width:\s*100%/);
assert.match(headerCss, /\.ccm-context-card \.ccm-value \{[\s\S]*display:\s*block/);
assert.match(headerCss, /\.ccm-context-card \.ccm-track \{[\s\S]*display:\s*block/);
assert.match(headerCss, /\.ccm-context-card \.ccm-ring \{[\s\S]*display:\s*none !important/);
assert.doesNotMatch(headerCss, /ccm-provider/i);

const portalPositioning = between("function clampHistoryPanelToViewport(root)", "function openSpendHistory()");
assert.match(portalPositioning, /state\.contextCard && !state\.contextCard\.hidden/);
assert.match(portalPositioning, /const preferredLeft = anchorRect\.left \+ anchorRect\.width \/ 2 - panelWidth \/ 2;/);
assert.match(portalPositioning, /clampNumber\(\s*preferredLeft,/);

assert.doesNotMatch(headerFinder, /daily|coordinator|ring\s*restore|provider/i);
assert.match(source, /function renderProviderMeter\(/);
assert.match(source, /function readProviderSummary\(/);
assert.match(source, /function installProviderSummaryListener\(/);
console.log("context header bar layout contract: OK");


