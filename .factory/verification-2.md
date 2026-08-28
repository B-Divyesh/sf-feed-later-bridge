# Feed Later Bridge — independent verification 2

**Verdict: FAIL**

- Work order: `feed-later-bridge-verify-2`
- Candidate: `581daef54197ca0949eb16698521159d4fda7028`
- Live URL: <https://feed-later-bridge.sociobot.in>
- Verified: 2026-08-28 (UTC)
- Environment: Node `v22.23.2`, npm `10.9.8`, Playwright/Chromium `1.58.2`, Lighthouse `12.8.2`

The production build, normal RSS 2.0/Atom queue workflow, privacy behavior, axe checks, and performance budgets pass. Release acceptance fails because valid RSS 1.0/RDF is silently treated as an empty successful import, and the deployed origin does not apply the security and cache policy shipped in `dist/site/_headers`. Additional responsive-accessibility and design-contract defects are listed below.

## Defects

### High — valid RSS 1.0/RDF feeds silently import zero items

The parser claims RSS, Atom, and specifically “RDF-style RSS” support in the handoff, but it looks for RSS items under `<channel>`. Standard RSS 1.0 places `<item>` elements beside `<channel>` under `<rdf:RDF>`.

Reproduction through the built extension:

1. Import a valid `application/rdf+xml` document with one `<item>` sibling of `<channel>`.
2. The UI reports `Up to date. 0 items are already here.`
3. The queue remains empty.

This is a silent core-workflow failure for a standards-compliant RSS input. It also gives the user no indication that the feed format was parsed incorrectly.

### Medium — deployed response policy does not match the candidate or product claims

The candidate ships `dist/site/_headers` with CSP, `Permissions-Policy`, `Referrer-Policy: no-referrer`, and one-year immutable caching for `/assets/*`. The live host serves that file publicly at `/_headers` instead of applying it.

Observed on `/`, `/privacy/`, the JavaScript, CSS, and download:

- Present: HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- Missing: `Content-Security-Policy` and `Permissions-Policy`.
- Consequently there is no live `frame-ancestors 'none'` policy.
- Every tested asset uses `Cache-Control: public, must-revalidate, max-age=30`; hashed assets are not immutable for one year and the extension archive does not get the declared one-hour policy.
- `If-None-Match` does return `304`, so revalidation itself works.

This contradicts the README’s statement that the site sets a restrictive CSP and fails the requested live browser-policy/caching check. It appears to be deployment configuration, but the acceptance target is the deployed product.

### Medium — required 44×44 px targets are not consistently met

At a 390×844 viewport, the populated extension has a 32×32 completion toggle, a 34×44 “All” filter, and a 135×36 brand link. The site also has an inline install-download link only 19 px high and a 41×44 Terms link. Axe reports no serious/critical issue, but these fail the explicit factory touch/click-target baseline.

### Medium — the public site omits the promised light treatment

`.factory/design.md` says that a light treatment is included. The extension defines a light palette, but `site/src/style.css` declares only a dark scheme and has no light-scheme media rules. A Chromium context with `prefers-color-scheme: light` renders the same dark site.

### Low — redirect failures are opaque and stricter than the documented privacy language

The fetch uses `redirect: "error"`, so both same-origin and cross-origin redirects fail. The UI displays the browser string `Failed to fetch` with no recovery instruction. This is less actionable than the other error states and can reject otherwise normal canonical/HTTPS feed redirects. The privacy page describes cross-origin redirects as blocked, not all redirects.

### Low — non-existent routes are soft 200 responses

`GET /does-not-exist` returns the home page with HTTP 200. This does not affect the extension workflow, but it gives incorrect HTTP semantics to crawlers and link checkers.

### Informational — development dependency advisories

`npm audit --omit=dev` reports zero vulnerabilities. Full `npm audit` reports 10 transitive development-tool findings (1 low, 2 moderate, 4 high, 3 critical), primarily WXT’s Firefox tooling (`web-ext-run`, `fx-runner`, `shell-quote`, `firefox-profile`, `adm-zip`, `tmp`, `node-notifier`, and `uuid`) plus development `esbuild`. None is present as a production runtime dependency or shipped in the 45.2 KB extension.

## Clean-checkout quality gates

The checkout was clean and already at the requested candidate; `origin/main` also resolved to the same SHA before report changes.

| Check | Result |
|---|---|
| `npm ci` | PASS — 438 packages installed; lockfile honored |
| `npm test` | PASS — 2 files, 7 tests |
| `npx tsc --noEmit` | PASS |
| Lint | N/A — no lint script or project lint configuration exists |
| `npm run build` | PASS — exact production command; extension, zip, and `dist/site/` produced |
| `npm run check` | PASS — TypeScript, 7 tests, and production build |
| `npm run test:e2e` | PASS — 8 passed, 1 intentional desktop skip |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |

Build sizes:

- Extension: 45.2 KB total; largest JS 17.19 KB; total JS about 19.4 KB; total CSS about 12.2 KB.
- Site: 1.04 KB JS and 12.15 KB CSS before compression.
- Responsive hero: 14,300 bytes at 390 px; desktop hero: 34,006 bytes.

## Independent product exercise

