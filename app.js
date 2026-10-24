/* Paletto — harmonious colour palette generator.
   Colours are generated in HSL around a random base hue (analogous, complementary, triadic,
   split-complementary or monochrome) and exported as hex. Saved palettes live in localStorage. */

const SAVED_KEY = "paletto.saved";
const MIN_COLORS = 1;
const MAX_COLORS = 8;

let count = 5;
let currentColors = [];
let saved = [];

// Swatch index -> hex. Locked swatches survive the next Generate.
const locks = new Map();

const decBtn = document.getElementById("decreaseBtn");
const incBtn = document.getElementById("increaseBtn");
const colorCount = document.getElementById("colorCount");
const generateBtn = document.getElementById("generateBtn");
const saveBtn = document.getElementById("saveBtn");
const exportBtn = document.getElementById("exportBtn");
const harmonySelect = document.getElementById("harmonySelect");
const strip = document.getElementById("paletteStrip");
const savedGrid = document.getElementById("savedGrid");
const savedCount = document.getElementById("savedCount");
const pageToast = document.getElementById("pageToast");
const unlockBtn = document.getElementById("unlockBtn");

let toastTimer = null;

/* ── colour helpers ── */
function hslToHex(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const light = Math.min(100, Math.max(0, l)) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let r = 0, g = 0, b = 0;
  if (hue < 60)       [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else                [r, g, b] = [c, 0, x];

  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();

  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

/* ── WCAG contrast ── */
const INK = "#111111";
const PAPER = "#FFFFFF";

function hexToRgb(hex) {
  const value = parseInt(String(hex).replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* WCAG 2.1 grades: AAA ≥ 7, AA ≥ 4.5, AA for large text ≥ 3. */
function gradeFor(ratio) {
  if (ratio >= 7) return { label: "AAA", className: "grade-aaa" };
  if (ratio >= 4.5) return { label: "AA", className: "grade-aa" };
  if (ratio >= 3) return { label: "AA large", className: "grade-lg" };
  return { label: "low", className: "grade-low" };
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/* ── harmony ── */
const HARMONIES = {
  // neighbours: the whole row stays inside a 60° arc of the wheel
  analogous: (base, i, total) => base + i * (60 / Math.max(1, total - 1)),
  complementary: (base, i) => base + (i % 2 ? 180 : 0) + (i > 1 ? i * 8 : 0),
  triadic: (base, i) => base + (i % 3) * 120,
  split: (base, i) => base + (i % 3 === 0 ? 0 : i % 3 === 1 ? 150 : 210),
  monochrome: (base) => base
};

function generateColors(total, harmonyChoice) {
  const harmony =
    harmonyChoice === "auto" ? pickRandom(Object.keys(HARMONIES)) : harmonyChoice;

  const base = Math.floor(Math.random() * 360);
  const colors = [];

  for (let i = 0; i < total; i++) {
    const hue = HARMONIES[harmony](base, i, total);

    let saturation;
    let lightness;

    if (harmony === "monochrome") {
      // same hue, spread across light to dark
      const step = total > 1 ? i / (total - 1) : 0.5;
      saturation = randomBetween(45, 70);
      lightness = 18 + step * 62;
    } else {
      saturation = randomBetween(48, 78);
      lightness = randomBetween(38, 72);
    }

    colors.push(hslToHex(hue, Math.round(saturation), Math.round(lightness)));
  }

  return { colors, harmony };
}

/* ── rendering: palette strip ── */
const LOCK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" ' +
  'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

function renderPalette(colors) {
  currentColors = colors.slice();
  strip.replaceChildren();

  colors.forEach((hex, index) => {
    const card = document.createElement("div");
    card.className = "color-card";
    card.style.background = hex;
    card.dataset.hex = hex;
    card.dataset.index = String(index);

    // Legibility first: the better of black or white text, plus its grade.
    const onInk = contrastRatio(hex, INK);
    const onPaper = contrastRatio(hex, PAPER);
    const bestIsInk = onInk >= onPaper;
    const bestRatio = Math.max(onInk, onPaper);
    const grade = gradeFor(bestRatio);

    card.classList.add(bestIsInk ? "dark-text" : "light-text");

    const info = document.createElement("div");
    info.className = "color-info";

    const label = document.createElement("span");
    label.className = "color-hex";
    label.textContent = hex;

    const contrast = document.createElement("span");
    contrast.className = "contrast-badge " + grade.className;
    contrast.textContent = grade.label + " \u00b7 " + bestRatio.toFixed(1) + ":1";
    contrast.title =
      `Contrast against ${bestIsInk ? "black" : "white"} text: ${bestRatio.toFixed(2)}:1 ` +
      `(${grade.label}) — WCAG 2.1: AA needs 4.5:1, AAA needs 7:1.`;

    const buttons = document.createElement("span");
    buttons.className = "card-actions";

    const lock = document.createElement("button");
    lock.className = "lock-btn";
    lock.type = "button";
    lock.dataset.lockIndex = String(index);
    lock.innerHTML = LOCK_ICON;
    lock.title = "Keep this colour when regenerating";
    lock.setAttribute("aria-label", "Lock " + hex);
    lock.setAttribute("aria-pressed", locks.has(index) ? "true" : "false");
    if (locks.has(index)) card.classList.add("is-locked");
    // (syncLockUI keeps this in step after the first render)

    const copy = document.createElement("button");
    copy.className = "copy-btn";
    copy.type = "button";
    copy.title = "Copy " + hex;
    copy.setAttribute("aria-label", "Copy " + hex);
    copy.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">' +
      '<rect x="9" y="9" width="13" height="13" rx="2"/>' +
      '<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';

    const toast = document.createElement("div");
    toast.className = "copy-toast";
    toast.textContent = "Copied!";

    buttons.append(lock, copy);
    info.append(label, contrast, buttons);
    card.append(info, toast);
    strip.appendChild(card);
  });
}

/* ── rendering: saved palettes ── */
function loadSaved() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_KEY));
    saved = Array.isArray(stored)
      ? stored.filter((item) => item && Array.isArray(item.colors) && item.colors.length)
      : [];
  } catch {
    saved = [];
  }
}

function persistSaved() {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  } catch {
    showPageToast("Storage is full — palette not saved.", true);
  }
}

