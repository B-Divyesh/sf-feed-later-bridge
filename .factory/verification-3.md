# Import saved feeds into a local queue — verification 3

**Verdict: FAIL**

- Work order: `feed-later-bridge-verify-3`
- Live URL: <https://feed-later-bridge.sociobot.in>
- Implementation candidate: `54f5b6f5aa3ae28adac40b5e6bf2b920a193b363`
- Documentation baseline: `7afe2614148c6a2c4e98a9bc7ef1d8f7cf322704`
- Verified: 2026-09-05 UTC
- Findings: **1** (low)
- Untested claims: **0**

The repaired product completes its main job, all 11 declared claim commands pass, and all earlier findings are fixed. Acceptance still fails because the live demo exposes a heading that its markup marks as screen-reader-only. The heading becomes a large duplicate label above the sample entries on desktop and phone.

## Finding

### Low — the demo shows a screen-reader-only heading as large page content

`site/demo/index.html` gives “Sample saved-items queue” the class `sr-only`. The site stylesheet has no `.sr-only` rule; that rule exists only in the extension stylesheet. The live element therefore renders as a normal `h2`:

- Desktop: `display: block`, 998 × 64 px, 64 px font.
- Phone at 390 × 844: `display: block`, 356 × 80 px, 40 px font.
- The large duplicate heading sits between the search controls and the first queue item. It is also absent from `.factory/copy-audit.md`, consistent with the intended visually hidden treatment.

Reproduction:

1. Open <https://feed-later-bridge.sociobot.in/demo/> in a fresh browser.
2. Look below the sample search field.
3. “Sample saved-items queue” appears as a large heading before the first item.
4. Inspect `#sample-queue-title`: it has `class="sr-only"`, but computed style is not visually hidden.

Evidence: `/work/.evidence/live-demo-clean-desktop.png` and `/work/.evidence/live-demo-clean-phone.png`.

The repair should define the site’s visually hidden utility and add a browser assertion for the computed hidden treatment. No product code was changed during this verification.

## First screen and demo

Fresh Chromium contexts were used at 1440 × 900 and 390 × 844 before scrolling.

| Check | Result |
|---|---|
| Job | PASS — H1 is “Import saved feeds into a local queue”. |
| Audience | PASS — the first screen names RSS readers who save articles. |
| First action | PASS — “Try it with sample data” is visible above the fold. |
| Plain facts | PASS — free, no account, and offline queue facts are above the fold. |
| One-click sample | PASS — `/demo/` opens with three realistic items, two waiting and one finished. |
| Persistent label | PASS — the sample label remains after changing an item. |
| Reset | PASS — a change reduced waiting items from two to one; reset restored three items and two waiting. |
| Real-data isolation | PASS — a seeded non-demo sentinel remained unchanged; the demo wrote only its `demo:` key. The installed extension likewise used only `demo:bridgeState`. |
| Populated output | PASS — Markdown and JSON previews contained all three sample items. |

The first screen uses plain job, audience, and action copy. Landing headings and controls use task names rather than mood labels. The product-specific glass-and-route visual system matches `.factory/design.md`, with distinct light and dark treatments.

## Declared claims

Every entry in `.factory/claims.json` has exactly one matching `@claim:<id>` test. Every declared command was run separately from a clean clone at the documentation baseline.

| Claim | Declared command | Result |
|---|---|---|
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | PASS — desktop and mobile |
| `demo-export` | `npm run test:e2e -- --grep @claim:demo-export` | PASS — desktop and mobile |
| `free-download` | `npm run test:e2e -- --grep @claim:free-download` | PASS — MV3 1.1.0 archive, no session |
| `site-privacy` | `npm run test:e2e -- --grep @claim:site-privacy` | PASS — same-origin requests and no cookies |
| `import-rss-atom-rdf` | `npm test -- -t @claim:import-rss-atom-rdf` | PASS — RSS, Atom, and RSS 1.0 fixtures |
| `feed-request-privacy` | `npm run test:e2e -- --grep @claim:feed-request-privacy` | PASS — no cookie and actionable redirect error |
| `local-queue` | `npm run test:e2e -- --grep @claim:local-queue` | PASS — demo and real storage remain isolated |
| `queue-tools` | `npm run test:e2e -- --grep @claim:queue-tools` | PASS — search, note, finish, remove, and Undo |
| `offline-queue` | `npm run test:e2e -- --grep @claim:offline-queue` | PASS — separate context and offline reload |
| `open-exports` | `npm run test:e2e -- --grep @claim:open-exports` | PASS — complete Markdown, OPML, and JSON |
| `no-article-fetching` | `npm run test:e2e -- --grep @claim:no-article-fetching` | PASS — article origin was not requested |

Landing, legal, extension, and README claim-like copy maps to these tested claim families. **Untested claim count: 0.**

## Clean-checkout gates

The independent clone was clean at `7afe2614148c6a2c4e98a9bc7ef1d8f7cf322704`. Node was `v22.23.2`, npm was `10.9.8`, and Playwright/Chromium was pinned to `1.58.2`.

| Command | Result |
|---|---|
| `npm ci` | PASS — 438 packages installed from the lockfile |
| `npm test` | PASS — 8 tests |
| `npm run test:claims` | PASS — 1 unit claim check and 14 browser project checks |
| `npm run test:e2e` | PASS — 25 passed, 1 expected skip because extension tests are desktop-only |
| `npm run build` | PASS — extension, ZIP, and `dist/site/` produced |
| `npm run check` | PASS — TypeScript, unit tests, and production build |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |

