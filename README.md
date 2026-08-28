# Feed Later Bridge

Feed Later Bridge is a local-first Chrome extension for RSS readers whose “save for later” feed should become a small, finishable queue—not another proprietary reading service.

Paste a saved-items RSS or Atom URL, import it, annotate and finish entries, then export the full queue as Markdown, OPML, or JSON. There is no account, sync backend, analytics, article scraping, or recommendation engine.

Live product site: <https://feed-later-bridge.sociobot.in>

## How it works

- The extension requests access only to the origin of the feed URL the user submits.
- Feed requests omit credentials, reject redirects, time out after 15 seconds, and accept up to 5 MB / 1,000 entries.
- Imported HTML is converted to inert text. Only `http` and `https` article links survive parsing.
- Tracking query parameters and URL fragments are removed before deduplication.
- Feed metadata, completion state, and notes live in `browser.storage.local`.
- Exports are created locally with browser Blob downloads.

The public site is explanatory only; the extension performs the cross-origin feed import. A harmless [`sample-feed.xml`](site/public/sample-feed.xml) is included for automated integration testing and manual smoke tests.

## Develop

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev          # WXT extension development mode
npm run dev:site     # landing site at localhost
```

For Chrome, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `.output/chrome-mv3` after running `npm run build:extension`.

## Test and build

```bash
npm test             # RSS/Atom parsing, deduplication, and all export formats
npm run test:e2e     # extension workflow, axe checks, desktop + 390px site paths
npm run check        # TypeScript, unit tests, and production build
npm run build        # required factory build command
```

`npm run build` produces:

- `.output/chrome-mv3/` — unpacked MV3 extension
- `dist/site/downloads/feed-later-bridge-chrome.zip` — packaged extension
- `dist/site/index.html` — static deployment root, including `/privacy/` and `/terms/`

The e2e suite expects Playwright 1.58.2 Chromium. To provision it outside the factory environment, run `npx playwright install chromium` once.

## Project map

- `entrypoints/` — WXT popup, options dashboard, and MV3 service worker
- `src/feed.ts` — bounded RSS/Atom parsing and canonical deduplication
- `src/export.ts` — Markdown, OPML, and JSON serializers
- `site/` — Vite static product and legal pages
- `tests/` — Vitest unit tests and Playwright browser tests
- `.factory/design.md` — visual system and original image provenance
- `.factory/handoff.md` — verification record and known gaps

## Privacy and security

No runtime asset or script is loaded from a third party. The website sets a restrictive content security policy through `_headers`. The extension has no server component and does not send user data to the project. Private feed URLs are credentials: do not paste them into public bug reports.

See [Privacy](site/privacy/index.html) and [Terms](site/terms/index.html).

## Deploy

Run `npm ci && npm run build`, then publish exactly `dist/site/` as the static site. Infrastructure, DNS, extension-store submission, and billing are intentionally outside this repository.

## License

MIT. See [LICENSE](LICENSE).
