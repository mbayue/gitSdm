import { test, expect } from '@playwright/test';

test('an expired paused build cannot auto-resume against another repository', async ({ page }) => {
  const now = Date.now();
  await page.clock.install({ time: new Date(now) });
  const starts: Array<{ repo: string; branch?: string; buildId: string }> = [];
  await page.route('**/api/search/index', (route) => {
    starts.push(route.request().postDataJSON());
    return route.fulfill({ json: { state: 'complete', chunkCount: 1, timestamp: now } });
  });
  await page.route('**/api/search/status?**', (route) => {
    const repo = new URL(route.request().url()).searchParams.get('repo');
    return route.fulfill({ json: repo === 'todo-app' ? {
      state: 'paused', snapshotSha: 'repo-a-sha', buildId: 'repo-a-build', retryAt: now + 60000,
      filesProcessed: 1, totalFiles: 2, progress: 50, reason: 'EMBEDDING_RATE_LIMITED', error: 'Paused',
    } : { state: 'idle' } });
  });
  await page.goto('/mock/todo-app/search');
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toHaveCount(0);
  await page.clock.fastForward(61000);
  await page.evaluate(() => {
    window.history.pushState({}, '', '/mock/gitsdm/search');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByRole('button', { name: 'Build Index', exact: true })).toBeVisible();
  expect(starts).toHaveLength(0);
  await page.getByRole('button', { name: 'Build Index', exact: true }).click();
  await expect.poll(() => starts.length).toBe(1);
  expect(starts[0].repo).toBe('gitsdm');
  expect(starts[0].branch).not.toBe('repo-a-sha');
  expect(starts[0].buildId).not.toBe('repo-a-build');
});

test('a paused index belongs only to its repository', async ({ page }) => {
  const nextRequests: string[] = [];
  await page.route('**/api/search/status?**', (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('repo') === 'gitsdm') {
      nextRequests.push(url.search);
      return route.fulfill({ json: { state: 'idle' } });
    }
    return route.fulfill({ json: { state: 'paused', snapshotSha: 'old-repository-sha', buildId: 'old-build',
      filesProcessed: 1, totalFiles: 2, progress: 50, reason: 'EMBEDDING_RATE_LIMITED', error: 'Paused' } });
  });
  await page.goto('/mock/todo-app/search');
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.history.pushState({}, '', '/mock/gitsdm/search');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByRole('button', { name: 'Build Index', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toHaveCount(0);
  await expect.poll(() => nextRequests.length).toBeGreaterThan(0);
  expect(nextRequests.at(-1)).not.toContain('old-repository-sha');
});

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
    calls++;
    if (!started) {
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
  await expect.poll(() => calls).toBeGreaterThanOrEqual(1);
  await page.getByRole('button', { name: 'Build Index', exact: true }).click();
  await expect.poll(() => started).toBe(true);
  releaseStatus();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
  await expect(page.getByText('1 files indexed · 1 remaining')).toBeVisible({ timeout: 8000 });
  releaseIndex();
  await expect(page.getByText('Index ready', { exact: true })).toBeVisible();
});
