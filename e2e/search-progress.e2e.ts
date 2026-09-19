import { test, expect } from '@playwright/test';

test('Search, Ask and a rejected Resume retain the paused commit', async ({ page }) => {
  const coverage = { kind: 'partial', commitSha: 'commit-a', indexedFiles: 32, totalFiles: 40 };
  const paused = {
    state: 'paused',
    reason: 'EMBEDDING_RATE_LIMITED',
    error: 'Paused',
    filesProcessed: 32,
    totalFiles: 40,
    progress: 80,
    snapshotSha: 'commit-a',
    coverage,
  };
  const submitted: string[] = [];
  await page.route('**/api/search/status?**', (route) => route.fulfill({ json: paused }));
  await page.route('**/api/search', (route) => {
    submitted.push(route.request().postDataJSON().branch);
    return route.fulfill({ json: { results: [], cached: false, query: 'test query', coverage } });
  });
  await page.route('**/api/search/ask', (route) => {
    submitted.push(route.request().postDataJSON().branch);
    return route.fulfill({
      json: { answer: 'Only indexed files are covered.', citations: [], cached: false, coverage },
    });
  });
  await page.route('**/api/search/index', (route) => {
    submitted.push(route.request().postDataJSON().branch);
    return route.fulfill({
      status: 429,
      json: { error: 'Admission limit', code: 'USAGE_LIMIT_EXCEEDED', context: { retryAfterSeconds: 60 } },
    });
  });
  await page.goto('/mock/todo-app/search');
  await expect(page.getByText('32 files indexed · 8 remaining')).toBeVisible();
  await page.getByLabel('Search codebase or ask a question').fill('test query');
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await expect.poll(() => submitted.length).toBe(1);
  await page.getByRole('tab', { name: 'Ask', exact: true }).click();
  await expect.poll(() => submitted.length).toBe(2);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByText('Admission limit', { exact: true })).toBeVisible();
  await expect(page.getByText('32 files indexed · 8 remaining')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeDisabled();
  await expect(page.getByLabel('Search codebase or ask a question')).toBeEnabled();
  expect(submitted).toEqual(['commit-a', 'commit-a', 'commit-a']);
});

test('partial coverage, cooldown, empty results and cancel are visible', async ({ page }) => {
  let cancelled = false;
  const coverage = { kind: 'partial', commitSha: 'snapshot', indexedFiles: 32, totalFiles: 40 };
  const paused = {
    state: 'paused',
    reason: 'EMBEDDING_RATE_LIMITED',
    error: 'Provider rate limit',
    retryAt: Date.now() + 60000,
    filesProcessed: 32,
    totalFiles: 40,
    progress: 80,
    coverage,
    snapshotSha: 'snapshot',
  };
  await page.route('**/api/search/status?**', (route) => route.fulfill({ json: paused }));
  await page.route('**/api/search', (route) =>
    route.fulfill({ json: { results: [], query: 'test query', cached: false, coverage } }),
  );
  await page.route('**/api/search/cancel', (route) => {
    cancelled = true;
    expect(route.request().postDataJSON().branch).toBe('snapshot');
    return route.fulfill({ json: { state: 'idle' } });
  });
  await page.goto('/mock/todo-app/search');
  await expect(page.getByText('32 files indexed · 8 remaining')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeDisabled();
  const input = page.getByLabel('Search codebase or ask a question');
  await expect(input).toBeEnabled();
  await input.fill('test query');
  await page.getByRole('button', { name: 'Go', exact: true }).click();
  await expect(page.getByText('No matches in indexed files yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(cancelled).toBe(true);
});

test('cooldown resumes the same snapshot and completes', async ({ page }) => {
  let resumed = false;
  const status = {
    state: 'paused',
    reason: 'USAGE_LIMIT_EXCEEDED',
    error: 'Daily budget reached',
    retryAt: Date.now() + 2000,
    filesProcessed: 0,
    totalFiles: 40,
    progress: 0,
    snapshotSha: 'pinned-sha',
  };
  await page.route('**/api/search/status?**', (route) =>
    route.fulfill({ json: resumed ? { state: 'complete', chunkCount: 40, timestamp: Date.now() } : status }),
  );
  await page.route('**/api/search/index', (route) => {
    resumed = true;
    expect(route.request().postDataJSON().branch).toBe('pinned-sha');
    return route.fulfill({ json: { state: 'complete', chunkCount: 40, timestamp: Date.now() } });
  });
  await page.goto('/mock/todo-app/search');
  await expect(page.getByText('Index ready', { exact: true })).toBeVisible();
  expect(resumed).toBe(true);
});
