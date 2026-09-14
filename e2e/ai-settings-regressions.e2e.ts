import { test, expect } from '@playwright/test';

test('health completion is delivered after leaving and returning to the panel', async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => { release = resolve; });
  let calls = 0;
  await page.route('**/api/ai/health', async (route) => {
    calls++;
    await held;
    await route.fulfill({ json: {
      scores: { maintainability: 80, modularity: 80, readability: 80, architecture: 80, complexity: 80 },
      summary: 'Completed after remount', cached: false,
    } });
  });
  await page.route('**/api/ai/explain', (route) => route.fulfill({ json: { explanation: 'Example' } }));
  await page.goto('/mock/todo-app');
  await page.getByRole('tab', { name: 'AI tools', exact: true }).click();
  await page.getByRole('button', { name: /Health Audit/ }).click();
  await expect.poll(() => calls).toBe(1);
  await page.getByRole('tab', { name: 'Overview', exact: true }).click();
  await page.getByRole('tab', { name: 'AI tools', exact: true }).click();
  release();
  await expect(page.getByText('Completed after remount', { exact: true })).toBeVisible();
  expect(calls).toBe(1);
});

test('saving chat settings refreshes the active AI architecture diagram', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/ai/mermaid', (route) => {
    calls++;
    return route.fulfill({ json: { diagram: `graph TD; A[Model${calls}] --> B[Done]`, cached: false } });
  });
  await page.goto('/mock/todo-app');
  await page.getByRole('button', { name: 'Architecture', exact: true }).click();
  await page.getByRole('button', { name: 'AI Enhanced', exact: true }).click();
  await expect(page.getByText('Model1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Settings and credentials', exact: true }).click();
  await page.getByRole('textbox', { name: 'AI API key', exact: true }).fill('test-key');
  await page.getByRole('textbox', { name: 'Chat model', exact: true }).fill('new-model');
  await page.getByRole('button', { name: 'Save AI API key', exact: true }).click();
  await expect(page.getByText('Model2', { exact: true })).toBeVisible();
  await expect(page.getByText('Model1', { exact: true })).toHaveCount(0);
  expect(calls).toBe(2);
});

test('an older explanation cannot hide the current failure', async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => { release = resolve; });
  let started = false;
  await page.route('**/api/ai/explain', async (route) => {
    started = true;
    await held;
    await route.fulfill({ json: { explanation: 'Old explanation' } });
  });
  await page.route('**/api/ai/explain-lif', (route) => route.fulfill({ status: 500, json: { error: 'Failed' } }));
  await page.goto('/mock/todo-app');
  await page.getByRole('tab', { name: 'AI tools', exact: true }).click();
  await expect.poll(() => started).toBe(true);
  await page.getByRole('button', { name: 'ELI5 MODE', exact: true }).click();
  await expect(page.getByText('AI explanation failed. Please try again.', { exact: true })).toBeVisible();
  const response = page.waitForResponse('**/api/ai/explain');
  release();
  await response;
  await expect(page.getByRole('button', { name: 'Retry Request', exact: true })).toBeVisible();
  await expect(page.getByText('Old explanation', { exact: true })).toHaveCount(0);
});

test('saving changed chat settings refreshes cached explanations', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/ai/explain', (route) => {
    calls++;
    return route.fulfill({ json: { explanation: `Answer ${calls}` } });
  });
  await page.goto('/mock/todo-app');
  await page.getByRole('tab', { name: 'AI tools', exact: true }).click();
  await expect(page.getByText('Answer 1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Settings and credentials', exact: true }).click();
  await page.getByRole('textbox', { name: 'AI API key', exact: true }).fill('test-key');
  await page.getByRole('textbox', { name: 'Chat model', exact: true }).fill('test-model');
  await page.getByRole('button', { name: 'Save AI API key', exact: true }).click();
  await expect(page.getByText('Answer 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close settings', exact: true }).click();
  await page.getByRole('tab', { name: 'Overview', exact: true }).click();
  await page.getByRole('tab', { name: 'AI tools', exact: true }).click();
  await expect(page.getByText('Answer 2', { exact: true })).toBeVisible();
  expect(calls).toBe(2);
});
