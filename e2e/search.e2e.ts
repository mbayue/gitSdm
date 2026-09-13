import { test, expect } from '@playwright/test';

test('index completion, scoped search, and status agree', async ({ request }) => {
  const headers = { 'X-GitHub-Token': 'offline-search-test' };
  const data = { owner: 'mock', repo: 'todo-app' };
  const indexed = await request.post('/api/search/index', { data, headers });
  expect(indexed.status()).toBe(200);
  expect(await indexed.json()).toMatchObject({ state: 'complete' });
  const status = await request.get('/api/search/status?owner=mock&repo=todo-app', { headers });
  expect(await status.json()).toMatchObject({ state: 'complete' });
  const found = await request.post('/api/search', { data: { ...data, query: 'todo state' }, headers });
  expect(found.status()).toBe(200);
  const isolated = await request.post('/api/search', {
    data: { ...data, query: 'todo state' },
    headers: { 'X-GitHub-Token': 'different-user' },
  });
  expect(isolated.status()).toBe(404);
});

test.describe('Search', () => {
  test('idle status does not poll and an existing index is restored on entry', async ({ page }) => {
    let calls = 0;
    await page.route('**/api/search/status?**', (route) => {
      calls++;
      return route.fulfill({ json: { state: 'idle' } });
    });
    await page.goto('/mock/todo-app/search');
    await expect.poll(() => calls).toBe(1);
    // Observe beyond the old three-second polling interval.
    await page.waitForTimeout(3500);
    expect(calls).toBe(1);
    await page.unroute('**/api/search/status?**');
    await page.route('**/api/search/status?**', (route) =>
      route.fulfill({
        json: { state: 'complete', chunkCount: 12, timestamp: Date.now() },
      }),
    );
    await page.reload();
    await expect(page.getByText('Index ready', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Search codebase or ask a question')).toBeEnabled();
  });
  test('build completion enables search and a missing snapshot offers rebuilding', async ({ page }) => {
    await page.goto('/mock/todo-app/search');
    const buildBtn = page.getByRole('button', { name: 'Build Index', exact: true });
    if (await buildBtn.isVisible()) {
      await buildBtn.click();
    }
    await expect(page.getByText('Index ready', { exact: true })).toBeVisible();
    await page.route('**/api/search', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Index expired. Please rebuild.', code: 'INDEX_NOT_FOUND' }),
      }),
    );
    await page.getByLabel('Search codebase or ask a question').fill('todo state');
    await page.getByRole('button', { name: 'Go', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Build Index', exact: true })).toBeVisible();
  });
  test('search page loads and has search input', async ({ page }) => {
    // Navigate to a repo's search page
    await page.goto('/mock/gitsdm/search', { timeout: 15000 });

    // Should have a search input or search-related UI
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"i], input[placeholder*="Ask"i]');
    await expect(searchInput.first()).toBeVisible({ timeout: 15000 });
  });
});
