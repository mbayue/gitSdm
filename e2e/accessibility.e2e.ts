import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility audit', () => {
  test('homepage should not have any critical or serious violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input[placeholder*="github.com"]', { timeout: 15000 });

    const results = await new AxeBuilder({ page }).analyze();

    // Filter out minor and moderate — only fail on critical/serious
    const serious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(serious).toEqual([]);
  });

  test('repo analyze page should not have critical or serious violations', async ({ page }) => {
    await page.goto('/viz?url=https://github.com/mbayue/gitSdm');
    // Wait enough time for the viz page to render its core layout
    await page.waitForSelector('nav, header, [role="navigation"]', { timeout: 20000 });

    const results = await new AxeBuilder({ page }).analyze();

    const serious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(serious).toEqual([]);
  });
});
