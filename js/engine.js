/**
 * Watermark engine (general base) — pure functions, no UI dependency.
 *
 * Design notes:
 *  - Tile: offscreen watermark cell + createPattern('repeat') for performance
 *  - Density semantics: n x n grid
 *  - Auto-wrapping: per-character width measurement (CJK-friendly)
 *  - EXIF: prefer createImageBitmap(file, { imageOrientation: 'from-image' })
 *  - Memory rule: exports always use toBlob; callers release canvas/bitmap
 *    when done
 */

export const FONT_STACK =
  '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';

export const DEFAULT_CONFIG = {
  text: '',            // watermark text, \n splits lines
  mode: 'tile',        // tile | center | tl | tr | bl | br
  rotate: 0,           // manual rotation (degrees, 90 steps; 90/270 swap canvas w/h)
  density: 3,          // tile density: n x n (tile mode only)
  color: '#ffffff',    // text color (hex)
  opacity: 0.8,        // opacity 0..1
  sizePct: 0.03,       // font size = long side * sizePct (resolution-independent look)
  angle: 45,           // tile rotation angle (degrees)
  fontWeight: 600,
  strokeWidth: 0,      // >0 enables stroke (white text readability on light images)
  strokeColor: '#000000',
};

/**
 * Single source of defaults shared by UI and engine. The engine's
 * DEFAULT_CONFIG (decimal form) is canonical; this derives the percentage
 * form the UI consumes. app.js init/resetAll/readCfg all read from here;
 * index.html value/selected attributes are first-paint fallbacks only.
 */
export const DEFAULTS = Object.freeze({
  mode: DEFAULT_CONFIG.mode,
  density: DEFAULT_CONFIG.density,
  color: DEFAULT_CONFIG.color,
  opacityPct: Math.round(DEFAULT_CONFIG.opacity * 100),
  sizePct: Math.round(DEFAULT_CONFIG.sizePct * 1000) / 10, // 0.03 -> 3 (float-tail cleanup)
  purposeIndex: 0,
  strokeOn: false, // stroke off by default (photo scenes don't need it; scans can enable)
});

/* ---------- Basic utilities ---------- */

export function hexToRgba(hex, alpha = 1) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error(`Invalid color value: ${hex}`);
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function sourceSize(s) {
  return { w: s.naturalWidth || s.width || 0, h: s.naturalHeight || s.height || 0 };
}

/**
 * Huge-image guard: mobile browsers cap total canvas pixels
 * (iOS Safari ~tens of megapixels depending on device memory); a 48MP
 * photo would silently render as a blank canvas. Returns a <1 downscale
 * factor when over the threshold; callers downsample accordingly.
 */
export const MAX_CANVAS_PIXELS = 4096 * 4096; // ~16.7MP, safe threshold

export function downscaleFactor(w, h, max = MAX_CANVAS_PIXELS) {
  return w * h > max ? Math.sqrt(max / (w * h)) : 1;
}

/**
 * Decode an image file into a drawable source (ImageBitmap / HTMLImageElement).
 * Prefers createImageBitmap with explicit EXIF orientation; falls back to an
 * Image element (modern browsers honor EXIF orientation in drawImage).
 */
export async function decodeImageFile(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (_) { /* some browsers reject options; retry without */ }
    try {
      return await createImageBitmap(file);
    } catch (_) { /* fall through to Image element */ }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = url;
    });
  } finally {
    // onload means the bitmap is decoded; revoking the objectURL is safe
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Character-by-character width-based wrapping (CJK has no word boundaries;
 * for..of iterates code points, so emoji / rare chars never garble).
 */
export function wrapText(ctx, text, maxWidth) {
  const out = [];
  for (const raw of String(text).split('\n')) {
    let cur = '';
    for (const ch of raw) {
      if (cur && ctx.measureText(cur + ch).width > maxWidth) {
        out.push(cur);
        cur = ch;
      } else {
        cur += ch;
      }
    }
    out.push(cur);
  }
  return out;
}

/**
 * Draw a multi-line text block. Uses textBaseline='middle' with per-line
 * offsets, avoiding the eight baseline-combination details.
 */
function drawLines(ctx, lines, x, y, { lineHeight, align = 'center', stroke = null }) {
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const total = lines.length * lineHeight;
  const startY = y - total / 2 + lineHeight / 2; // (x, y) is the block center
  lines.forEach((line, i) => {
    const ly = startY + i * lineHeight;
    if (stroke && stroke.width > 0) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineJoin = 'round';
      ctx.strokeText(line, x, ly);
    }
    ctx.fillText(line, x, ly);
  });
}

/** Build one offscreen tile cell (later used as a createPattern fill). */
function buildTileCell(cfg, cellW, cellH, fontSize, fillStyle, stroke) {
  const cell = document.createElement('canvas');
  cell.width = Math.max(1, Math.round(cellW));
  cell.height = Math.max(1, Math.round(cellH));
  const c = cell.getContext('2d');
  c.font = `${cfg.fontWeight} ${fontSize}px ${FONT_STACK}`;
  c.fillStyle = fillStyle;
  // Rotation compensation: translate to the cell center, then rotate; the
  // longest line can span sqrt(2)*min(w,h) (at 45deg each projection is
  // 1/sqrt(2)), keep a 10% margin.
  c.translate(cell.width / 2, cell.height / 2);
  c.rotate((-cfg.angle * Math.PI) / 180);
  const effW = Math.SQRT2 * Math.min(cell.width, cell.height) * 0.9;
  const lines = wrapText(c, cfg.text, effW);
  drawLines(c, lines, 0, 0, { lineHeight: fontSize * 1.2, stroke });
  return cell;
}

