import { test, expect } from '@playwright/test';

test('mounted buttons respond to motion changes without a reload', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gitsdm-motion', JSON.stringify({ state: { preference: 'system' }, version: 0 }));
  });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/api/repo/analyze**', (route) => route.fulfill({
    status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Analysis failed', code: 'VALIDATION_ERROR' }),
  }));
  await page.goto('/mock/todo-app');
  const button = page.getByRole('button', { name: 'Back to Home', exact: true });
  await expect(button).toBeVisible();
  await button.hover();
  const scale = () => button.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a);
  await expect.poll(scale).toBeGreaterThan(1.01);
  const original = await button.elementHandle();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(scale).toBe(1);
  expect(await original?.evaluate((element) => element.isConnected)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.mouse.move(0, 0);
  await button.hover();
  await expect.poll(scale).toBeGreaterThan(1.01);
});

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`workspace settles and controls work with motion ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(() => {
      localStorage.setItem('gitsdm-motion', JSON.stringify({ state: { preference: 'system' }, version: 0 }));
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Understand the whole codebase.' })).toBeVisible();
    await page.goto('/mock/todo-app');
    const graph = page.locator('.graph-canvas-host').last();
    await expect(graph.locator('canvas').first()).toBeVisible({ timeout: 15000 });
    await expect(graph).not.toHaveAttribute('data-reduced-settling', '', { timeout: 15000 });
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    for (const layout of ['Horizontal tree', 'Force layout']) {
      await page.getByRole('button', { name: 'Layout', exact: true }).click();
      await page.getByRole('button', { name: layout, exact: true }).click();
      await expect(graph).not.toHaveAttribute('data-reduced-settling', '', { timeout: 15000 });
      await expect(graph.locator('canvas').first()).toBeVisible();
    }
    await page.emulateMedia({ reducedMotion: reducedMotion === 'reduce' ? 'no-preference' : 'reduce' });
    await expect(graph.locator('canvas').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('app motion choice overrides the system setting and persists on reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/mock/todo-app');
  await page.getByRole('button', { name: 'Settings and credentials', exact: true }).click();
  await page.getByRole('group', { name: 'Motion', exact: true }).getByRole('button', { name: 'Reduced', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await page.getByRole('button', { name: 'Settings and credentials', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Motion', exact: true }).getByRole('button', { name: 'Reduced', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('group', { name: 'Motion', exact: true }).getByRole('button', { name: 'Full', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'false');
  await page.getByRole('group', { name: 'Motion', exact: true }).getByRole('button', { name: 'System', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
});
