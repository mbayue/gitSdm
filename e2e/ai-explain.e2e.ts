import { test, expect } from '@playwright/test';

test.describe('AI Explain (mock mode)', () => {
  test('AI tools tab is accessible in repository insights sidebar', async ({ page }) => {
    await page.goto('/mock/gitsdm', { timeout: 15000 });

    // Wait for the app shell to render
    await page.waitForSelector('header, [class*="top-nav"], [class*="header"]', { timeout: 20000 });

    // Look for the AI tools tab in the sidebar
    const aiTab = page.getByRole('tab', { name: 'AI tools', exact: true });
    await expect(aiTab).toBeVisible({ timeout: 10000 });
  });

  test('AI tools tab renders intelligence and action tools when clicked', async ({ page }) => {
    await page.goto('/mock/gitsdm', { timeout: 15000 });

    await page.waitForSelector('header, [class*="top-nav"], [class*="header"]', { timeout: 20000 });

    const aiTab = page.getByRole('tab', { name: 'AI tools', exact: true });
    await aiTab.click();

    // The AI panel tab should become selected and render AI action tools
    await expect(aiTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Explain Selection').first()).toBeVisible({ timeout: 10000 });
  });
});
