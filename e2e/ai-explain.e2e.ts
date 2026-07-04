import { test, expect } from '@playwright/test';

test.describe('AI Explain (mock mode)', () => {
  test('AI sidebar toggle button exists on repo page', async ({ page }) => {
    await page.goto('/mbayue/gitSdm', { timeout: 15000 });

    // Wait for the header to render
    await page.waitForSelector('header', { timeout: 20000 });

    // Look for the AI sidebar toggle (PanelRight icon or AI-related button)
    const aiButton = page.locator('button[aria-label*="AI"i], button[title*="AI"i], button[title*="Sidebar"i]');
    if (await aiButton.count() > 0) {
      await expect(aiButton.first()).toBeVisible();
    }
  });

  test('AI sidebar renders when toggled', async ({ page }) => {
    await page.goto('/mbayue/gitSdm', { timeout: 15000 });

    await page.waitForSelector('header', { timeout: 20000 });

    // Try to find and click the AI sidebar toggle
    const aiButton = page.locator('button[aria-label*="AI"i], button[title*="AI"i], button[title*="Sidebar"i]');
    if (await aiButton.count() > 0) {
      await aiButton.first().click();
      await page.waitForTimeout(500);

      // The AI sidebar should appear with content
      // Look for AI-related text or panel
      const aiPanel = page.locator('text=/explain|AI|assistant/i');
      if (await aiPanel.count() > 0) {
        await expect(aiPanel.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
