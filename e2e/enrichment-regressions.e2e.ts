import { test, expect } from '@playwright/test';

test('404 and privacy metadata are reset when navigating home', async ({ page }) => {
  const response = await page.goto('/missing-page');
  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await page.getByRole('link', { name: 'Go to homepage', exact: true }).click();
  await expect(page).toHaveTitle(/Git Software Dependency Map/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  await page.goto('/privacy');
  await expect(page).toHaveTitle('Privacy policy — gitSdm');
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://gsdm.site/');
});

test('prerendered homepage stays visible while its route chunk loads', async ({ page }) => {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/assets/HomePage-*.js', async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy', exact: true })).toBeVisible();
  } finally {
    release();
  }
});

test('full workspace restores both panels after mobile resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/mock/todo-app');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('button', { name: 'Full Workspace', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Collapse file explorer', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1256, height: 912 });
  await expect(page.getByRole('button', { name: 'Collapse file explorer', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Collapse repository insights',
      exact: true,
    }),
  ).toBeVisible();
});

test('missing assets return an actual 404', async ({ request }) => {
  expect((await request.get('/assets/missing.js')).status()).toBe(404);
});
