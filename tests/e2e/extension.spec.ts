import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

test.describe('extension workflow', () => {
  let context: BrowserContext;
  let extensionId: string;
  let extensionPath: string;

  test.beforeAll(async () => {
    extensionPath = await mkdtemp(join(tmpdir(), 'feed-later-bridge-test-'));
    await cp(resolve('.output/chrome-mv3'), extensionPath, { recursive: true });
    const manifestPath = join(extensionPath, 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.host_permissions = manifest.optional_host_permissions;
    delete manifest.optional_host_permissions;
    await writeFile(manifestPath, JSON.stringify(manifest));
    context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
    });
    let worker = context.serviceWorkers()[0];
    if (!worker) worker = await context.waitForEvent('serviceworker');
    extensionId = new URL(worker.url()).host;
  });

  test.afterAll(async () => { await context.close(); await rm(extensionPath, { recursive: true, force: true }); });

  test('imports, deduplicates, annotates, finishes, and retains a queue', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your reading, back in reach.');
    await page.getByLabel('Feed URL').fill('http://127.0.0.1:4173/sample-feed.xml');
    await page.getByRole('button', { name: 'Import feed' }).click();
    await expect(page.getByText(/2 new items imported/)).toBeVisible();
    await expect(page.locator('.queue-item')).toHaveCount(2);
    const accessibility = await new AxeBuilder({ page: page as never }).analyze();
    expect(accessibility.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
    await page.getByRole('button', { name: /Add note/ }).first().click();
    await page.getByLabel('Private note').fill('Return to this for the migration plan.');
    await page.getByLabel('Private note').blur();
    await expect(page.getByText('Note saved.')).toBeVisible();
    await page.getByRole('button', { name: /Mark .* finished/ }).first().click();
    await expect(page.locator('.queue-item')).toHaveCount(1);
    await page.reload();
    await page.getByRole('button', { name: /Finished/ }).click();
    await expect(page.getByText('Return to this for the migration plan.')).toBeVisible();
    await page.getByRole('button', { name: 'Import again' }).click();
    await expect(page.getByText(/Up to date/)).toBeVisible();
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'JSON' }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe('feed-later-bridge.json');
  });
});
