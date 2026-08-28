import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing page has a clear download path and no serious accessibility violations', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Feed Later Bridge/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('link', { name: /Download for Chrome/ })).toHaveAttribute('href', '/downloads/feed-later-bridge-chrome.zip');
  await expect(page.locator('main')).toBeVisible();
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
  expect(errors).toEqual([]);
});

test('mobile layout keeps primary actions and legal routes reachable', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'mobile project only');
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Download for Chrome/ })).toBeVisible();
  await page.getByRole('link', { name: /Privacy/, exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: /Privacy/, exact: true })).toBeVisible();
  const bodyWidth = await page.locator('body').evaluate((element) => element.scrollWidth);
  const viewport = page.viewportSize();
  expect(bodyWidth).toBeLessThanOrEqual(viewport!.width);
});

for (const route of ['/privacy/', '/terms/']) {
  test(`${route} has legal content and semantic structure`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('main')).toBeVisible();
  });
}