function renderSaved() {
  savedCount.textContent = `${saved.length} saved`;
  savedGrid.replaceChildren();

  if (saved.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.id = "emptyState";
    empty.innerHTML =
      '<div class="empty-icon">◎</div><p>No palettes saved yet.<br/>Hit <strong>Save</strong> to keep one.</p>';
    savedGrid.appendChild(empty);
    return;
  }

  saved.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "saved-card";
    card.dataset.id = entry.id;

    const stripEl = document.createElement("div");
    stripEl.className = "saved-card-strip";
    entry.colors.forEach((hex) => {
      const span = document.createElement("span");
      span.style.background = hex;
      span.dataset.hex = hex;
      span.title = hex;
      stripEl.appendChild(span);
    });

    const meta = document.createElement("div");
    meta.className = "saved-card-meta";

    const label = document.createElement("span");
    label.className = "saved-card-label";
    label.textContent = entry.colors.length + " colors";

    const del = document.createElement("button");
    del.className = "saved-card-del";
    del.type = "button";
    del.title = "Delete palette";
    del.setAttribute("aria-label", "Delete palette");
    del.textContent = "✕";

    meta.append(label, del);
    card.append(stripEl, meta);
    savedGrid.appendChild(card);
  });
}

/* ── toast ── */
function showPageToast(message, isError = false) {
  pageToast.textContent = message;
  pageToast.classList.toggle("error", Boolean(isError));
  pageToast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => pageToast.classList.remove("show"), 2000);
}

/* ── actions ── */
function generate() {
  const { colors, harmony } = generateColors(count, harmonySelect.value);

  // Locked swatches keep their colour and their slot; only the rest are refreshed.
  const next = colors.map((hex, index) => (locks.has(index) ? locks.get(index) : hex));

  renderPalette(next);
  harmonySelect.dataset.lastHarmony = harmony;
}

function toggleLock(index, hex) {
  if (locks.has(index)) {
    locks.delete(index);
  } else {
    locks.set(index, hex);
  }

  syncLockUI();

  const lockedCount = locks.size;
  showPageToast(
    lockedCount === 0
      ? "All swatches unlocked."
      : `${lockedCount} swatch${lockedCount === 1 ? "" : "es"} locked.`,
    false
  );
}

