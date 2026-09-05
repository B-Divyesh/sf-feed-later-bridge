import type { BridgeState, ParsedFeed, ReadingItem } from './types';

const TRACKERS = /^(utm_(source|medium|campaign|term|content)|fbclid|gclid|mc_cid|mc_eid)$/i;

function childrenByName(element: Element, name: string): Element[] {
  return Array.from(element.children).filter((child) => child.localName.toLowerCase() === name);
}

function firstChild(element: Element, names: string[]): Element | undefined {
  return Array.from(element.children).find((child) => names.includes(child.localName.toLowerCase()));
}

function cleanText(value: string | null | undefined): string {
  if (!value) return '';
  const parsed = new DOMParser().parseFromString(value, 'text/html');
  return (parsed.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function canonicalUrl(value: string, baseUrl?: string): string | null {
  try {
    const url = new URL(value.trim(), baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKERS.test(key)) url.searchParams.delete(key);
    }
    url.hostname = url.hostname.toLowerCase();
    if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) {
      url.port = '';
    }
    return url.toString();
  } catch {
    return null;
  }
}

function stableId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `item-${(hash >>> 0).toString(36)}`;
}

function safeDate(value: string): string | null {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function atomLink(entry: Element): string {
  const links = childrenByName(entry, 'link');
  const preferred = links.find((link) => !link.getAttribute('rel') || link.getAttribute('rel') === 'alternate');
  return preferred?.getAttribute('href') ?? preferred?.textContent ?? '';
}

export function parseFeed(xml: string, feedUrl: string): ParsedFeed {
  if (xml.length > 5_000_000) throw new Error('That feed is larger than the 5 MB import limit.');
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.querySelector('parsererror')) throw new Error('This URL did not return valid RSS or Atom XML.');

  const root = document.documentElement;
  const rootName = root.localName.toLowerCase();
  const isAtom = rootName === 'feed';
  const channel = isAtom ? root : firstChild(root, ['channel']) ?? root;
  // RSS 1.0 puts <item> siblings beside <channel> inside rdf:RDF. RSS 2.0
  // keeps them inside <channel>, so look at the document root for RDF only.
  const nodes = isAtom ? childrenByName(channel, 'entry') : rootName === 'rdf' ? childrenByName(root, 'item') : childrenByName(channel, 'item');
  if (!isAtom && !['rss', 'rdf'].includes(rootName) && nodes.length === 0) {
    throw new Error('This URL does not look like an RSS or Atom feed.');
  }

  const title = cleanText(firstChild(channel, ['title'])?.textContent) || new URL(feedUrl).hostname;
  const seen = new Set<string>();
  const items: ParsedFeed['items'] = [];

  for (const node of nodes.slice(0, 1000)) {
    const rawLink = isAtom ? atomLink(node) : firstChild(node, ['link'])?.textContent ?? '';
    const url = canonicalUrl(rawLink, feedUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const rawTitle = firstChild(node, ['title'])?.textContent;
    const rawAuthor = firstChild(node, ['author', 'creator'])?.textContent;
    const rawDate = firstChild(node, ['published', 'updated', 'pubdate', 'date'])?.textContent ?? '';
    items.push({
      id: stableId(url),
      url,
      title: cleanText(rawTitle) || new URL(url).hostname,
      author: cleanText(rawAuthor),
      publishedAt: safeDate(rawDate),
      sourceTitle: title
    });
  }

  return { title, items };
}

export function mergeFeed(state: BridgeState, feed: ParsedFeed, feedUrl: string, now = new Date()): { state: BridgeState; added: number; existing: number } {
  const byUrl = new Map(state.items.map((item) => [canonicalUrl(item.url) ?? item.url, item]));
  let added = 0;
  let existing = 0;
  const imported: ReadingItem[] = [];

  for (const candidate of feed.items) {
    const found = byUrl.get(candidate.url);
    if (found) {
      existing += 1;
      imported.push({ ...found, title: candidate.title, author: candidate.author, publishedAt: candidate.publishedAt, sourceTitle: feed.title });
    } else {
      added += 1;
      imported.push({ ...candidate, status: 'queued', note: '', savedAt: now.toISOString(), finishedAt: null });
    }
  }

  const importedUrls = new Set(imported.map((item) => item.url));
  return {
    state: {
      version: 1,
      feedUrl,
      feedTitle: feed.title,
      lastSyncAt: now.toISOString(),
      items: [...imported, ...state.items.filter((item) => !importedUrls.has(canonicalUrl(item.url) ?? item.url))]
    },
    added,
    existing
  };
}
