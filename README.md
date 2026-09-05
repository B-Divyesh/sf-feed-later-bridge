# Feed Later Bridge

Feed Later Bridge imports a saved RSS, Atom, or RSS 1.0 feed into a local browser queue. It is for RSS readers who want notes, completion status, and open exports without a hosted read-later account.

The extension stores queue metadata in browser extension storage. It imports feed metadata and links only; it does not fetch article pages. Export the full queue as Markdown, OPML, or JSON.

Try the isolated sample at <https://feed-later-bridge.sociobot.in/demo/>. The sample queue uses a `demo:` local-storage key and cannot change extension data. In the extension, choose **Try sample data** to load the same kind of isolated queue.

## Run

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm run dev          # Extension development mode
npm run dev:site     # Landing site at localhost
```

For Chrome, run `npm run build:extension`, open `chrome://extensions`, enable Developer mode, then load `.output/chrome-mv3` unpacked.

## Test and build

```bash
npm test             # Unit checks, including RSS 1.0 parsing
npm run test:e2e     # Browser, extension, demo, accessibility, and responsive checks
npm run test:claims  # Every public claim from .factory/claims.json
npm run check        # TypeScript, unit tests, and production build
npm run build        # Creates the extension, ZIP, and dist/site/
```

The browser suite expects Playwright Chromium 1.58.2. Outside the factory image, install it once with `npx playwright install chromium`.

## Demo and privacy

`.factory/demo.md` describes the sample data, reset behavior, and isolated storage keys. `.factory/claims.json` lists every retained public product claim and its outcome-based test.

The static site has no analytics, cookies, third-party fonts, or third-party runtime assets. Feed requests omit browser credentials.

## Deploy

Run `npm ci && npm run build`, then publish `dist/site/` as the static site. `staticwebapp.config.json` in that output configures headers, cache policies, and the designed 404 response. Deployment infrastructure and extension-store submission are outside this repository.

## License

MIT. See [LICENSE](LICENSE).