function clearLocks() {
  locks.clear();
  syncLockUI();
}

/* Lock UI: swatch classes, and the "Unlock all" control. */
function syncLockUI() {
  strip.querySelectorAll(".color-card").forEach((card) => {
    const index = Number(card.dataset.index);
    const locked = locks.has(index);
    card.classList.toggle("is-locked", locked);
    const lockBtn = card.querySelector(".lock-btn");
    if (lockBtn) {
      lockBtn.setAttribute("aria-pressed", String(locked));
      lockBtn.title = locked
        ? "Unlock — this colour changes on the next Generate"
        : "Keep this colour when regenerating";
    }
  });

  if (unlockBtn) unlockBtn.disabled = locks.size === 0;
}

function setCount(next) {
  count = Math.min(MAX_COLORS, Math.max(MIN_COLORS, next));
  colorCount.textContent = count;

  // A shorter palette cannot carry locks past its last swatch.
  [...locks.keys()].forEach((index) => {
    if (index >= count) locks.delete(index);
  });

  // The strip is re-rendered on the next Generate; keep its lock marks honest now.
  syncLockUI();
}

async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    return true;
  } catch {
    return false;
  }
}

function saveCurrentPalette() {
  if (currentColors.length === 0) {
    showPageToast("Generate a palette first.", true);
    return;
  }

  const signature = currentColors.join(",");
  if (saved.some((entry) => entry.colors.join(",") === signature)) {
    showPageToast("That palette is already saved.");
    return;
  }

  saved.unshift({ id: Date.now(), colors: currentColors.slice() });
  persistSaved();
  renderSaved();
  showPageToast("Palette saved.");
}

/* ── events ── */
decBtn.addEventListener("click", () => setCount(count - 1));
incBtn.addEventListener("click", () => setCount(count + 1));

generateBtn.addEventListener("click", generate);
saveBtn.addEventListener("click", saveCurrentPalette);

if (unlockBtn) {
  unlockBtn.addEventListener("click", () => {
    if (locks.size === 0) return;
    clearLocks();
    showPageToast("All swatches unlocked.");
  });
}

exportBtn.addEventListener("click", async () => {
  if (currentColors.length === 0) {
    showPageToast("Nothing to export yet.", true);
    return;
  }
  const ok = await copyText(currentColors.join(", "));
  showPageToast(
    ok ? currentColors.length + " hex codes copied" : "Couldn’t copy — select manually.",
    !ok
  );
});

/* lock or copy a swatch */
strip.addEventListener("click", async (event) => {
  const lockButton = event.target.closest(".lock-btn");
  if (lockButton) {
    const index = Number(lockButton.dataset.lockIndex);
    const card = lockButton.closest(".color-card");
    toggleLock(index, card.dataset.hex);
    return;
  }

  const button = event.target.closest(".copy-btn");
  if (!button) return;

  const card = button.closest(".color-card");
  const hex = card.dataset.hex;

  const ok = await copyText(hex);
  const toast = card.querySelector(".copy-toast");
  toast.textContent = ok ? "Copied!" : "Copy failed";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1400);
});

/* saved palettes: load on click, delete on ✕ */
savedGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".saved-card");
  if (!card) return;

  if (event.target.closest(".saved-card-del")) {
    saved = saved.filter((entry) => String(entry.id) !== card.dataset.id);
    persistSaved();
    renderSaved();
    showPageToast("Palette deleted.");
    return;
  }

  const hexes = [...card.querySelectorAll(".saved-card-strip span")].map(
    (span) => span.dataset.hex || span.style.background
  );
  if (hexes.length === 0) return;

  setCount(hexes.length);
  clearLocks(); // a loaded palette is its own truth — start with no locks
  renderPalette(hexes);
  showPageToast("Palette loaded.");
});

/* space bar = generate, but never while typing or on a focused control */
document.addEventListener("keydown", (event) => {
  if (event.key !== " " || event.repeat) return;

  const tag = (event.target.tagName || "").toLowerCase();
  const isControl =
    ["input", "textarea", "select", "button", "a"].includes(tag) ||
    event.target.isContentEditable;

  if (isControl) return;

  event.preventDefault();
  generate();
});

/* ── boot ── */
setCount(5);
loadSaved();
renderSaved();
generate();