/**
 * Core entry: apply the watermark to an image, return the composited canvas.
 * @param {ImageBitmap|HTMLImageElement} source decoded image source
 * @param {Partial<typeof DEFAULT_CONFIG>} cfgIn watermark config
 * @returns {HTMLCanvasElement}
 */
export function applyWatermark(source, cfgIn = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...cfgIn };
  const S = sourceSize(source);
  if (!S.w || !S.h) throw new Error('Failed to read image dimensions');

  // Huge-image guard: proportionally downsample over the threshold first
  const f = downscaleFactor(S.w, S.h);
  const sw = Math.max(1, Math.round(S.w * f));
  const sh = Math.max(1, Math.round(S.h * f));

  // Manual rotation: 90/270 swap canvas width/height
  const rot = ((cfg.rotate % 360) + 360) % 360;
  const swap = rot === 90 || rot === 270;
  const W = swap ? sh : sw;
  const H = swap ? sw : sh;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (rot === 90) {
    ctx.translate(W, 0);
    ctx.rotate(Math.PI / 2);
  } else if (rot === 180) {
    ctx.translate(W, H);
    ctx.rotate(Math.PI);
  } else if (rot === 270) {
    ctx.translate(0, H);
    ctx.rotate(-Math.PI / 2);
  }
  ctx.drawImage(source, 0, 0, sw, sh);
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset the matrix; draw the watermark in upright coords

  if (!cfg.text || !String(cfg.text).trim()) return canvas; // no text = pass-through

  const fontSize = Math.max(10, Math.round(Math.max(W, H) * cfg.sizePct));
  const fillStyle = hexToRgba(cfg.color, cfg.opacity);
  const stroke = cfg.strokeWidth > 0
    ? { color: hexToRgba(cfg.strokeColor, cfg.opacity), width: Math.max(1, fontSize * 0.05) }
    : null;

  ctx.font = `${cfg.fontWeight} ${fontSize}px ${FONT_STACK}`;
  ctx.fillStyle = fillStyle;

  if (cfg.mode === 'tile') {
    // Density semantics: n x n grid -> cell side = canvas side / n
    const cellW = W / cfg.density;
    const cellH = H / cfg.density;
    const cell = buildTileCell(cfg, cellW, cellH, fontSize, fillStyle, stroke);
    const pat = ctx.createPattern(cell, 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
  } else if (cfg.mode === 'center') {
    const lines = wrapText(ctx, cfg.text, W * 0.9);
    drawLines(ctx, lines, W / 2, H / 2, { lineHeight: fontSize * 1.2, stroke });
  } else {
    // Corners: tl | tr | bl | br — positioned by text-block center
    const pad = Math.max(10, Math.round(Math.min(W, H) * 0.03));
    const right = cfg.mode === 'tr' || cfg.mode === 'br';
    const top = cfg.mode === 'tl' || cfg.mode === 'tr';
    const x = right ? W - pad : pad;
    const lines = wrapText(ctx, cfg.text, W - pad * 2);
    const lh = fontSize * 1.2;
    const totalH = lines.length * lh;
    // top corners: block top sits at pad; bottom corners: block bottom at H-pad
    const yCenter = top ? pad + totalH / 2 : H - pad - totalH / 2;
    drawLines(ctx, lines, x, yCenter, { lineHeight: lh, align: right ? 'right' : 'left', stroke });
  }
  return canvas;
}

/* ---------- Export helpers (toBlob only; never toDataURL for storage) ---------- */

export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality));
}

/** Output format follows the input (re-encoding also strips EXIF/GPS metadata). */
export function outputTypeFor(file) {
  const t = (file && file.type) || '';
  if (t === 'image/jpeg') return 'image/jpeg';
  if (t === 'image/webp') return 'image/webp';
  return 'image/png';
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Copy to the clipboard (requires a secure context; non-png blobs are converted on the fly). */
export async function copyBlobToClipboard(blob) {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('UNSUPPORTED');
  }
  let b = blob;
  if (blob.type !== 'image/png') {
    const bmp = await createImageBitmap(blob);
    const c = document.createElement('canvas');
    c.width = bmp.width;
    c.height = bmp.height;
    c.getContext('2d').drawImage(bmp, 0, 0);
    bmp.close();
    b = await canvasToBlob(c, 'image/png');
    c.width = c.height = 0; // release
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]);
}

/* ---------- File naming ---------- */

function pad2(n) { return String(n).padStart(2, '0'); }

export function makeWatermarkedName(originalName, suffix = 'watermarked') {
  const d = new Date();
  const ts = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}${pad2(d.getHours())}${pad2(d.getMinutes())}`;
  if (!originalName || originalName === 'image.png') return `watermarked_${ts}.png`;
  const dot = originalName.lastIndexOf('.');
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  const ext = dot > 0 ? originalName.slice(dot) : '.png';
  return `${base}_${suffix}_${ts}${ext}`;
}

const EXT_OF = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

export function ensureExt(name, type) {
  return /\.(jpe?g|png|webp)$/i.test(name) ? name : name + (EXT_OF[type] || '.png');
}
