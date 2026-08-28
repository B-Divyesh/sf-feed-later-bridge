import { describe, expect, it } from 'vitest';
import { toJson, toMarkdown, toOpml } from '../../src/export';
import type { BridgeState } from '../../src/types';

const state: BridgeState = {
  version: 1,
  feedUrl: 'https://reader.example/saved.xml?x=1&y=2',
  feedTitle: 'Saved & starred',
  lastSyncAt: '2026-08-28T00:00:00.000Z',
  items: [{ id: 'one', url: 'https://example.com/a?x=1&y=2', title: 'A [good] <read>', author: 'Ada', publishedAt: '2026-08-20T00:00:00.000Z', sourceTitle: 'Saved & starred', status: 'finished', note: 'Worth *keeping*', savedAt: '2026-08-21T00:00:00.000Z', finishedAt: '2026-08-22T00:00:00.000Z' }]
};

describe('exports', () => {
  it('creates a usable Markdown checklist', () => {
    const result = toMarkdown(state.items);
    expect(result).toContain('- [x] [A \\[good\\] \\<read\\>](https://example.com/a?x=1&y=2)');
    expect(result).toContain('Note: Worth \\*keeping\\*');
  });

  it('creates parseable JSON with feed metadata', () => {
    const result = JSON.parse(toJson(state));
    expect(result.feed.title).toBe('Saved & starred');
    expect(result.items[0].note).toBe('Worth *keeping*');
  });

  it('escapes OPML attributes', () => {
    const result = toOpml(state);
    expect(result).toContain('Saved &amp; starred');
    expect(result).toContain('x=1&amp;y=2');
    const doc = new DOMParser().parseFromString(result, 'application/xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.querySelectorAll('outline')).toHaveLength(1);
  });
});
