import { test, expect } from '@playwright/test';

test.describe('AI Explain (mock mode)', () => {
  test('AI sidebar toggle button exists on repo page', async ({ page }) => {
    await page.goto('/mbayue/gitSdm', { timeout: 15000 });

    // Wait for the header to render
    await page.waitForSelector('header', { timeout: 20000 });

    // Look for the AI sidebar toggle button
    const aiButton = page.locator('button[aria-label*="AI"i], button[title*="AI"i]');
    await expect(aiButton.first()).toBeVisible();
  });

  test('AI sidebar renders when toggled', async ({ page }) => {
    await page.goto('/mbayue/gitSdm', { timeout: 15000 });

    await page.waitForSelector('header', { timeout: 20000 });

    // Try to find and click the AI sidebar toggle
    const aiButton = page.locator('button[aria-label*="AI"i], button[title*="AI"i]');
    await aiButton.first().click();

    // The AI sidebar should appear with content
    const aiPanel = page.locator('text=/explain|AI|assistant/i');
    await expect(aiPanel.first()).toBeVisible({ timeout: 5000 });
  });
});