The exact live zip was unpacked into a clean temporary directory and loaded as an unpacked MV3 extension. Because Chromium’s host-permission prompt is browser chrome and cannot be accepted through the page automation surface, the exact package was also granted test-origin access through Chromium’s extension settings API; the archive itself was not altered. Separately, the repository suite’s permission-bypassed copy and an exact-origin pre-granted temporary copy were used for adversarial cases.

Passing paths:

- Empty state identifies the next action; empty export reports `Import at least one item before exporting.`
- A hostile Atom feed with four raw entries produced two safe unique items: a tracking/fragments duplicate was merged, a `javascript:` link was dropped, and injected markup remained inert (`globalThis.pwned` stayed unset).
- A pre-existing cookie for the feed origin was not sent; the request had no cookie and used the declared XML `Accept` header.
- A complete `ftp://` URL was rejected before any request with `Enter a complete http:// or https:// feed URL.`; correcting it to HTTP recovered normally.
- Malformed XML, non-feed HTML, HTTP 503, an over-5,000,000-character feed, and offline state all produced bounded/recoverable states. A 1,002-entry feed imported exactly 1,000 entries.
- A 2,000-character note saved, survived reload, and stayed with the item after finishing. Search, Queue/Finished/All filters, remove/Undo, and re-import deduplication worked.
- Markdown, OPML, and JSON downloaded with correct filenames and contained the full note and queue state.
- Keyboard-only Enter/Space operation completed import, finish, filter, note, and JSON export. The skip link was first in the tab order, activated `#main`, and had a visible 3 px focus outline. No trap was found.
- The toolbar popup reported `1 waiting · 1 finished`, had one `<h1>` and `<main>`, passed axe, and opened the options page.
- The 390 px extension and site had no horizontal overflow. Offline reload retained the extension queue. Reduced motion forced queue/route animations to `0.01ms` and disabled smooth scrolling.

Expected negative-network tests caused Chromium to log resource failures for the intentionally blocked redirect and HTTP 503. Successful flows and fresh page loads had zero console or page errors.

## Accessibility and responsive evidence

- Axe 4.10 found zero violations on the populated extension, popup, and live landing page in desktop dark, 390 px dark, and 390 px light-preference contexts; therefore zero serious/critical findings.
- The live page has `lang="en"`, a title, exactly one `<h1>`, one `<main>`, complete image alt attributes, a skip link, and 16 px body text.
- `/privacy/` and `/terms/` are present and passed the repository semantic checks.
- Focus is visible at 3 px and keyboard operation passed. The undersized targets above remain a separate acceptance failure not flagged by axe because some qualify for WCAG target-spacing/inline exceptions.
- Visual inspection at 1440×900 and 390×844 found no clipping, horizontal overflow, or fixed-bar overlap. The mobile layout intentionally stacks the workflow and queue demonstration.

## Privacy and security evidence

- The live landing page made five same-origin requests only: document, hashed JS, hashed CSS, bridge SVG, and the responsive hero. It set no cookies, wrote no local storage, registered no service worker, and loaded no analytics, CDN font, or third-party script.
- The built extension contains 17 archive entries / 45,204 bytes, no source maps or embedded secrets, and only `storage` plus optional HTTP/HTTPS host permissions. Feed access remains user-origin scoped at request time.
- Queue state is in `chrome.storage.local`; export generation is local. No product backend exists, so backend SSRF, concurrency, persistence, and health/build identity checks are not applicable.
- Feed content is rendered through text nodes, unsafe protocols are rejected, credentials are omitted, and the browser is told not to follow redirects.

## Live deployment identity

The live deployment is the candidate, not a stale build:

- Live `/`, `/privacy/`, `/terms/`, JS, CSS, SVG, both hero images, sample feed, robots file, and `_headers` are byte-for-byte identical to the fresh candidate build.
- Live `/` SHA-256: `41259efde58206c026c9e59d7e064c02f60f7e386fc6eedb96f2bb8de266b87b`.
- Live zip SHA-256 differs from a newly packaged zip because ZIP entry timestamps differ, but all 14 files inside have identical names, sizes, and SHA-256 hashes.
- The unmodified live archive loaded successfully in clean Chromium; manifest version is 3, extension version is `1.0.0`, and a real RSS 2.0 feed imported after browser-level host approval.

## Live performance

Lighthouse 12.8.2 mobile simulation against the production URL at 2026-08-28T05:40:41Z:

| Metric | Result |
|---|---:|
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 1.1 s |
| LCP | 1.1 s |
| TBT | 10 ms |
| CLS | 0 |
| Speed Index | 1.1 s |
| Total transfer | 21 KiB |

The static JS, CSS, font (zero), image, LCP, and CLS budgets pass. INP is not produced by a navigation-only lab run; 10 ms TBT is the available interaction-blocking proxy.

## Applicability

This is a browser extension with a static product site, not a library/CLI, PWA, or backend. Consumer package/API, service-worker update, server concurrency, server persistence, and health identity tests are therefore not applicable.

## Required before PASS

1. Parse standard RSS 1.0/RDF sibling items and add a regression test that imports at least one such item.
2. Configure the production host to apply the CSP, permissions, referrer, framing, and asset-cache policy; verify the actual response headers.
3. Raise all interactive targets to at least 44×44 CSS px at 390 px.
4. Either implement the documented site light treatment or explicitly revise the visual thesis to justify a single-mode site.
5. Replace raw redirect/network error strings with actionable copy and decide/document whether safe same-origin redirects should be accepted.
