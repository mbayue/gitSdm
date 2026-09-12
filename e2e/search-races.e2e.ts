import { test, expect } from '@playwright/test';

test('cancel never restarts from cached paused status while refresh is delayed', async ({ page }) => {
  let cancelled = false;
  let starts = 0;
  const paused = {
    state: 'paused',
    reason: 'EMBEDDING_RATE_LIMITED',
    error: 'Paused',
    retryAt: Date.now() + 4000,
    snapshotSha: 'commit-a',
    filesProcessed: 1,
    totalFiles: 2,
    progress: 50,
  };
  await page.route('**/api/search/status?**', async (route) => {
    if (cancelled) {
      await new Promise((resolve) => setTimeout(resolve, 6000));
      await route.fulfill({ json: { state: 'idle' } });
    } else await route.fulfill({ json: paused });
  });
  await page.route('**/api/search/cancel', (route) => {
    cancelled = true;
    return route.fulfill({ json: { state: 'idle' } });
  });
  await page.route('**/api/search/index', (route) => {
    starts++;
    return route.fulfill({ json: { state: 'complete', chunkCount: 2, timestamp: Date.now() } });
  });
  await page.goto('/mock/todo-app/search');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.waitForTimeout(5000); // Observe past the old retry deadline.
  expect(starts).toBe(0);
  await expect(page.getByRole('button', { name: 'Build Index', exact: true })).toBeVisible();
});

test('a delayed idle GET cannot hide indexing or stop progress polling', async ({ page }) => {
  let releaseStatus!: () => void;
  let releaseIndex!: () => void;
  const statusGate = new Promise<void>((resolve) => {
    releaseStatus = resolve;
  });
  const indexGate = new Promise<void>((resolve) => {
    releaseIndex = resolve;
  });
  let calls = 0;
  let started = false;
  let complete = false;
  const progress = { state: 'indexing', progress: 50, filesProcessed: 1, totalFiles: 2, snapshotSha: 'commit-a' };
  const done = { state: 'complete', chunkCount: 2, timestamp: Date.now() };
  await page.route('**/api/search/status?**', async (route) => {
    if (++calls === 1) {
      await statusGate;
      await route.fulfill({ json: { state: 'idle' } });
    } else await route.fulfill({ json: complete ? done : progress });
  });
  await page.route('**/api/search/index', async (route) => {
    started = true;
    await indexGate;
    complete = true;
    await route.fulfill({ json: done });
  });
  await page.goto('/mock/todo-app/search');
  await expect.poll(() => calls).toBe(1);
  await page.getByRole('button', { name: 'Build Index', exact: true }).click();
  await expect.poll(() => started).toBe(true);
  releaseStatus();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
  await expect(page.getByText('1 files indexed · 1 remaining')).toBeVisible({ timeout: 8000 });
  releaseIndex();
  await expect(page.getByText('Index ready', { exact: true })).toBeVisible();
});
