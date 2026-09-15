/**
 * Regression tests for the pure functions of engine.js (Node, no DOM).
 * Usage: node tools/test-engine-math.mjs
 * Covers: hexToRgba, downscaleFactor (huge-image guard), wrapText
 * (mock measuring context), outputTypeFor, file-naming helpers, and the
 * DEFAULTS single-source contract.
 */
import {
  hexToRgba, downscaleFactor, MAX_CANVAS_PIXELS,
  wrapText, outputTypeFor, makeWatermarkedName, ensureExt,
  DEFAULT_CONFIG, DEFAULTS,
} from '../js/engine.js';

let failed = 0;
function ok(cond, msg) {
  console.log(`${cond ? '  ✔' : '  ✘'} ${msg}`);
  if (!cond) failed++;
}

console.log('hexToRgba');
ok(hexToRgba('#ffffff') === 'rgba(255, 255, 255, 1)', '#ffffff -> white');
ok(hexToRgba('ff0000', 0.5) === 'rgba(255, 0, 0, 0.5)', 'no-hash red with alpha');
{
  let threw = false;
  try { hexToRgba('#12345'); } catch (_) { threw = true; }
  ok(threw, 'invalid hex throws');
}

console.log('downscaleFactor (huge-image guard)');
ok(downscaleFactor(1000, 1000) === 1, 'small image -> no downscale');
ok(downscaleFactor(8000, 6000) < 1, '48MP -> downscale');
{
  const f = downscaleFactor(8000, 6000);
  // Contract: floored dimensions after scaling never exceed the cap
  ok(Math.floor(8000 * f) * Math.floor(6000 * f) <= MAX_CANVAS_PIXELS, 'floored result stays under the cap');
  ok(Math.abs(f - Math.sqrt(MAX_CANVAS_PIXELS / (8000 * 6000))) < 1e-12, 'exact proportional factor');
}

console.log('wrapText (mock measureText)');
{
  // Monospace mock: every char is 10px wide
  const ctx = { measureText: str => ({ width: [...str].length * 10 }) };
  ok(JSON.stringify(wrapText(ctx, 'abcdefgh', 30)) === JSON.stringify(['abc', 'def', 'gh']),
    'wraps at width 30 (3 chars per line)');
  ok(JSON.stringify(wrapText(ctx, 'ab\ncdefgh', 40)) === JSON.stringify(['ab', 'cdef', 'gh']),
    'respects explicit \\n');
  {
    // CJK + emoji iterate by code point, never garble
    const out = wrapText(ctx, '你好🌎x', 20);
    ok(JSON.stringify(out) === JSON.stringify(['你好', '🌎x']), 'CJK/emoji split by code point');
  }
}

console.log('outputTypeFor');
ok(outputTypeFor({ type: 'image/jpeg' }) === 'image/jpeg', 'jpeg passthrough');
ok(outputTypeFor({ type: 'image/webp' }) === 'image/webp', 'webp passthrough');
ok(outputTypeFor({ type: 'image/png' }) === 'image/png', 'png');
ok(outputTypeFor(null) === 'image/png', 'missing type -> png');

console.log('file naming');
{
  const name = makeWatermarkedName('scan.jpg');
  ok(/^scan_watermarked_\d{12}\.jpg$/.test(name), `name pattern: ${name}`);
  const fallback = makeWatermarkedName('');
  ok(/^watermarked_\d{12}\.png$/.test(fallback), `fallback pattern: ${fallback}`);
  ok(ensureExt('photo', 'image/jpeg') === 'photo.jpg', 'extension appended');
  ok(ensureExt('photo.png', 'image/jpeg') === 'photo.png', 'existing extension kept');
}

console.log('DEFAULTS single-source contract');
ok(DEFAULTS.opacityPct === Math.round(DEFAULT_CONFIG.opacity * 100), 'opacityPct derives from DEFAULT_CONFIG');
ok(DEFAULTS.sizePct === Math.round(DEFAULT_CONFIG.sizePct * 1000) / 10, 'sizePct derives from DEFAULT_CONFIG');
ok(DEFAULTS.mode === DEFAULT_CONFIG.mode && DEFAULTS.density === DEFAULT_CONFIG.density, 'mode/density mirror DEFAULT_CONFIG');

console.log(failed === 0 ? '\nALL PASSED ✅' : `\n${failed} FAILED ❌`);
process.exit(failed === 0 ? 0 : 1);
