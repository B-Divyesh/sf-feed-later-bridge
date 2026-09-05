# Demo sandbox

- **URL:** `https://feed-later-bridge.sociobot.in/demo/` (also linked as “Try it with sample data” on the first screen).
- **Sample:** three realistic saved articles from a fictional Miniflux feed. They include two queued items, one finished item, and notes.
- **Storage:** the site uses only `demo:feed-later-bridge:queue` in `localStorage`. The extension uses `demo:bridgeState` in `browser.storage.local`. Neither key is read by or written to the real extension queue key, `bridgeState`.
- **Reset:** **Reset demo** restores all three original sample articles and hides a sample export preview. **Start for real** on the extension discards `demo:bridgeState`; on the site it takes visitors to extension installation.
- **Verification:** the demo browser claim test enters from the landing action, changes a sample item, verifies the persistent banner and isolated key, then resets to the original populated state.
