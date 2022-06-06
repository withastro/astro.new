import { test, expect } from '@playwright/test';

test('page title', async ({ page }) => {
  await page.goto('/');
  const title = page.locator('main h1');
  await expect(title).toHaveText('astro.new');

  const pageTitle = await page.title();
  await expect(pageTitle).toBe('astro.new');
});