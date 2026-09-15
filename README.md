# idmark

**English** | [简体中文](README.zh-CN.md)

Protect photos of your IDs, licenses and certificates before sharing them online — add a visible watermark ("for platform verification only" + date) so they can't be cleanly reused for fraud. Template-based texts, tile or corner marks, batch of 20, 100% in-browser; nothing is uploaded.

[![CI](https://github.com/ikoobee/idmark/actions/workflows/ci.yml/badge.svg)](https://github.com/ikoobee/idmark/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](CHANGELOG.md)

![idmark](assets/og-cover.png)

## Why

Uploading a bare ID photo for KYC / platform onboarding is a known fraud vector: the image itself can be reused elsewhere. A watermark stating purpose and date makes the photo single-use in practice:

- **Purpose + date templates** — one click composes the standard protective text (e.g. "仅供 XX 平台核验使用" with today's date); presets cover common scenarios (KYC, business licensing, property certificates, résumé photos), with a custom option.
- **Crop-resistant tile mode** — diagonal tiled text across the whole image, density 2–10; corner badge mode for lighter protection.
- **Privacy-safe by construction** — processing is 100% local and the output is re-encoded, which strips the original EXIF (including GPS/device info) automatically.
- **Mobile-proof engineering** — EXIF-orientation-aware decoding, canvas pixel-cap guard with automatic downscaling (48MP photos won't silently blank on iOS), paste/drag/click uploads, per-image rotation.
- **Zero dependencies, zero build** — native ES Modules + Canvas; deployable as static files anywhere. No account, no upload, no telemetry.

## Quick Start

```bash
git clone https://github.com/ikoobee/idmark.git
cd idmark
npx --yes serve .          # any static file server works
# open http://localhost:3000 — pick a purpose (or the sample image), Generate
```

Run the engine regression tests (Node 18+):

```bash
npm test
```

## Use it programmatically

```js
import { applyWatermark, DEFAULT_CONFIG } from './js/engine.js';

const canvas = applyWatermark(decodedImage, {
  ...DEFAULT_CONFIG,
  text: 'For platform verification only\n2026-09-15',
  mode: 'tile',
  density: 4,
});
```

## Self-hosting

Replace `your-domain.example` in `index.html`, `robots.txt`, `sitemap.xml` and the `blog/zh/*.html` canonicals with your domain, then drop the folder on any static host. Analytics ship disabled (`provider: 'none'` in `js/analytics.js`).

## Testing

- `tools/test-engine-math.mjs` — 22 regression cases for the pure engine functions (color parsing, the huge-image guard contract, code-point-safe wrapping, file naming, defaults single-source).
- [docs/qa-checklist.md](docs/qa-checklist.md) — manual QA paths for browser-only behavior (uploads, rotation, export, i18n).

## Contributing

Issues and PRs are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). By contributing you agree your contributions are licensed under the project's MIT license (inbound = outbound).

## License

[MIT](LICENSE) © Ethan (ikoobee)
