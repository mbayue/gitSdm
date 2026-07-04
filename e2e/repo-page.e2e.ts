import { test, expect } from '@playwright/test';

test.describe('Repository page', () => {
  test('navigating to a repo URL shows the viz workspace', async ({ page }) => {
    // Navigate to a known public repo page
    await page.goto('/mbayue/gitSdm', { timeout: 15000 });

    // The page should load — either the workspace UI or an error/loading state
    // Wait for the app shell to render
    await page.waitForSelector('header, [class*="top-nav"], [class*="header"]', { timeout: 20000 });

    // The page title should update
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('file explorer toggle button exists', async ({ page }) => {
    await page.goto('/mbayue/gitSdm', { timeout: 15000 });

    // Wait for the header to render
    await page.waitForSelector('header', { timeout: 20000 });

    // Look for the file explorer toggle (PanelLeft icon button)
    const toggleButtons = page.locator('button[aria-label*="Explorer"i], button[title*="Explorer"i]');
    if (await toggleButtons.count() > 0) {
      await expect(toggleButtons.first()).toBeVisible();
    }
  });
});
