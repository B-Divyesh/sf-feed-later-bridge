type DemoItem = {
  id: string;
  title: string;
  author: string;
  date: string;
  source: string;
  note: string;
  finished: boolean;
};

const DEMO_KEY = 'demo:feed-later-bridge:queue';
const sampleItems: DemoItem[] = [
  { id: 'archives', title: 'How small link archives outlast services', author: 'Mara Bell', date: 'Aug 24, 2026', source: 'Saved in Miniflux', note: 'Compare the export choices before moving old saves.', finished: false },
  { id: 'solar', title: 'A solar-powered website for a slower web', author: 'Rin Okafor', date: 'Aug 22, 2026', source: 'Saved in Miniflux', note: '', finished: false },
  { id: 'durable', title: 'Making links durable across tools', author: 'Iris Chen', date: 'Aug 19, 2026', source: 'Saved in Miniflux', note: 'Keep the migration checklist.', finished: true }
];

const list = document.querySelector<HTMLDivElement>('#sample-list')!;
const count = document.querySelector<HTMLElement>('#sample-count')!;
const output = document.querySelector<HTMLPreElement>('#sample-output')!;
const search = document.querySelector<HTMLInputElement>('#sample-search')!;
let items = loadDemo();

function cloneSample(): DemoItem[] {
  return structuredClone(sampleItems);
}

function loadDemo(): DemoItem[] {
  try {
    const stored = localStorage.getItem(DEMO_KEY);
    const value = stored ? JSON.parse(stored) : null;
    return Array.isArray(value) && value.length === sampleItems.length ? value : cloneSample();
  } catch {
    return cloneSample();
  }
}

function saveDemo(): void {
  localStorage.setItem(DEMO_KEY, JSON.stringify(items));
}

function makeButton(text: string, id: string, action: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.id = id;
  button.dataset.action = action;
  button.textContent = text;
  return button;
}

function render(): void {
  const needle = search.value.trim().toLowerCase();
  const visible = items.filter((item) => !needle || `${item.title} ${item.author} ${item.note}`.toLowerCase().includes(needle));
  const waiting = items.filter((item) => !item.finished).length;
  count.textContent = String(waiting);
  list.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'sample-empty';
    empty.textContent = 'No sample articles match that search.';
    list.append(empty);
    return;
  }
  for (const item of visible) {
    const article = document.createElement('article');
    article.className = 'sample-item';
    const status = makeButton(item.finished ? 'Finished' : 'Mark finished', item.id, 'toggle');
    status.className = item.finished ? 'sample-status is-finished' : 'sample-status';
    status.setAttribute('aria-pressed', String(item.finished));
    status.setAttribute('aria-label', item.finished ? `Return ${item.title} to the queue` : `Mark ${item.title} finished`);
    const content = document.createElement('div');
    const meta = document.createElement('p');
    meta.className = 'sample-meta';
    meta.textContent = `${item.source} · ${item.date}`;
    const heading = document.createElement('h3');
    heading.textContent = item.title;
    const byline = document.createElement('p');
    byline.className = 'sample-byline';
    byline.textContent = `By ${item.author}`;
    content.append(meta, heading, byline);
    if (item.note) {
      const note = document.createElement('p');
      note.className = 'sample-note';
      note.textContent = `Note: ${item.note}`;
      content.append(note);
    }
    const actions = document.createElement('div');
    actions.className = 'sample-actions';
    actions.append(makeButton(item.note ? 'Edit note' : 'Add note', item.id, 'note'));
    article.append(status, content, actions);
    list.append(article);
  }
}

function markdown(): string {
  return ['# Feed Later Bridge sample export', '', ...items.map((item) => `- [${item.finished ? 'x' : ' '}] ${item.title}${item.note ? ` — Note: ${item.note}` : ''}`)].join('\n');
}

list.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
  if (!button) return;
  const item = items.find((candidate) => candidate.id === button.dataset.id);
  if (!item) return;
  if (button.dataset.action === 'toggle') item.finished = !item.finished;
  if (button.dataset.action === 'note') item.note = item.note ? '' : 'Add a private note in the extension.';
  saveDemo();
  render();
});

search.addEventListener('input', render);
document.querySelector<HTMLButtonElement>('#reset-demo')!.addEventListener('click', () => {
  items = cloneSample();
  saveDemo();
  search.value = '';
  output.hidden = true;
  render();
});
document.querySelectorAll<HTMLButtonElement>('[data-export]').forEach((button) => button.addEventListener('click', () => {
  output.textContent = button.dataset.export === 'markdown' ? markdown() : JSON.stringify({ demo: true, items }, null, 2);
  output.hidden = false;
}));

saveDemo();
render();
