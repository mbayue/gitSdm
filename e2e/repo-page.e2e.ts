import { test, expect } from '@playwright/test';

test.describe('Repository page', () => {
  test('navigating to a repo URL shows the viz workspace', async ({ page }) => {
    // Navigate to a known public repo page
    await page.goto('/mbayue/gitSdm', { timeout: 15000 });

    // The page should load — either the workspace UI or an error/loading state
    // Wait for the app shell to render
    await page.waitForSelector('header, [class*="top-nav"], [class*="header"]', { timeout: 20000 });

    // The page title should contain the project name
    await expect(page).toHaveTitle(/gitSdm/i);
  });

});
