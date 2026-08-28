# Feed Later Bridge — build handoff

Work order: `feed-later-bridge-build-1`
Completed: 2026-08-28

## What shipped

- A WXT + TypeScript Manifest V3 extension with a compact toolbar popup and full-tab options dashboard.
- User-initiated RSS 2.0, RDF-style RSS, and Atom imports from `http`/`https` URLs.
- Per-origin optional host permission requests, credential-free fetches, blocked redirects, 15-second timeout, 5 MB response limit, and 1,000-entry import limit.
- Inert text extraction from feed markup, unsafe protocol rejection, common tracking-parameter removal, canonical URL deduplication, and preservation of local notes/status across re-imports.
- A local queue with search, newest/oldest sorting, Queue/Finished/All filters, completion toggles, persistent notes, reversible removal, empty/loading/error/offline states, and live announcements.
- Local Markdown, OPML, and JSON downloads containing the full queue.
- A responsive product site with manual Chrome installation instructions and the packaged extension at `dist/site/downloads/feed-later-bridge-chrome.zip`.
- Privacy and terms pages, a restrictive static-host CSP/header file, no analytics, no third-party runtime assets, and no hosted user-data component.
- A product-specific luminous-glass visual system plus an original generated bridge landscape. Prompt, generator, review, and licensing provenance are recorded in `.factory/design.md` and `assets/src/`.

## How to run

```bash
npm ci
npm run dev             # extension development
npm run dev:site        # site development
npm run build           # extension + zip + dist/site
```

Load `.output/chrome-mv3` from `chrome://extensions` for a local browser smoke test. The static deployment root is exactly `dist/site/` and contains `index.html`.

## Verification

- `npm run check` — passed (strict TypeScript, 7 Vitest tests, production extension and site build).
- `npm run test:e2e` — passed: 8 passed, 1 intentional desktop skip for the mobile-only duplication; Chromium 1.58.2.
- Extension browser test — passed the real import → deduplicate → annotate → finish → reload persistence → re-import → JSON download path against a served Atom feed.
- Axe 4.10 — no serious or critical violations on the populated extension dashboard or on desktop/mobile landing pages.
- 390×844 mobile check — primary action and legal links visible; document width 390px with no horizontal overflow.
- Browser console capture — no errors on the landing page during the e2e run.
- `npm audit --omit=dev` — 0 production vulnerabilities. Remaining audit findings are in WXT’s development-only Firefox runner dependency chain and do not ship in the extension or site.
- Extension bundle — 45.2 KB total; largest JS chunk 17.19 KB; largest CSS file 11.1 KB.
- Static first-load payload — 1.04 KB JS, 12.15 KB CSS, 14.3 KB mobile hero WebP (34.0 KB desktop WebP); total Lighthouse transfer 23,094 bytes.

Mobile Lighthouse 12.8.2 against the local production build:

| Category / metric | Result |
|---|---:|
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| LCP | 1.21 s |
| Total blocking time | 0 ms |
| CLS | 0 |
| INP | Not measured in a lab navigation; TBT is the lab responsiveness proxy |

## Known gaps and next steps

- The package is Chrome-compatible and distributed as an unsigned zip; Chrome Web Store signing and Firefox packaging remain release-channel work outside this repository.
- Import is intentionally manual in v1. A future opt-in alarm can refresh a feed without opening the dashboard, but should preserve the exact-origin permission model and expose a clear cadence control.
- Feeds requiring cookies, embedded basic-auth credentials, or cross-origin redirects are intentionally refused. Tokenized feed URLs that respond directly work and remain only in local extension storage.
- Article bodies are not scraped or cached. This is the explicit boundary between a handoff bridge and another read-later silo.