The full audit still reports 10 development-tool advisories inherited through WXT tooling. They are not shipped in the 49.62 KB extension or static runtime and are not counted as a product finding.

## Installed extension and recovery paths

The exact live ZIP was downloaded and unpacked into a clean Chromium profile without changing its manifest. Its demo loaded three items, used only `demo:bridgeState`, survived offline reload with two queued items visible, and passed axe on the options page and popup. The popup has its own job title, one H1, and one main landmark.

For feed-origin cases, a disposable copy was granted only a local test origin so browser automation could bypass Chrome’s permission prompt. Results:

- Normal RSS import produced one item and a clear success message.
- An `ftp://` URL was rejected before a request; correcting it recovered and imported normally.
- Malformed XML, a non-feed XML document, HTTP 503, and a feed over 5 MB each produced a specific recovery message.
- A 1,002-entry feed imported the documented maximum of 1,000 items.
- A 2,000-character note saved and survived reload.
- The claim suite separately proved RSS 1.0, redirect recovery, omitted credentials, no article-page request, all exports, queue tools, demo isolation, and offline reload.

Evidence: `/work/.evidence/extension-check.json` and `/work/.evidence/live-extension-demo.png`.

## Accessibility, routes, privacy, and performance

- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, title, `lang`, one H1, main landmark, image alt coverage, labelled buttons, and zero console errors.
- Playwright axe found zero serious or critical violations on desktop dark, phone dark, phone light, all public routes, the installed extension options page, and its popup.
- The standalone `npx @axe-core/cli` could not find its own Chrome binary in this worker. The pinned Playwright axe integration completed the same live analysis successfully.
- Keyboard checks passed: the skip link is first, has a 3 px high-contrast outline, moves focus to `main`, and Enter/Space operate the tested controls without a trap.
- Reduced motion sets scrolling to `auto` and the suite verifies near-zero animation and transition durations. No flashing or autoplay exists.
- All visible controls measured at least 44 × 44 px in the declared desktop and phone browser checks.
- The 390 px layouts have no horizontal overflow. A 320 px reflow check preserved all text and controls without visible clipping.
- `/`, `/demo/`, `/privacy/`, and `/terms/` return 200 with distinct titles, `lang="en"`, one H1, one main landmark, canonical metadata, and no console errors.
- A deliberate unknown URL returns HTTP 404 with the designed “Page not found” page and a product-page link. This expected 404 is not a defect.
- Every published landing-page link returned 200, including the ZIP and stated GitHub source.
- Fresh live browsing made same-origin requests only, set no cookies, and loaded no third-party fonts or scripts. The privacy and terms pages are reachable from the consistent footer.
- Live headers include CSP with `frame-ancestors 'none'`, Permissions-Policy, `Referrer-Policy: no-referrer`, and `X-Content-Type-Options: nosniff`. Hashed assets cache for one immutable year; the ZIP caches for one hour; ETag revalidation returns 304.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 50 ms, CLS 0, transfer 23 KiB.
- The site build ships 1.17 KB initial JavaScript plus a 3.26 KB demo chunk and 17.03 KB CSS, all far below the budgets.

Offline behavior is promised only for the saved extension queue and passed. The static marketing site does not promise offline installation or an update service. There is no backend, account, tenant, SQLite service, health route, or product rate limiter, so tenant isolation, restart persistence, health, and 429/`Retry-After` checks do not apply. The brief does not benefit from an AI step; standards-based import, local queue actions, and open export cover the implied work.

## Earlier finding disposition

| Earlier finding | Current evidence | Disposition |
|---|---|---|
| No one-click isolated sample | Site and exact extension demos load three items, keep a persistent label, reset, and preserve the seeded real-data sentinel. | Fixed |
| No claims registry or tests | Eleven registry entries each have exactly one tagged test; all commands pass separately. | Fixed |
| RSS 1.0 imports zero items | RSS 1.0 sibling-item fixture passes. | Fixed |
| Live security and cache policy absent | Live CSP, permissions, no-referrer, immutable asset cache, one-hour ZIP cache, and 304 were observed. | Fixed |
| Targets below 44 × 44 px | Browser measurement found no undersized visible controls at 390 px or desktop. | Fixed |
| Site ignored light preference | Fresh light context rendered `rgb(242, 247, 248)` instead of the dark `rgb(7, 17, 29)` background and passed axe. | Fixed |
| First screen and metaphor copy | Job, audience, sample action, and facts are visible before scrolling; the copy audit has no flagged sentence. | Fixed |
| Metadata, structure, and navigation gaps | Canonicals, social image, icons, sitemap, route titles, shared header/footer, build ID, and designed 404 are live. | Fixed |
| Redirect failure was opaque | The installed flow says to use the final direct feed URL; its tagged test passes. | Fixed |
| Unknown routes were soft 200 | The live unknown route returned the designed page with HTTP 404. | Fixed |

## Deployment identity

The live root, demo, privacy, terms, 404, CSS, and demo JavaScript are byte-for-byte identical to the clean build at the documentation baseline. All 14 files inside the live extension ZIP match the clean build. `7afe261` changes only `.factory/handoff.md` after implementation `54f5b6f`, so the reviewed live product is the requested implementation candidate.

## Required before PASS

Define the site `.sr-only` treatment, confirm the demo queue heading is visually hidden while retaining its accessible name, and add a browser regression assertion. Acceptance requires zero findings; this verification has one low-severity finding and therefore returns **FAIL**.
