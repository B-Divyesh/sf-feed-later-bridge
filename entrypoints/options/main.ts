import './style.css';
import { browser } from 'wxt/browser';
import { canonicalUrl, mergeFeed, parseFeed } from '../../src/feed';
import { toJson, toMarkdown, toOpml } from '../../src/export';
import { createDemoState } from '../../src/demo';
import { clearState, loadState, saveState } from '../../src/storage';
import { EMPTY_STATE, type BridgeState, type ItemStatus, type ReadingItem } from '../../src/types';

type Filter = 'queued' | 'finished' | 'all';
const app = document.querySelector<HTMLDivElement>('#app')!;
let state: BridgeState = structuredClone(EMPTY_STATE);
let filter: Filter = 'queued';
let query = '';
let sort: 'newest' | 'oldest' = 'newest';
let openNoteId: string | null = null;
let removed: { item: ReadingItem; index: number } | null = null;
let undoTimer: number | undefined;
let demoMode = new URLSearchParams(location.search).get('demo') === '1';

app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#main" aria-label="Feed Later Bridge">
      <img src="/icon/bridge.svg" width="36" height="36" alt="" />
      <span><strong>Feed Later</strong><small>Bridge</small></span>
    </a>
    <div class="privacy-chip"><span aria-hidden="true"></span> Local only</div>
  </header>
  <main id="main" class="workbench">
    <aside class="source-panel" aria-labelledby="source-title">
      <p class="eyebrow">01 / Source</p>
      <p id="source-title" class="source-title">Connect your saved feed</p>
      <p class="aside-copy">Paste the RSS or Atom URL your reader exposes for saved items.</p>
      <form id="feed-form" novalidate>
        <label for="feed-url">Feed URL</label>
        <div class="input-stack">
          <input id="feed-url" name="feedUrl" type="url" inputmode="url" autocomplete="url" spellcheck="false" placeholder="https://reader.example/saved.xml" required />
          <p id="feed-help" class="field-help">Permission is limited to this feed’s origin.</p>
        </div>
        <button class="primary" id="import-button" type="submit">
          <span class="button-label">Import feed</span><span class="arrow" aria-hidden="true">→</span>
        </button>
      </form>
      <button class="sample-button" id="try-demo" type="button">Try sample data <span aria-hidden="true">→</span></button>
      <p class="sample-help">Loads three sample articles in a separate demo queue.</p>
      <div id="source-summary" class="source-summary" hidden></div>
      <details class="privacy-note">
        <summary>What stays private?</summary>
        <p>The feed URL, titles, notes, and progress stay in this browser. There is no account or bridge server.</p>
      </details>
    </aside>

    <section class="queue-panel" aria-labelledby="page-title">
      <div id="demo-banner" class="demo-banner" role="status" hidden><span><strong>Demo — sample data, nothing is saved.</strong> This queue is separate from your data.</span><span class="demo-actions"><button id="reset-demo" type="button">Reset demo</button><button id="start-real" type="button">Start for real</button></span></div>
      <div class="queue-heading">
        <div>
          <p class="eyebrow">02 / Queue</p>
          <h1 id="page-title">Import saved feeds into a local queue</h1>
        </div>
        <div class="queue-count" aria-label="Queue item count"><strong id="queue-count">0</strong><span>waiting</span></div>
      </div>
      <div id="offline-banner" class="offline-banner" role="status" hidden><strong>You’re offline.</strong> Your queue still works; reconnect to import.</div>
      <div class="toolbar" aria-label="Queue controls">
        <div class="filters" role="group" aria-label="Filter items">
          <button type="button" data-filter="queued" aria-pressed="true">Queue <span id="queued-badge">0</span></button>
          <button type="button" data-filter="finished" aria-pressed="false">Finished <span id="finished-badge">0</span></button>
          <button type="button" data-filter="all" aria-pressed="false">All</button>
        </div>
        <label class="search"><span class="sr-only">Search queue</span><input id="search" type="search" placeholder="Search titles or notes" /></label>
        <label class="sort-label"><span class="sr-only">Sort queue</span><select id="sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
      </div>
      <div id="route-progress" class="route-progress" role="progressbar" aria-label="Importing feed" hidden><span></span></div>
      <div id="queue-content" aria-live="polite" aria-busy="false"></div>
      <div class="export-bar">
        <div><span class="eyebrow">03 / Export</span><p>Download your queue as Markdown, OPML, or JSON.</p></div>
        <div class="export-actions" role="group" aria-label="Export all items">
          <button type="button" data-export="md">Markdown</button>
          <button type="button" data-export="opml">OPML</button>
          <button type="button" data-export="json">JSON</button>
        </div>
      </div>
    </section>
  </main>
  <footer><span>Feed Later Bridge <b id="version"></b></span><span>Queue data stays in this browser.</span></footer>
  <div id="toast" class="toast" role="status" aria-live="polite" hidden><span id="toast-text"></span><button id="undo" type="button" hidden>Undo</button></div>
