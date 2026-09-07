import { test, expect } from '@playwright/test';

test.describe('Branch switching', () => {
  test('BranchSwitcher button is visible on repo page', async ({ page }) => {
    await page.goto('/mock/gitsdm', { timeout: 15000 });

    // Wait for the header to render
    await page.waitForSelector('header', { timeout: 20000 });

    // The branch switcher button contains a GitBranch icon and branch name
    // It shows the default branch (usually 'master' or 'main')
    const branchButton = page.locator('button:has(svg)').filter({ hasText: /master|main/i });
    await expect(branchButton.first()).toBeVisible();
  });

  test('branch dropdown opens on click', async ({ page }) => {
    await page.goto('/mock/gitsdm', { timeout: 15000 });

    // Wait for the header
    await page.waitForSelector('header', { timeout: 20000 });

    // Click the branch button to open the dropdown
    const branchButton = page.locator('button:has(svg)').filter({ hasText: /master|main/i });
    await branchButton.first().click();

    // The dropdown should appear with filter/search input
    const searchInput = page.locator('input[placeholder*="Filter"i], input[placeholder*="branch"i]');
    await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
  });
});
