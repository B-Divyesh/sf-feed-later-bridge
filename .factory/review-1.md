# Import saved RSS and Atom items into a local queue — review 1

**Verdict: FAIL**

- Work order: `feed-later-bridge-review-1`
- Implementation reviewed: `581daef54197ca0949eb16698521159d4fda7028`
- Documentation baseline reviewed: `3e7be8061b416471c4e2969381cb96cfba7f042f`
- Live URL: <https://feed-later-bridge.sociobot.in>
- Review date: 2026-09-05 UTC
- Findings: **10** (3 high, 5 medium, 2 low)
- Untested public claim families: **31**

The implementation and documentation SHAs differ because `3e7be80` only added the prior verification report and updated the handoff. There is no product change after `581daef`. The live HTML, scripts, styles, images, sample feed, robots file, and `_headers` file match a fresh build of `581daef` byte for byte. Every file inside the live extension ZIP also matches the fresh build; only ZIP container timestamps make the archive hashes differ.

## Findings

### High — no one-click sample or isolated demo

The first screen has no “Try it with sample data” action. `/demo` and `/?demo=1` both return the normal landing page. The clean installed extension also has no sample or demo action. There is no persistent “Demo — sample data, nothing is saved” label, “Reset demo,” “Start for real,” separate demo storage namespace, or documented demo in `.factory/demo.md`.

The landing-page queue is a static illustration with a disabled button. It cannot prove the product workflow. Because no demo exists, the required sample-entry, populated-output, reset, and real-data-isolation checks cannot pass. All extension testing in this review used a temporary Chrome profile and did not touch real user data.

### High — the claim registry is missing and 31 public claim families have no claim tests

`.factory/claims.json` does not exist, and the repository contains no `@claim:` test tags. There were therefore zero declared claim commands to run. The normal tests pass, and independent checks confirm many behaviors, but they do not meet the required claim-to-test mapping or provide repeatable evidence from the demo entry point.

