import type { BridgeState, ReadingItem } from './types';

function xml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function markdown(value: string): string {
  return value.replace(/([\\`*_[\]<>])/g, '\\$1');
}

export function toMarkdown(items: ReadingItem[]): string {
  const lines = ['# Feed Later Bridge export', '', `Exported ${new Date().toISOString()}`, ''];
  for (const item of items) {
    lines.push(`- [${item.status === 'finished' ? 'x' : ' '}] [${markdown(item.title)}](${item.url})`);
    const details = [item.sourceTitle, item.author, item.publishedAt?.slice(0, 10)].filter((value): value is string => Boolean(value)).map(markdown);
    if (details.length) lines.push(`  - ${details.join(' · ')}`);
    if (item.note) lines.push(`  - Note: ${markdown(item.note)}`);
  }
  return `${lines.join('\n')}\n`;
}

export function toJson(state: BridgeState): string {
  return `${JSON.stringify({ exportedAt: new Date().toISOString(), feed: { url: state.feedUrl, title: state.feedTitle }, items: state.items }, null, 2)}\n`;
}

export function toOpml(state: BridgeState): string {
  const outlines = state.items.map((item) => `    <outline type="link" text="${xml(item.title)}" htmlUrl="${xml(item.url)}" category="${item.status}"${item.note ? ` description="${xml(item.note)}"` : ''}/>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0">\n  <head>\n    <title>Feed Later Bridge — ${xml(state.feedTitle || 'saved items')}</title>\n    <dateCreated>${new Date().toUTCString()}</dateCreated>\n  </head>\n  <body>\n${outlines.join('\n')}\n  </body>\n</opml>\n`;
}
