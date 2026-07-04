import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test('search page loads and has search input', async ({ page }) => {
    // Navigate to a repo's search page
    await page.goto('/mbayue/gitSdm/search', { timeout: 15000 });

    // Should have a search input or search-related UI
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"i], input[placeholder*="Ask"i]');
    await expect(searchInput.first()).toBeVisible({ timeout: 15000 });
  });

});
