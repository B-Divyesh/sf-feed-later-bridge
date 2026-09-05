# Import saved feeds into a local queue — repair handoff

**Release candidate: PASS**

- Live URL: <https://feed-later-bridge.sociobot.in>
- Deployed implementation SHA: `54f5b6f5aa3ae28adac40b5e6bf2b920a193b363`
- Prior documentation-only review SHA: `247dcc5dbbc39e01275659cc6d122e98cffa0092`
- This handoff is a later documentation-only record; it does not require a new product image.
- Product version: `1.1.0`

## What changed

- Added a one-click `/demo/` sandbox. It starts with three realistic saved articles, keeps a persistent “Demo — sample data, nothing is saved” label, resets cleanly, and stores only `demo:feed-later-bridge:queue`.
- Added the equivalent **Try sample data** flow to the extension. It uses `demo:bridgeState`, never reads or writes `bridgeState`, and discards demo storage on **Start for real**.
- Fixed standard RSS 1.0/RDF imports by reading sibling `<item>` nodes inside `rdf:RDF`.
- Added the required claims registry, demo documentation, copy audit, catalog description, and outcome-based tagged checks for every retained public claim.
- Rewrote the first screen in plain words. It now states the job, audience, first action, and three short facts before scrolling.
- Added `/demo/`, `/privacy/`, `/terms/`, designed `404.html`, canonical/social metadata, sitemap, favicon/touch icon, consistent navigation/footer, light treatment, and the generated 1200×630 social image derived from the product art.
- Replaced the downloadable `_headers` file with `staticwebapp.config.json`. The deployed Static Web App now applies CSP, permissions, referrer, cache, framing, and 404 policies.
- Raised site and extension controls to at least 44×44px, added target-size regression checks, and added keyboard/skip-link/reduced-motion checks.
- Redirect failures now tell users to use the final direct feed URL.

## Earlier findings disposition

| Earlier finding | Current disposition |
|---|---|
| No one-click isolated sample | Fixed by site and extension demo sandboxes. |
| No claims registry or claim tests | Fixed by 11 entries in `.factory/claims.json`; every declared command passed. |
| RSS 1.0 imports zero items | Fixed and regression tested. |
| Live headers/cache policies not applied | Fixed and confirmed over HTTPS. |
| Targets below 44×44px | Fixed and checked at phone width. |
| Site ignored light preference | Fixed with a complete light token treatment. |
| Redirect message was opaque | Fixed with actionable direct-URL recovery text. |
| Unknown routes were soft 200 | Fixed: live unknown routes return designed HTTP 404. |
| Plain-language, metadata, navigation, and footer gaps | Fixed. |

## Verification

From a clean setup:

```bash
npm ci
npm test
npm run test:claims
npm run test:e2e
npm run check
npm audit --omit=dev
```

All commands passed. The claims commands were also executed individually from `.factory/claims.json`; all 11 passed.

Browser coverage includes normal, invalid, boundary, recovery, demo isolation, RSS/Atom/RSS 1.0 parsing, credential omission, blocked redirects, no article-page fetches, notes, search, completion, removal/Undo, all exports, offline reload, persistence, keyboard, reduced motion, desktop, and phone paths. The full Playwright run passed **25 tests** with **1 intentional mobile skip** (the extension suite is desktop-only).

Live checks after deployment:

- `verify-url.sh` passed: HTTP 200, no console errors, title/lang/main/alt/button checks all pass.
- Fresh desktop and 390px phone checks found the first-screen job, audience, and sample action above the fold; live axe Playwright scans found zero serious or critical violations.
- Live demo loaded 3 items, changed to 1 waiting, retained only `demo:feed-later-bridge:queue`, then reset to 3 items / 2 waiting.
- Live `/does-not-exist` returns HTTP 404 and the designed not-found page.
- Live headers include `Content-Security-Policy`, `Permissions-Policy`, `Referrer-Policy: no-referrer`, immutable one-year asset caching, and one-hour ZIP caching.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.07s, TBT 18ms, CLS 0, transfer 23,253 bytes.

The standalone `npx @axe-core/cli` could not start Chrome in this worker image. The equivalent live Playwright axe integration completed successfully instead.

## Known gaps and next steps

No product defects are known. This remains a local-first extension: users need a direct RSS, Atom, or RSS 1.0 saved-items URL from their reader. There is deliberately no hosted sync service, account system, article scraper, or external feed-provider integration.
