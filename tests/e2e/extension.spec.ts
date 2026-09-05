import { chromium, expect, test, type BrowserContext, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const feedXml = `<?xml version="1.0"?><rss version="2.0"><channel><title>Test saved items</title><item><title>Safe imported article</title><link>http://127.0.0.1:4184/article</link><author>Test author</author><pubDate>Tue, 25 Aug 2026 12:00:00 GMT</pubDate></item></channel></rss>`;

function storageCall(page: Page, method: 'clear' | 'set', value?: object): Promise<void> {
  return page.evaluate(([call, payload]) => new Promise<void>((resolve) => {
    if (call === 'clear') chrome.storage.local.clear(resolve);
    else chrome.storage.local.set(payload ?? {}, resolve);
  }), [method, value] as const);
}

test.describe('extension workflow', () => {
  let context: BrowserContext;
  let extensionId: string;
  let extensionPath: string;
  let server: Server;
  let articleRequests = 0;

  test.beforeAll(async () => {
    extensionPath = await mkdtemp(join(tmpdir(), 'feed-later-bridge-test-'));
    await cp(resolve('.output/chrome-mv3'), extensionPath, { recursive: true });
    const manifestPath = join(extensionPath, 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.host_permissions = manifest.optional_host_permissions;
    delete manifest.optional_host_permissions;
    await writeFile(manifestPath, JSON.stringify(manifest));
    server = createServer((request, response) => {
      if (request.url === '/feed.xml') { response.writeHead(200, { 'content-type': 'application/rss+xml' }); response.end(feedXml); return; }
      if (request.url === '/redirect.xml') { response.writeHead(302, { location: '/feed.xml' }); response.end(); return; }
      if (request.url === '/article') { articleRequests += 1; response.writeHead(200, { 'content-type': 'text/html' }); response.end('<h1>Article</h1>'); return; }
      response.writeHead(404); response.end();
    });
    await new Promise<void>((resolve) => server.listen(4184, '127.0.0.1', resolve));
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
    });
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    extensionId = new URL(worker.url()).host;
  });

  test.afterAll(async () => {
    await context.close();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(extensionPath, { recursive: true, force: true });
  });

  async function optionsPage(query = ''): Promise<Page> {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html${query}`);
    return page;
  }

  test('@claim:local-queue keeps the demo isolated from the real browser queue', async () => {
    const page = await optionsPage();
    await storageCall(page, 'clear');
    await storageCall(page, 'set', {
      bridgeState: {
        version: 1,
        feedUrl: 'https://real.example/saved.xml',
        feedTitle: 'Real feed',
        lastSyncAt: '2026-08-20T00:00:00.000Z',
        items: [{ id: 'real', url: 'https://real.example/article', title: 'Real item', author: '', publishedAt: null, sourceTitle: 'Real feed', status: 'queued', note: 'Do not replace', savedAt: '2026-08-20T00:00:00.000Z', finishedAt: null }]
      }
    });
    await page.reload();
    await expect(page.getByText('Real item')).toBeVisible();
    await page.getByRole('button', { name: 'Try sample data' }).click();
    await expect(page).toHaveURL(/\?demo=1$/);
    await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible();
    await expect(page.locator('.queue-item')).toHaveCount(2);
    await page.getByRole('button', { name: /Mark .*finished/ }).first().click();
    await page.getByRole('button', { name: 'Start for real' }).click();
    await expect(page.getByText('Real item')).toBeVisible();
    await expect(page.getByText('Do not replace')).toBeVisible();
    const keys = await page.evaluate(() => new Promise<string[]>((resolve) => chrome.storage.local.get(null, (value) => resolve(Object.keys(value).sort()))));
    expect(keys).toEqual(['bridgeState']);
    await page.close();
  });

  test('@claim:queue-tools imports, searches, annotates, finishes, removes, and restores items', async () => {
    const page = await optionsPage('?demo=1');
    await storageCall(page, 'clear');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Import saved feeds into a local queue');
    await expect(page.locator('.queue-item')).toHaveCount(2);
    await page.getByLabel('Search queue').fill('solar-powered');
    await expect(page.locator('.queue-item')).toHaveCount(1);
    await page.getByLabel('Search queue').fill('');
    await page.getByRole('button', { name: 'Add note' }).first().click();
    await page.getByLabel('Private note').fill('Read this after the migration.');
    await page.getByLabel('Private note').blur();
    await expect(page.getByText('Note saved.')).toBeVisible();
    await page.getByRole('button', { name: /Mark .* finished/ }).first().click();
    await expect(page.getByText('Moved to Finished.')).toBeVisible();
    await page.getByRole('button', { name: /Remove/ }).first().click();
    await expect(page.getByText('Item removed.')).toBeVisible();
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText('Item restored.')).toBeVisible();
    const accessibility = await new AxeBuilder({ page: page as never }).analyze();
    expect(accessibility.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
    await page.close();
  });

  test('@claim:open-exports downloads complete Markdown, OPML, and JSON files', async () => {
    const page = await optionsPage('?demo=1');
    await storageCall(page, 'clear');
    await page.reload();
    const formats = [
      ['Markdown', 'feed-later-bridge.md'],
      ['OPML', 'feed-later-bridge.opml'],
      ['JSON', 'feed-later-bridge.json']
    ] as const;
    for (const [name, filename] of formats) {
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name }).click()]);
      expect(download.suggestedFilename()).toBe(filename);
      const output = await readFile(await download.path()!, 'utf8');
      expect(output).toContain('How small link archives outlast services');
      expect(output).toContain('A solar-powered website for a slower web');
      expect(output).toContain('Making links durable across tools');
    }
    await page.close();
  });

  test('@claim:feed-request-privacy omits cookies and gives redirect recovery guidance', async () => {
    const page = await optionsPage();
    await storageCall(page, 'clear');
    await page.reload();
    await context.addCookies([{ name: 'private-feed-cookie', value: 'should-not-send', url: 'http://127.0.0.1:4184/feed.xml' }]);
    const feedRequests: string[] = [];
    context.on('request', (request) => {
      if (request.url().includes(':4184/')) feedRequests.push(request.headers().cookie ?? '');
    });
    await page.getByLabel('Feed URL').fill('http://127.0.0.1:4184/feed.xml');
    await page.getByRole('button', { name: 'Import feed' }).click();
    await expect(page.getByText('1 new item imported. 0 already here.')).toBeVisible();
    expect(feedRequests).toContain('');
    await page.getByLabel('Feed URL').fill('http://127.0.0.1:4184/redirect.xml');
    await page.getByRole('button', { name: 'Import again' }).click();
    await expect(page.getByText('That feed redirected. Use its final direct feed URL and try again.')).toBeVisible();
    await page.close();
  });

  test('@claim:no-article-fetching imports feed metadata without requesting article links', async () => {
    articleRequests = 0;
    const page = await optionsPage();
    await storageCall(page, 'clear');
    await page.reload();
    await page.getByLabel('Feed URL').fill('http://127.0.0.1:4184/feed.xml');
    await page.getByRole('button', { name: 'Import feed' }).click();
    await expect(page.getByText('Safe imported article')).toBeVisible();
    expect(articleRequests).toBe(0);
    await page.close();
  });

  test('@claim:offline-queue reloads a saved demo queue in a separate browser context', async () => {
    const profile = await mkdtemp(join(tmpdir(), 'feed-later-bridge-offline-'));
    const isolated = await chromium.launchPersistentContext(profile, {
      channel: 'chromium',
      headless: true,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
    });
    try {
      let worker = isolated.serviceWorkers()[0];
      if (!worker) worker = await isolated.waitForEvent('serviceworker');
      const isolatedId = new URL(worker.url()).host;
      const page = await isolated.newPage();
      await page.goto(`chrome-extension://${isolatedId}/options.html?demo=1`);
      await expect(page.locator('.queue-item')).toHaveCount(2);
      await isolated.setOffline(true);
      await page.reload();
      await expect(page.getByText('You’re offline.')).toBeVisible();
      await expect(page.locator('.queue-item')).toHaveCount(2);
    } finally {
      await isolated.setOffline(false);
      await isolated.close();
      await rm(profile, { recursive: true, force: true });
    }
  });
});
