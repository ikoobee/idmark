# Contributing to idmark

Thanks for your interest in improving idmark!

## Getting started

Requirements: Node 18+ (for tests only — the site itself has zero dependencies).

```bash
git clone https://github.com/ikoobee/idmark.git
cd idmark
npx --yes serve .      # local preview, any static server works
npm test               # engine regression tests must pass before every commit
```

## Ground rules

- **Keep it zero-dependency, zero-build.** The site runs as plain static
  files with native ES Modules — no bundler, no runtime libraries (lazy CDN
  import for ZIP only, with a fallback). Core logic stays in `js/engine.js`
  as pure functions, Node-testable.
- **Engine changes need tests.** If you touch the math (wrapping, the
  downscale guard, naming), add cases to `tools/test-engine-math.mjs`, and
  walk the relevant paths of `docs/qa-checklist.md` for browser behavior.
- **Compliance stance.** The sample image is procedurally drawn and must
  never mimic a real ID layout; keep it that way.
- **Language:** code, comments, commits, issues and PRs in English. The UI
  ships bilingual (zh-CN / en) — add new strings to both dictionaries in
  `js/i18n.js`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

## Pull requests

1. Fork / branch from `main`.
2. Make your change; `npm test` green.
3. Open a PR against `main` describing what changed and why.

## License

By contributing, you agree that your contributions will be licensed under the
MIT License that covers this project — **inbound = outbound**.
