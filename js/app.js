/**
 * Tool page interaction: form-based templates + three upload channels +
 * generate/download/copy. Engine: engine.js; strings/languages: i18n.js.
 */
import * as engine from './engine.js';
import { t, setLang, initLang, currentLang } from './i18n.js';
import { initAnalytics, track } from './analytics.js';

const $ = id => document.getElementById(id);
const MAX_FILES = 20; // sequential pipeline releases per file, memory-safe

const state = {
  files: [],        // File objects to process
  rotations: [],    // parallel to files: manual rotation per image (0/90/180/270)
  thumbUrls: [],    // thumbnail objectURLs (for revoke)
  results: [],      // generated results { blob, url, name }
  userEditedText: false,
  color: engine.DEFAULTS.color, // current color (single source: engine.DEFAULTS)
  previewSrc: null,      // live-preview source (downscaled canvas)
  previewFileRef: null,  // tracks which file the preview shows
};

/* ---------- Toast ---------- */

function toast(msg, type = 'info') {
  let root = $('toastRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toastRoot';
    root.className = 'toast-root';
    document.body.appendChild(root);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

/* ---------- Form-based template texts ---------- */

function composeText() {
  const sel = $('purpose');
  let purpose = sel.value;
  if (purpose === '__custom') {
    purpose = ($('customPurpose').value || '').trim() || '________';
  }
  const d = $('date').value; // yyyy-mm-dd
  let dateStr = '';
  if (d) {
    const [y, m, day] = d.split('-').map(Number);
    dateStr = currentLang === 'en'
      ? `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : `${y}年${m}月${day}日`;
  }
  const tmpl = currentLang === 'en'
    ? `For ${purpose} use only\n${dateStr}`
    : `仅用于${purpose}，他用无效${dateStr ? '\n' + dateStr : ''}`;
  return tmpl;
}

function syncText(force = false) {
  if (force || !state.userEditedText) {
    $('text').value = composeText();
    state.userEditedText = false;
  }
}

/* ---------- Upload: click / drag / paste ---------- */

function addFiles(fileList) {
  const imgs = Array.from(fileList).filter(f => f.type && f.type.startsWith('image/'));
  if (!imgs.length) return;
  const room = MAX_FILES - state.files.length;
  if (room <= 0) { toast(t('errMaxFiles'), 'warn'); return; }
  const take = imgs.slice(0, room);
  state.files = state.files.concat(take);
  state.rotations = state.rotations.concat(take.map(() => 0));
  if (imgs.length > room) toast(t('errMaxFiles'), 'warn');
  renderThumbs();
  updatePreviewSource();
}

function renderThumbs() {
  state.thumbUrls.forEach(u => URL.revokeObjectURL(u));
  state.thumbUrls = [];
  const box = $('thumbs');
  box.innerHTML = '';
  state.files.forEach((f, i) => {
    const url = URL.createObjectURL(f);
    state.thumbUrls.push(url);
    const wrap = document.createElement('div');
    wrap.className = 'thumb';
    const img = document.createElement('img');
    img.src = url;
    img.alt = f.name;
    img.loading = 'lazy';
    if (state.rotations[i]) img.style.transform = `rotate(${state.rotations[i]}deg)`;

    // per-image 90-degree rotation (the engine swaps canvas w/h)
    const rot = document.createElement('button');
    rot.className = 'thumb-rot';
    rot.innerHTML = '&#10227;';
    rot.title = t('rotate');
    rot.addEventListener('click', e => {
      e.stopPropagation();
      state.rotations[i] = ((state.rotations[i] || 0) + 90) % 360;
      img.style.transform = `rotate(${state.rotations[i]}deg)`;
    });

    const del = document.createElement('button');
    del.className = 'thumb-del';
    del.innerHTML = '&times;';
    del.title = f.name;
    del.addEventListener('click', e => {
      e.stopPropagation();
      state.files.splice(i, 1);
      state.rotations.splice(i, 1);
      renderThumbs();
      updatePreviewSource();
    });
    wrap.appendChild(img);
    wrap.appendChild(rot);
    wrap.appendChild(del);
    box.appendChild(wrap);
  });
  box.hidden = state.files.length === 0;
}

/* ---------- Live preview ---------- */

let previewTimer = null;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(renderLivePreview, 250); // debounce
}

/** Preview source = first image (long side downscaled to <=480, negligible re-render cost). */
async function updatePreviewSource() {
  const first = state.files[0] || null;
  if (first === state.previewFileRef) return;
  state.previewFileRef = first;
  state.previewSrc = null;
  if (!first) {
    $('livePreviewWrap').hidden = true;
    return;
  }
  try {
    const src = await engine.decodeImageFile(first);
    const S = { w: src.naturalWidth || src.width, h: src.naturalHeight || src.height };
    const f = Math.min(1, 480 / Math.max(S.w, S.h));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(S.w * f));
    c.height = Math.max(1, Math.round(S.h * f));
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    if (src.close) src.close();
    state.previewSrc = c;
    renderLivePreview();
  } catch (_) {
    $('livePreviewWrap').hidden = true;
  }
}

function renderLivePreview() {
  if (!state.previewSrc) return;
  try {
    const canvas = engine.applyWatermark(state.previewSrc, { ...readCfg(), rotate: state.rotations[0] || 0 });
    $('livePreview').replaceChildren(canvas);
    $('livePreviewWrap').hidden = false;
  } catch (err) {
    console.error(err);
  }
}

/* ---------- Virtual sample image (procedurally drawn only — never mimics a real ID layout) ---------- */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function makeSampleFile() {
  const c = document.createElement('canvas');
  c.width = 860;
  c.height = 560;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8eef7';
  ctx.fillRect(0, 0, 860, 560);
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 40, 40, 780, 480, 14);
  ctx.fill();
  ctx.strokeStyle = '#c9d6e8';
  ctx.lineWidth = 2;
  roundRect(ctx, 40, 40, 780, 480, 14);
  ctx.stroke();
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 30px "Microsoft YaHei", sans-serif';
  ctx.fillText('示例证件（虚拟）', 80, 110);
  ctx.font = '16px "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#9aa7b8';
  ctx.fillText('SAMPLE DOCUMENT · 仅用于工具演示', 80, 140);
  ctx.fillStyle = '#dbe6f3';
  ctx.fillRect(600, 170, 160, 200);
  ctx.strokeStyle = '#b9c9dd';
  ctx.strokeRect(600, 170, 160, 200);
  ctx.fillStyle = '#8fa3bd';
  ctx.font = '15px "Microsoft YaHei", sans-serif';
  ctx.fillText('照片区', 645, 280);
  ctx.fillStyle = '#6b7c92';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(80, 200 + i * 52, 90, 12);
    ctx.fillRect(200, 196 + i * 52, 300 + (i % 2) * 60, 20);
  }
  const blob = await engine.canvasToBlob(c, 'image/png');
  c.width = c.height = 0;
  return new File([blob], 'sample-cert.png', { type: 'image/png' });
}

/* ---------- Generate ---------- */

function readCfg() {
  const D = engine.DEFAULTS;
  // Density is a free numeric input; clamp to 2..10
  const densityRaw = parseInt($('density').value, 10);
  const density = Math.min(10, Math.max(2, Number.isFinite(densityRaw) ? densityRaw : D.density));
  return {
    text: $('text').value,
    mode: $('position').value,
    density,
    color: state.color,
    opacity: (parseInt($('opacity').value, 10) || D.opacityPct) / 100,
    sizePct: (parseFloat($('sizePct').value) || D.sizePct) / 100,
    angle: 45,
    strokeWidth: $('strokeToggle').checked ? 1 : 0,
  };
}

async function processFile(file, rotate = 0) {
  const src = await engine.decodeImageFile(file);
  // Huge-image guard probe: the engine downsamples internally; just report
  const w = src.width || src.naturalWidth || 0;
  const h = src.height || src.naturalHeight || 0;
  const downscaled = engine.downscaleFactor(w, h) < 1;
  const canvas = engine.applyWatermark(src, { ...readCfg(), rotate });
  if (src.close) src.close(); // release the ImageBitmap
  const type = engine.outputTypeFor(file);
  const blob = await engine.canvasToBlob(canvas, type, 0.92);
  canvas.width = canvas.height = 0; // release full-size pixels
  return {
    blob,
    url: URL.createObjectURL(blob),
    name: engine.makeWatermarkedName(file.name),
    downscaled,
  };
}

function renderResult(entry) {
  const card = document.createElement('div');
  card.className = 'result-card';

  const img = document.createElement('img');
  img.src = entry.url;
  img.alt = entry.name;
  img.loading = 'lazy';
  card.appendChild(img);

  const row = document.createElement('div');
  row.className = 'result-actions';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'name-input';
  nameInput.value = entry.name;
  nameInput.spellcheck = false;
  nameInput.setAttribute('aria-label', t('fileNameLabel'));
  row.appendChild(nameInput);

  const dl = document.createElement('button');
  dl.className = 'btn primary';
  dl.textContent = t('download');
  dl.addEventListener('click', () => {
    track('download');
    engine.downloadBlob(entry.blob, engine.ensureExt(nameInput.value.trim() || entry.name, entry.blob.type));
  });
  row.appendChild(dl);

  if (navigator.clipboard && window.ClipboardItem) {
    const cp = document.createElement('button');
    cp.className = 'btn ghost';
    cp.textContent = t('copy');
    cp.addEventListener('click', async () => {
      try {
        await engine.copyBlobToClipboard(entry.blob);
        track('copy');
        toast(t('copied'));
      } catch (err) {
        toast(err.message === 'UNSUPPORTED' ? t('copyUnsupported') : t('copyFailed'), 'warn');
      }
    });
    row.appendChild(cp);
  }

  card.appendChild(row);
  $('resultList').appendChild(card);
}

async function generate() {
  if (!state.files.length) {
    toast(t('errNoFile'), 'warn');
    $('dropZone').classList.add('warn');
    setTimeout(() => $('dropZone').classList.remove('warn'), 1500);
    return;
  }
  if (!$('text').value.trim()) {
    toast(t('errNoText'), 'warn');
    $('text').focus();
    return;
  }
  // Remember the last text (lightweight recall)
  try { localStorage.setItem('p1.lastText', $('text').value); } catch (_) {}

  clearResults();
  const btn = $('generateBtn');
  btn.disabled = true;
  btn.dataset.origText = btn.textContent;
  btn.textContent = t('processing');
  let downscaledCount = 0;
  try {
    for (let i = 0; i < state.files.length; i++) {
      const file = state.files[i];
      try {
        const entry = await processFile(file, state.rotations[i] || 0);
        if (entry.downscaled) downscaledCount++;
        state.results.push(entry);
        renderResult(entry);
      } catch (err) {
        console.error(err);
        toast(`${file.name}: ${t('errProcess')}`, 'error');
      }
    }
    if (state.results.length) {
      $('results').hidden = false;
      $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
      track('generate', { images: state.results.length, mode: readCfg().mode });
    }
    if (downscaledCount > 0) toast(t('downscaled'), 'info');
  } finally {
    btn.disabled = false;
    btn.textContent = btn.dataset.origText || t('generate');
  }
}

function clearResults() {
  state.results.forEach(r => URL.revokeObjectURL(r.url));
  state.results = [];
  $('resultList').innerHTML = '';
  $('results').hidden = true;
}

async function downloadAll() {
  if (!state.results.length) return;
  // ZIP packaging (lazy CDN import; falls back to per-file download)
  try {
    toast(t('zipPreparing'));
    const JSZip = (await import('https://jspm.dev/jszip@3.10.1')).default;
    const zip = new JSZip();
    for (const r of state.results) zip.file(engine.ensureExt(r.name, r.blob.type), r.blob);
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const d = new Date();
    const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
    engine.downloadBlob(blob, `证件水印_${ts}.zip`);
    toast(t('zipDone'));
    track('zip_download', { count: state.results.length });
  } catch (err) {
    console.error(err);
    toast(t('zipFallback'), 'warn');
    for (const r of state.results) {
      engine.downloadBlob(r.blob, engine.ensureExt(r.name, r.blob.type));
      await new Promise(res => setTimeout(res, 350)); // multi-download throttle
    }
  }
}

/** Sync UI controls to DEFAULTS (shared by init and resetAll, matching first paint). */
function applyDefaultsToUI() {
  const D = engine.DEFAULTS;
  $('purpose').selectedIndex = D.purposeIndex;
  $('customPurpose').value = '';
  $('customPurpose').hidden = true;
  $('position').value = D.mode;
  $('density').value = String(D.density);
  $('density').disabled = D.mode !== 'tile';
  $('sizePct').value = String(D.sizePct);
  $('sizeVal').textContent = `${D.sizePct}%`;
  $('opacity').value = String(D.opacityPct);
  $('opacityVal').textContent = `${D.opacityPct}%`;
  $('strokeToggle').checked = D.strokeOn;
  setColor(D.color);
}

function resetAll() {
  state.files = [];
  state.rotations = [];
  renderThumbs();
  updatePreviewSource();
  clearResults();
  state.userEditedText = false;
  const now = new Date();
  $('date').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  applyDefaultsToUI();
  syncText(true);
}

/* ---------- Color swatches ---------- */

function setColor(hex) {
  state.color = hex;
  $('colorPicker').value = hex;
  document.querySelectorAll('.swatch').forEach(s =>
    s.classList.toggle('active', s.dataset.color === hex));
}

/* ---------- Init ---------- */

function wireEvents() {
  // Three upload channels
  $('dropZone').addEventListener('click', () => $('fileInput').click());
  $('dropZone').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('fileInput').click(); }
  });
  $('fileInput').addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });

  const dz = $('dropZone');
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => {
    e.preventDefault(); dz.classList.add('drag-over');
  }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => {
    e.preventDefault(); dz.classList.remove('drag-over');
  }));
  dz.addEventListener('drop', e => addFiles(e.dataTransfer.files));
  // Never let the browser open dragged images anywhere on the page
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => e.preventDefault());

  // Paste screenshots (pasting text into inputs doesn't trigger)
  document.addEventListener('paste', e => {
    const el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    const files = [];
    for (const it of e.clipboardData.items) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  });

  // Template wiring
  $('purpose').addEventListener('change', () => {
    const custom = $('purpose').value === '__custom';
    $('customPurpose').hidden = !custom;
    if (custom) $('customPurpose').focus();
    syncText();
  });
  $('customPurpose').addEventListener('input', () => { if (!state.userEditedText) syncText(); });
  $('date').addEventListener('input', () => syncText());
  $('text').addEventListener('input', () => { state.userEditedText = true; });
  $('resetTpl').addEventListener('click', () => syncText(true));

  // Advanced parameters
  $('position').addEventListener('change', () => {
    const tile = $('position').value === 'tile';
    $('density').disabled = !tile;
  });
  $('sizePct').addEventListener('input', () => { $('sizeVal').textContent = `${$('sizePct').value}%`; });
  $('opacity').addEventListener('input', () => { $('opacityVal').textContent = `${$('opacity').value}%`; });

  document.querySelectorAll('.swatch').forEach(s =>
    s.addEventListener('click', () => setColor(s.dataset.color)));
  $('colorPicker').addEventListener('input', e => setColor(e.target.value));

  // Main flow
  $('generateBtn').addEventListener('click', generate);
  $('resetBtn').addEventListener('click', resetAll);
  $('downloadAllBtn').addEventListener('click', downloadAll);

  // Language
  $('langSelector').addEventListener('change', e => {
    setLang(e.target.value);
    track('lang_change', { lang: e.target.value });
    // Language切换后刷新动态 UI 文案与模板
    syncText(true);
    ['generateBtn', 'downloadAllBtn'].forEach(id => { const b = $(id); if (b) b.textContent = t(b.dataset.i18nKey); });
    schedulePreview();
  });

  // Sample image
  $('sampleBtn').addEventListener('click', async () => {
    addFiles([await makeSampleFile()]);
    track('sample_use');
  });

  // Live-preview wiring (every render-affecting control)
  ['purpose', 'customPurpose', 'date', 'text', 'position', 'density', 'colorPicker', 'sizePct', 'opacity', 'strokeToggle']
    .forEach(id => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('input', schedulePreview);
      el.addEventListener('change', schedulePreview);
    });
  document.querySelectorAll('.swatch').forEach(s => s.addEventListener('click', schedulePreview));
}

function init() {
  initAnalytics(); // zero data out when provider is 'none'
  initLang();
  wireEvents();
  // Date defaults to today
  const now = new Date();
  $('date').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  // Recall the last text (any edit counts as manual)
  const last = (() => { try { return localStorage.getItem('p1.lastText'); } catch (_) { return null; } })();
  if (last) {
    $('text').value = last;
    state.userEditedText = true;
  } else {
    syncText(true);
  }
  // Sync controls to defaults (single source); HTML value attributes are pre-JS fallbacks only
  applyDefaultsToUI();
  // data-i18n-key anchors for dynamic button labels
  $('generateBtn').dataset.i18nKey = 'generate';
  $('downloadAllBtn').dataset.i18nKey = 'downloadAll';
}

document.addEventListener('DOMContentLoaded', init);