`;

const elements = {
  form: app.querySelector<HTMLFormElement>('#feed-form')!,
  input: app.querySelector<HTMLInputElement>('#feed-url')!,
  importButton: app.querySelector<HTMLButtonElement>('#import-button')!,
  summary: app.querySelector<HTMLDivElement>('#source-summary')!,
  queue: app.querySelector<HTMLDivElement>('#queue-content')!,
  count: app.querySelector<HTMLElement>('#queue-count')!,
  queuedBadge: app.querySelector<HTMLElement>('#queued-badge')!,
  finishedBadge: app.querySelector<HTMLElement>('#finished-badge')!,
  search: app.querySelector<HTMLInputElement>('#search')!,
  sort: app.querySelector<HTMLSelectElement>('#sort')!,
  offline: app.querySelector<HTMLDivElement>('#offline-banner')!,
  progress: app.querySelector<HTMLDivElement>('#route-progress')!,
  toast: app.querySelector<HTMLDivElement>('#toast')!,
  toastText: app.querySelector<HTMLSpanElement>('#toast-text')!,
  undo: app.querySelector<HTMLButtonElement>('#undo')!,
  version: app.querySelector<HTMLElement>('#version')!,
  demoBanner: app.querySelector<HTMLDivElement>('#demo-banner')!,
  tryDemo: app.querySelector<HTMLButtonElement>('#try-demo')!,
  resetDemo: app.querySelector<HTMLButtonElement>('#reset-demo')!,
  startReal: app.querySelector<HTMLButtonElement>('#start-real')!
};

elements.version.textContent = `v${browser.runtime.getManifest().version}`;
elements.queue.setAttribute('aria-busy', 'true');

function announce(message: string, canUndo = false): void {
  window.clearTimeout(undoTimer);
  elements.toastText.textContent = message;
  elements.undo.hidden = !canUndo;
  elements.toast.hidden = false;
  undoTimer = window.setTimeout(() => { elements.toast.hidden = true; removed = null; }, canUndo ? 6500 : 4200);
}

function visibleItems(): ReadingItem[] {
  const needle = query.trim().toLowerCase();
  return state.items
    .filter((item) => filter === 'all' || item.status === filter)
    .filter((item) => !needle || `${item.title} ${item.author} ${item.sourceTitle} ${item.note}`.toLowerCase().includes(needle))
    .sort((a, b) => {
      const aTime = Date.parse(a.publishedAt ?? a.savedAt);
      const bTime = Date.parse(b.publishedAt ?? b.savedAt);
      return sort === 'newest' ? bTime - aTime : aTime - bTime;
    });
}

function formatDate(item: ReadingItem): string {
  const date = new Date(item.publishedAt ?? item.savedAt);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date) : 'Date unknown';
}

function emptyState(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'empty-state';
  const glyph = document.createElement('span');
  glyph.className = 'empty-glyph';
  glyph.setAttribute('aria-hidden', 'true');
  const title = document.createElement('h2');
  const copy = document.createElement('p');
  if (state.items.length === 0) {
    title.textContent = 'The bridge is ready.';
    copy.textContent = 'Connect a saved-items feed to build your private queue.';
  } else if (query) {
    title.textContent = 'No matching items.';
    copy.textContent = 'Try a different title, source, or note.';
  } else {
    title.textContent = filter === 'queued' ? 'Queue cleared.' : 'Nothing finished yet.';
    copy.textContent = filter === 'queued' ? 'Switch to Finished to view completed items.' : 'Mark an article finished to view it here.';
  }
  wrapper.append(glyph, title, copy);
  return wrapper;
}

function itemRow(item: ReadingItem): HTMLElement {
  const article = document.createElement('article');
  article.className = 'queue-item';
  article.dataset.id = item.id;

  const statusButton = document.createElement('button');
  statusButton.type = 'button';
  statusButton.className = 'status-button';
  statusButton.dataset.action = 'toggle';
  statusButton.setAttribute('aria-label', item.status === 'queued' ? `Mark “${item.title}” finished` : `Return “${item.title}” to queue`);
  statusButton.setAttribute('aria-pressed', String(item.status === 'finished'));
  statusButton.textContent = item.status === 'finished' ? '✓' : '';

  const content = document.createElement('div');
  content.className = 'item-content';
  const meta = document.createElement('div');
  meta.className = 'item-meta';
  const source = document.createElement('span');
  source.textContent = item.sourceTitle || new URL(item.url).hostname;
  const date = document.createElement('time');
  date.dateTime = item.publishedAt ?? item.savedAt;
  date.textContent = formatDate(item);
  meta.append(source, date);
  const link = document.createElement('a');
  link.href = item.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = item.title;
  const byline = document.createElement('p');
  byline.className = 'byline';
  byline.textContent = item.author ? `By ${item.author}` : new URL(item.url).hostname;
  content.append(meta, link, byline);
  if (item.note && openNoteId !== item.id) {
    const notePreview = document.createElement('p');
    notePreview.className = 'note-preview';
    notePreview.textContent = item.note;
    content.append(notePreview);
  }

  const actions = document.createElement('div');
  actions.className = 'item-actions';
  const noteButton = document.createElement('button');
  noteButton.type = 'button';
  noteButton.dataset.action = 'note';
  noteButton.setAttribute('aria-expanded', String(openNoteId === item.id));
  noteButton.textContent = item.note ? 'Edit note' : 'Add note';
  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.dataset.action = 'remove';
  removeButton.className = 'icon-button';
  removeButton.setAttribute('aria-label', `Remove “${item.title}”`);
  removeButton.textContent = '×';
  actions.append(noteButton, removeButton);

  article.append(statusButton, content, actions);
  if (openNoteId === item.id) {
    const noteWrap = document.createElement('label');
    noteWrap.className = 'note-editor';
    noteWrap.textContent = 'Private note';
    const textarea = document.createElement('textarea');
    textarea.maxLength = 2000;
    textarea.rows = 3;
    textarea.value = item.note;
    textarea.dataset.action = 'save-note';
    textarea.placeholder = 'Why is this worth returning to?';
    noteWrap.append(textarea);
    article.append(noteWrap);
    queueMicrotask(() => textarea.focus());
  }
  return article;
}

function render(): void {
  elements.demoBanner.hidden = !demoMode;
  elements.tryDemo.hidden = demoMode;
  app.querySelector<HTMLElement>('.sample-help')!.hidden = demoMode;
  const queued = state.items.filter((item) => item.status === 'queued').length;
  const finished = state.items.length - queued;
  elements.count.textContent = String(queued);
  elements.queuedBadge.textContent = String(queued);
  elements.finishedBadge.textContent = String(finished);
  elements.summary.hidden = !state.feedUrl;
  if (state.feedUrl) {
    elements.summary.replaceChildren();
    const name = document.createElement('strong');
    name.textContent = state.feedTitle || new URL(state.feedUrl).hostname;
    const sync = document.createElement('span');
    sync.textContent = state.lastSyncAt ? `Last import ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(state.lastSyncAt))}` : 'Not imported yet';
    elements.summary.append(name, sync);
  }
  elements.queue.replaceChildren();
  const items = visibleItems();
  if (!items.length) elements.queue.append(emptyState());
  else {
    const list = document.createElement('div');
    list.className = 'queue-list';
    for (const item of items) list.append(itemRow(item));
    elements.queue.append(list);
  }
}

async function requestOrigin(url: URL): Promise<boolean> {
  const origins = [`${url.origin}/*`];
  if (await browser.permissions.contains({ origins })) return true;
  return browser.permissions.request({ origins });
}

async function importFeed(): Promise<void> {
  const raw = elements.input.value.trim();
  let url: URL;
  try {
    url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
  } catch {
    elements.input.setCustomValidity('Enter a complete http:// or https:// feed URL.');
    elements.input.reportValidity();
    return;
  }
  elements.input.setCustomValidity('');
  if (!navigator.onLine) {
    announce('You’re offline. Your saved queue is still available.');
    return;
  }
  let granted = false;
  try {
    granted = await requestOrigin(url);
  } catch {
    announce('The browser could not request access to that feed origin. Try again.');
    return;
  }
  if (!granted) {
    announce('Feed access was not granted. Allow this origin to import it.');
    return;
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  elements.importButton.disabled = true;
  elements.importButton.querySelector('.button-label')!.textContent = 'Importing…';
  elements.queue.setAttribute('aria-busy', 'true');
  elements.progress.hidden = false;
  try {
    const response = await fetch(url.toString(), { credentials: 'omit', redirect: 'manual', signal: controller.signal, headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9' } });
    if (response.type === 'opaqueredirect' || response.status >= 300 && response.status < 400) throw new Error('That feed redirected. Use its final direct feed URL and try again.');
    if (!response.ok) throw new Error(`The feed returned HTTP ${response.status}. Check the URL and try again.`);
    const xml = await response.text();
    const parsed = parseFeed(xml, url.toString());
    const merged = mergeFeed(state, parsed, url.toString());
    state = merged.state;
    await saveState(state, demoMode ? 'demo' : 'real');
    render();
    announce(merged.added ? `${merged.added} new ${merged.added === 1 ? 'item' : 'items'} imported. ${merged.existing} already here.` : `Up to date. ${merged.existing} ${merged.existing === 1 ? 'item is' : 'items are'} already here.`);
  } catch (error) {
    const message = error instanceof DOMException && error.name === 'AbortError' ? 'The feed took too long to respond. Try again.' : error instanceof Error && error.message === 'Failed to fetch' ? 'The feed could not be fetched. Check the URL and use its final direct feed URL.' : error instanceof Error ? error.message : 'The feed could not be imported. Try again.';
    announce(message);
  } finally {
    window.clearTimeout(timeout);
    elements.importButton.disabled = false;
    elements.importButton.querySelector('.button-label')!.textContent = state.feedUrl ? 'Import again' : 'Import feed';
    elements.queue.setAttribute('aria-busy', 'false');
    elements.progress.hidden = true;
  }
}

elements.form.addEventListener('submit', (event) => { event.preventDefault(); void importFeed(); });
elements.input.addEventListener('input', () => elements.input.setCustomValidity(''));
elements.search.addEventListener('input', () => { query = elements.search.value; render(); });
elements.sort.addEventListener('change', () => { sort = elements.sort.value as typeof sort; render(); });
app.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  filter = button.dataset.filter as Filter;
  app.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
  render();
}));

elements.queue.addEventListener('click', async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
  const article = button?.closest<HTMLElement>('[data-id]');
  if (!button || !article) return;
  const index = state.items.findIndex((item) => item.id === article.dataset.id);
  if (index < 0) return;
  const item = state.items[index]!;
  if (button.dataset.action === 'toggle') {
    const next: ItemStatus = item.status === 'queued' ? 'finished' : 'queued';
    state.items[index] = { ...item, status: next, finishedAt: next === 'finished' ? new Date().toISOString() : null };
    await saveState(state, demoMode ? 'demo' : 'real');
    render();
    announce(next === 'finished' ? 'Moved to Finished.' : 'Returned to Queue.');
  } else if (button.dataset.action === 'note') {
    openNoteId = openNoteId === item.id ? null : item.id;
    render();
  } else if (button.dataset.action === 'remove') {
    removed = { item, index };
    state.items.splice(index, 1);
    await saveState(state, demoMode ? 'demo' : 'real');
    render();
    announce('Item removed.', true);
  }
});

elements.queue.addEventListener('change', async (event) => {
  const textarea = (event.target as HTMLElement).closest<HTMLTextAreaElement>('textarea[data-action="save-note"]');
  const article = textarea?.closest<HTMLElement>('[data-id]');
  if (!textarea || !article) return;
  const item = state.items.find((candidate) => candidate.id === article.dataset.id);
  if (!item) return;
  item.note = textarea.value.trim();
    await saveState(state, demoMode ? 'demo' : 'real');
  announce(item.note ? 'Note saved.' : 'Note cleared.');
});

elements.undo.addEventListener('click', async () => {
  if (!removed) return;
  state.items.splice(removed.index, 0, removed.item);
  removed = null;
  await saveState(state, demoMode ? 'demo' : 'real');
  render();
  announce('Item restored.');
});

function download(name: string, type: string, contents: string): void {
  const href = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

app.querySelectorAll<HTMLButtonElement>('[data-export]').forEach((button) => button.addEventListener('click', () => {
  if (!state.items.length) { announce('Import at least one item before exporting.'); return; }
  const format = button.dataset.export;
  if (format === 'md') download('feed-later-bridge.md', 'text/markdown', toMarkdown(state.items));
  if (format === 'opml') download('feed-later-bridge.opml', 'text/x-opml', toOpml(state));
  if (format === 'json') download('feed-later-bridge.json', 'application/json', toJson(state));
  announce(`Exported ${state.items.length} ${state.items.length === 1 ? 'item' : 'items'} as ${format?.toUpperCase()}.`);
}));

function updateOnline(): void { elements.offline.hidden = navigator.onLine; }
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);
updateOnline();

async function enterDemo(reset = false): Promise<void> {
  demoMode = true;
  history.replaceState(null, '', '?demo=1');
  state = reset ? createDemoState() : await loadState('demo');
  if (!state.items.length) state = createDemoState();
  await saveState(state, 'demo');
  elements.input.value = state.feedUrl;
  elements.importButton.querySelector('.button-label')!.textContent = 'Import again';
  render();
  announce(reset ? 'Demo reset with three sample articles.' : 'Demo loaded with three sample articles.');
}

elements.tryDemo.addEventListener('click', () => { void enterDemo(true); });
elements.resetDemo.addEventListener('click', () => { void enterDemo(true); });
elements.startReal.addEventListener('click', () => {
  void clearState('demo').then(async () => {
    demoMode = false;
    history.replaceState(null, '', location.pathname);
    state = await loadState('real');
    elements.input.value = state.feedUrl;
    elements.importButton.querySelector('.button-label')!.textContent = state.feedUrl ? 'Import again' : 'Import feed';
    render();
    announce('Demo discarded. Your real queue is ready.');
  });
});

void loadState(demoMode ? 'demo' : 'real').then(async (loaded) => {
  state = loaded;
  if (demoMode && !state.items.length) {
    state = createDemoState();
    await saveState(state, 'demo');
  }
  elements.input.value = state.feedUrl;
  elements.importButton.querySelector('.button-label')!.textContent = state.feedUrl ? 'Import again' : 'Import feed';
  elements.queue.setAttribute('aria-busy', 'false');
  render();
});
