# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-15

Initial public release.

### Added

- Purpose + date text templates for ID-photo protection (presets for KYC,
  business licensing, property certificates, résumé photos; custom option).
- Watermark engine: crop-resistant diagonal tile (density 2-10) or corner
  badges, per-image rotation, stroke option, resolution-relative sizing.
- Privacy-safe pipeline: 100% local processing; re-encoded output strips
  original EXIF/GPS automatically.
- Mobile-proof engineering: EXIF-orientation-aware decoding, canvas pixel
  cap guard with automatic downscaling (48MP-safe on iOS).
- Three upload channels (click / drag / paste), batch of 20, live preview,
  procedural sample image (never mimics a real ID layout).
- 22 regression tests for the pure engine functions; manual QA checklist.
- Bilingual UI (zh-CN / en) with language persistence.
- Zero dependencies, zero build — native ES Modules, deployable as static
  files anywhere.

### Known limits

- ZIP packaging loads JSZip from a public CDN at click time (with a
  per-file download fallback).