The claim inventory is in [Public claim audit](#public-claim-audit). All 31 entries are untested under the claims contract. One claim family is also false for standard RSS 1.0, as described next.

### High — a valid RSS 1.0 feed imports zero items

The exact live extension ZIP was given approved access to a local test origin in a clean Chrome profile. Importing a valid RDF document with one sibling `<item>` produced `Up to date. 0 items are already here.` The queue remained empty.

`parseFeed` searches under `<channel>`, but standard RSS 1.0 puts item elements beside `<channel>` under `<rdf:RDF>`. This is a silent failure of the public RSS import claim and the main job.

### Medium — live security and cache response policies are not applied

The live server still publishes `/_headers` as a 406-byte download instead of applying it. `/`, legal pages, hashed assets, and the ZIP have no `Content-Security-Policy` or `Permissions-Policy`. The live referrer policy is `strict-origin-when-cross-origin`, not the shipped `no-referrer`. Hashed assets and the ZIP use `Cache-Control: public, must-revalidate, max-age=30`, not the shipped immutable one-year and one-hour rules.

This leaves the README statement that the site sets a restrictive CSP false in production. HSTS and `X-Content-Type-Options: nosniff` are present.

### Medium — several phone targets remain smaller than 44 by 44 pixels

At 390 by 844 pixels, the exact live extension has 32 by 32 completion controls, a 33.84 by 44 “All” filter, and a 135.38 by 36 brand link. The live site has a 222.05 by 19 inline download link and a 41.23 by 44 Terms link. This fails the factory touch-target baseline even though axe reports no serious or critical issues.

### Medium — the site does not provide the documented light treatment

The site fixes `color-scheme: dark` and renders an RGB `7, 17, 29` background when the clean browser requests a light color scheme. `.factory/design.md` says a light treatment is included. The extension itself does implement light colors; the public site does not.

### Medium — the first screen and product copy do not meet the plain-words contract

The first screen does not state the job, audience, and sample-first action in the required form:

- The H1 is `Your saved feed, without another silo.` It describes an outcome through “silo” language instead of naming the import-to-queue job.
- The following copy does not name RSS readers as the audience and uses two sentences where the contract calls for one audience-and-change sentence.
- The primary action is `Download for Chrome`; the required sample action is absent.
- Metaphor headings remain throughout the site and extension, including `A private relay for saved reading`, `A bridge, not a destination`, `Nothing is trapped here`, `Keep the bridge in your browser`, and `Your reading, back in reach.`
- `.factory/copy-audit.md` is missing.

The three short facts (`No account`, `No tracking`, `Local by default`) are present before scrolling.

### Medium — required site discovery, metadata, and shared structure are incomplete

The root page has no canonical URL, Open Graph image, Twitter card metadata, or Apple touch icon. `/sitemap.xml` returns 404. The root Open Graph title is only the product name and its description uses `Your saved feed in. An open queue out.` rather than a direct job statement.

The header changes its navigation between the home and legal pages instead of using one consistent set. The home header omits Demo and Privacy. External links do not say they leave the site. Footers omit “Built by Param Factory” and a version or build ID. The popup title and H1 are only the product name rather than a job statement. Privacy and Terms do have distinct route titles, `lang="en"`, one H1, and one main landmark.

### Low — redirect failures are opaque and broader than the privacy wording

A same-origin 302 response is rejected because fetch uses `redirect: "error"`; the interface reports only `Failed to fetch`. The privacy page says cross-origin redirects are blocked, implying that safe same-origin redirects are not. The error gives no cause or next action.

### Low — unknown routes have no deliberate 404 response or design

`/does-not-exist` and `/404.html` return the home page with HTTP 200, its home title, and its home H1. A deliberate HTTP 404 would be expected and would not be a defect. The defect is that the site has neither 404 status nor the required designed not-found page with a route back.

## Prior finding disposition

All six findings from `.factory/verification-2.md` remain open.

| Prior finding | Current evidence | Status |
|---|---|---|
| RSS 1.0/RDF imports zero | Reproduced with the exact live ZIP: 0 items and a false success message | Open |
| Live `_headers` policy is not applied | Reproduced on HTML, hashed assets, and ZIP; `/_headers` is downloadable | Open |
| Targets under 44 by 44 pixels | Reproduced at 390 by 844 in the site and populated extension | Open |
| Public site ignores light preference | Reproduced in a fresh light-scheme context | Open |
| Redirect error is opaque and over-broad | Same-origin 302 still returns `Failed to fetch` | Open |
| Unknown routes are soft 200 | `/does-not-exist` and `/404.html` both return home with 200 | Open |

The prior informational development-audit note also remains: full `npm audit` reports 10 findings in development tooling (1 low, 2 moderate, 4 high, 3 critical). `npm audit --omit=dev` reports zero production vulnerabilities, and none of the affected packages is shipped in the extension or static site.

## Public claim audit

No row has the required `.factory/claims.json` entry or exactly one `@claim:<id>` test. “Observed” describes this review’s independent evidence only; it does not change the untested count.

| # | Public claim family | Observed |
|---:|---|---|
| 1 | Imports RSS and Atom feeds | Mixed: RSS 2.0 and Atom pass; RSS 1.0 fails |
| 2 | Accepts user-provided public or private direct feed URLs | Public direct feed passes; private-feed behavior has no dedicated test |
| 3 | Permission is limited to the submitted feed origin | Pass by manifest/source and browser exercise |
| 4 | Feed requests happen only after the user starts an import | Pass by browser exercise |
| 5 | Feed requests omit browser credentials | Pass; a seeded origin cookie was absent from the request |
| 6 | Redirects are blocked | Pass as implemented; same-origin handling and copy are defective |
| 7 | Feed requests time out after 15 seconds | Pass at 15.06 seconds |
| 8 | Feed input is limited to 5 MB | Pass with an over-limit response |
| 9 | Feed input is limited to 1,000 entries | Pass; 1,002 source items produced 1,000 queue items |
| 10 | Imported HTML becomes inert text | Pass in unit coverage |
| 11 | Only HTTP and HTTPS article links survive parsing | Pass in unit coverage |
| 12 | Tracking parameters and fragments are removed | Pass in unit coverage |
| 13 | Duplicate links merge while local notes and status remain | Pass in unit and browser coverage |
| 14 | Queue state is stored locally and persists | Pass across a full browser restart in a temporary profile |
| 15 | No account is required | Pass by product inspection |
| 16 | There is no sync/bridge backend and no user data is sent to the project | Pass by manifest, source, and request inspection |
| 17 | Users can add persistent notes | Pass in the exact live package |
| 18 | Users can finish and filter items | Pass in the exact live package |
| 19 | Users can search and sort the queue | Search passes; sort has no dedicated current-path assertion |
| 20 | Removal is reversible with Undo | Pass in the exact live package |
| 21 | The saved queue works offline | Pass after taking the browser offline and reloading |
| 22 | Markdown export contains the full queue | Pass with two items, state, and a note |
| 23 | OPML export is interoperable | XML parses in unit coverage; broader interoperability is not defined |
| 24 | JSON is a complete structured backup | Pass for the reviewed state |
| 25 | Exports are created locally | Pass by source and download inspection |
| 26 | The website uses no analytics, ads, tracking pixels, or cookies | Pass in fresh desktop and phone contexts |
| 27 | The website loads no third-party font, script, or runtime asset | Pass; all five first-load requests are same-origin |
| 28 | The product does no article scraping, recommendations, or endless scrolling | Pass by source and interface inspection |
| 29 | The software is free, open source, and MIT licensed | Pass from package behavior and repository license |
| 30 | The package is Chrome-compatible and installs in two minutes | Chrome package loads; the quantitative time claim has no test |
| 31 | Uninstalling the extension deletes its local storage | Consistent with browser behavior but has no product test |

**Untested claim count: 31.** Independent observations above are useful audit evidence, but the required tagged, demo-based claim tests are absent.

## Clean setup and declared commands

The checkout was clean at `3e7be80` before report changes. Node was `v22.23.2`, npm was `10.9.8`, and Playwright Chromium was the pinned `1.58.2` package/browser setup.

| Command or check | Result |
|---|---|
| `npm ci` | PASS — 438 packages installed from the lockfile |
| `npm test` | PASS — 2 files, 7 tests |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS — creates `.output/chrome-mv3/`, the ZIP, and `dist/site/` |
| `npm run check` | PASS — TypeScript, unit tests, and production build |
| `npm run test:e2e` | PASS — 8 passed, 1 expected mobile-project skip |
| `npm audit --omit=dev` | PASS — 0 production vulnerabilities |
| Full `npm audit` | NOTE — 10 development-tool findings |
| Declared claim commands | FAIL — no claims file or tagged claim tests exist |
| Lint | N/A — no lint command or configuration is declared |

Build output is 1.04 KB JavaScript and 12.15 KB CSS for the site. The extension is 45.2 KB unpacked. The mobile hero is 14.3 KB and the desktop hero is 34.0 KB.

## Live browser and installed-package checks

- Fresh Chromium contexts at 1440 by 900 and 390 by 844 loaded the live page with no console/page errors, no horizontal overflow, one H1, one main landmark, and no axe violations.
- The first focus target is the skip link. A direct keyboard check showed its 3-pixel amber focus outline. Reduced motion changes extension animation durations to `0.01ms` and page scrolling to `auto`.
- Normal RSS 2.0 import produced two realistic entries. Malformed XML and HTTP 503 produced actionable errors. A valid empty feed produced an empty success state. Correcting malformed input and importing again recovered.
- Notes, completion, Queue/Finished/All filters, search, remove/Undo, Markdown/OPML/JSON downloads, and the popup worked. State survived a page reload and a full browser restart.
- The over-5-MB and 1,002-entry boundaries produced the documented 5 MB error and exactly 1,000 imported items. A non-HTTP URL produced the expected validation message.
- Offline reload retained the queue and showed `You’re offline. Your queue still works; reconnect to import.` There is no public-site offline or update promise, and no site service worker.
- The live site made five same-origin first-load requests, set no cookie, and wrote no local or session storage. A feed fetch omitted a cookie already stored for its origin.
- Privacy and Terms load at 200 with route-specific titles. Every published link and both GitHub targets resolve successfully.
- Lighthouse 12.8.2 mobile: performance 100, accessibility 100, best practices 100, SEO 100, FCP 1.0 s, LCP 1.1 s, TBT 0 ms, CLS 0, total transfer 21 KiB.

Screenshots and Lighthouse JSON are under `/work/.evidence/`. The required report copy is `/work/.evidence/qa-report.md`.

## Applicability

This product is a browser extension with a static site. Backend tenant isolation, SQLite restart persistence, health identity, server concurrency, and HTTP 429/`Retry-After` checks do not apply. There is no AI feature, and the brief does not imply one; no missed-AI-leverage finding applies. The useful implied import/export functions are present, although RSS 1.0 is broken and the required sample path is missing.

## Required before PASS

1. Add a real one-click demo with isolated sample storage, persistent demo controls, reset/exit behavior, and `.factory/demo.md`.
2. Add `.factory/claims.json` and one tagged observable demo test for every retained public claim; remove or narrow claims that cannot be proved.
3. Fix and regression-test standard RSS 1.0/RDF imports.
4. Apply CSP, permissions, framing, referrer, and cache policies on the actual host.
5. Raise all touch targets to at least 44 by 44 pixels.
6. Add the documented site light treatment or change the design contract to an explicit, justified single mode.
7. Replace metaphor-led copy with a job-naming first screen and complete `.factory/copy-audit.md`.
8. Add canonical/social metadata, sitemap, consistent navigation/footer details, and a designed 404 that returns HTTP 404.
9. Give redirect failures actionable wording and align behavior with the privacy statement.

PASS requires zero findings and zero untested claims. This review has 10 findings and 31 untested claim families, so the unambiguous result is **FAIL**.
