import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

test('landing page names the job, audience, and first action without accessibility violations', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle('Feed Later Bridge — import saved feeds locally');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Import saved feeds into a local queue');
  await expect(page.getByText('For RSS readers who save articles and want one small queue they control.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toHaveAttribute('href', '/demo/');
  await expect(page.locator('main')).toBeVisible();
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
  expect(errors).toEqual([]);
});

test('@claim:demo-sandbox opens populated isolated sample data and resets it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo\/$/);
  await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible();
  await expect(page.locator('.sample-item')).toHaveCount(3);
  await page.getByRole('button', { name: /Mark How small link archives outlast services finished/ }).click();
  await expect(page.getByText('1 waiting')).toBeVisible();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual(['demo:feed-later-bridge:queue']);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.sample-item')).toHaveCount(3);
  await expect(page.getByText('2 waiting')).toBeVisible();
  await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible();
});

test('@claim:demo-export previews open sample exports', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Preview Markdown' }).click();
  await expect(page.locator('#sample-output')).toContainText('# Feed Later Bridge sample export');
  await expect(page.locator('#sample-output')).toContainText('How small link archives outlast services');
  await page.getByRole('button', { name: 'Preview JSON' }).click();
  await expect(page.locator('#sample-output')).toContainText('"demo": true');
  await expect(page.locator('#sample-output')).toContainText('"items"');
});

test('@claim:free-download downloads a usable MV3 package without a session', async ({ page }) => {
  await page.goto('/demo/');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Download for Chrome' }).click()
  ]);
  expect(download.suggestedFilename()).toBe('feed-later-bridge-chrome.zip');
  const manifest = await promisify(execFile)('unzip', ['-p', await download.path()!, 'manifest.json']);
  expect(JSON.parse(manifest.stdout)).toMatchObject({ manifest_version: 3, name: 'Feed Later Bridge', version: '1.1.0' });
  expect(await page.context().cookies()).toEqual([]);
});

test('@claim:site-privacy makes only same-origin requests and sets no cookies', async ({ page, baseURL }) => {
  const urls: string[] = [];
  page.on('request', (request) => urls.push(request.url()));
  await page.goto('/');
  await page.goto('/demo/');
  expect(urls.length).toBeGreaterThan(0);
  expect(urls.every((url) => new URL(url).origin === new URL(baseURL!).origin)).toBe(true);
  expect(await page.context().cookies()).toEqual([]);
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual(['demo:feed-later-bridge:queue']);
});

test('all public routes have a title, one h1, a main landmark, and a styled 404', async ({ page }) => {
  for (const route of ['/', '/demo/', '/privacy/', '/terms/']) {
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('main')).toBeVisible();
    await expect(page).not.toHaveTitle('');
  }
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
});

test('mobile layout keeps the sample, navigation, and legal routes reachable', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'mobile project only');
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy', exact: true }).first()).toBeVisible();
  const bodyWidth = await page.locator('body').evaluate((element) => element.scrollWidth);
  const viewport = page.viewportSize();
  expect(bodyWidth).toBeLessThanOrEqual(viewport!.width);
});
