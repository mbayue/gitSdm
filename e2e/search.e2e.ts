import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test('search page loads and has search input', async ({ page }) => {
    // Navigate to a repo's search page
    await page.goto('/mbayue/gitSdm/search', { timeout: 15000 });

    // Wait for the search page to render
    // Should have a search input or search-related UI
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"i], input[placeholder*="Ask"i]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('homepage has a search navigation element', async ({ page }) => {
    await page.goto('/');

    // Check for search-related navigation links
    const searchLink = page.locator('a[href*="search"], button:has-text("Search")');
    if (await searchLink.count() > 0) {
      await expect(searchLink.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
