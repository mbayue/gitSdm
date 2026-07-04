import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads and displays key elements', async ({ page }) => {
    await page.goto('/');

    // Page title is present
    await expect(page).toHaveTitle(/gitSdm/i);

    // Repo input exists with expected placeholder
    const repoInput = page.locator('input[placeholder*="github.com"]');
    await expect(repoInput).toBeVisible({ timeout: 15000 });

    // Navigation bar exists
    await expect(page.locator('nav, header').first()).toBeVisible({ timeout: 5000 });
  });

  test('can type a repo URL into the input', async ({ page }) => {
    await page.goto('/');

    const repoInput = page.locator('input[placeholder*="github.com"]');
    await expect(repoInput).toBeVisible({ timeout: 15000 });

    await repoInput.fill('https://github.com/mbayue/gitSdm');
    await expect(repoInput).toHaveValue(/github\.com/);
  });
});
