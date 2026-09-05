import { describe, expect, it } from 'vitest';
import { canonicalUrl, mergeFeed, parseFeed } from '../../src/feed';
import { EMPTY_STATE } from '../../src/types';

const rss = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>Saved &amp; sound</title>
  <item><title><![CDATA[<b>A useful post</b><script>alert(1)</script>]]></title><link>https://example.com/post?utm_source=reader#part</link><author>Ada</author><pubDate>Thu, 24 Jul 2025 12:00:00 GMT</pubDate></item>
  <item><title>Duplicate</title><link>https://example.com/post</link></item>
  <item><title>Unsafe</title><link>javascript:alert(1)</link></item>
</channel></rss>`;

describe('feed parsing', () => {
  it('parses RSS, strips markup, rejects unsafe links, and deduplicates canonical URLs', () => {
    const feed = parseFeed(rss, 'https://reader.example/saved.xml');
    expect(feed.title).toBe('Saved & sound');
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]?.title).toBe('A useful postalert(1)');
    expect(feed.items[0]?.url).toBe('https://example.com/post');
    expect(feed.items[0]?.publishedAt).toBe('2025-07-24T12:00:00.000Z');
  });

  it('parses Atom alternate links and resolves relative URLs', () => {
    const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><title>Starred</title><entry><title>One</title><link rel="alternate" href="/one"/><updated>2026-08-20T10:00:00Z</updated><author><name>Lin</name></author></entry></feed>`;
    const feed = parseFeed(atom, 'https://feeds.example/starred.atom');
    expect(feed.items[0]?.url).toBe('https://feeds.example/one');
    expect(feed.items[0]?.author).toBe('Lin');
  });

  it('@claim:import-rss-atom-rdf parses standard RSS 1.0 sibling items', () => {
    const rdf = `<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><channel rdf:about="https://reader.example/"><title>Saved RDF</title></channel><item rdf:about="https://example.com/rdf-item"><title>RSS 1.0 item</title><link>https://example.com/rdf-item</link><dc:date xmlns:dc="http://purl.org/dc/elements/1.1/">2026-08-24T12:00:00Z</dc:date></item></rdf:RDF>`;
    const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><title>Saved Atom</title><entry><title>Atom item</title><link href="https://example.com/atom-item" /></entry></feed>`;
    expect(parseFeed(rss, 'https://reader.example/saved.xml').items).toHaveLength(1);
    expect(parseFeed(atom, 'https://reader.example/saved.atom').items[0]).toMatchObject({ title: 'Atom item', url: 'https://example.com/atom-item' });
    const feed = parseFeed(rdf, 'https://reader.example/saved.rdf');
    expect(feed.title).toBe('Saved RDF');
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]).toMatchObject({ title: 'RSS 1.0 item', url: 'https://example.com/rdf-item' });
  });

  it('reports malformed XML and unsupported protocols', () => {
    expect(() => parseFeed('<rss><channel>', 'https://example.com')).toThrow(/valid RSS or Atom/);
    expect(canonicalUrl('file:///etc/passwd')).toBeNull();
  });
});

describe('feed merge', () => {
  it('preserves local status and notes when a URL is imported again', () => {
    const parsed = parseFeed(rss, 'https://reader.example/saved.xml');
    const first = mergeFeed(structuredClone(EMPTY_STATE), parsed, 'https://reader.example/saved.xml', new Date('2026-01-01T00:00:00Z'));
    first.state.items[0]!.status = 'finished';
    first.state.items[0]!.note = 'Keep this';
    const second = mergeFeed(first.state, parsed, 'https://reader.example/saved.xml', new Date('2026-01-02T00:00:00Z'));
    expect(second.added).toBe(0);
    expect(second.existing).toBe(1);
    expect(second.state.items[0]).toMatchObject({ status: 'finished', note: 'Keep this' });
  });
});
