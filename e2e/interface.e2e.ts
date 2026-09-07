import { test, expect } from '@playwright/test';

test('settings closes with Escape and restores its accessible trigger', async ({ page }) => {
  await page.setViewportSize({ width: 1256, height: 912 });
  await page.goto('/mock/todo-app');
  const trigger = page.getByRole('button', { name: 'Settings and credentials', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Settings and credentials' });
  const key = dialog.getByLabel('Google AI key', { exact: true });
  await expect(key).toBeFocused();
  await key.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('learning Explain responds to Enter and synchronizes the inspected file', async ({ page }) => {
  await page.setViewportSize({ width: 1256, height: 912 });
  await page.goto('/mock/todo-app');
  await page.getByRole('tab', { name: 'Learning', exact: true }).click();
  const step = page.getByRole('group', { name: 'Learning step 2: src/App.tsx', exact: true });
  await step.getByRole('button', { name: 'EXPLAIN', exact: true }).press('Enter');
  await expect(page.getByRole('tab', { name: 'AI tools', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('region', { name: 'File inspector' })).toContainText('src/App.tsx');
});

test('workspace modes hide both sidebars in focus and open learning on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1256, height: 912 });
  await page.goto('/mock/todo-app');
  await page.getByRole('button', { name: 'Full Workspace', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Focus Mode Minimizes sidebars to focus purely on the canvas', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open file explorer', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open repository insights', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('button', { name: 'Learning Mode', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Learning', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Learning', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('layout changes fit the graph after focusing a file', async ({ page }) => {
  await page.setViewportSize({ width: 1256, height: 912 });
  await page.goto('/mock/todo-app');
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });
  const status = page.getByRole('contentinfo');
  for (const layout of ['Horizontal tree', 'Vertical tree', 'Force layout']) {
    await page.getByRole('button', { name: 'App.tsx', exact: true }).click();
    await page.getByRole('button', { name: 'Focus selection', exact: true }).click();
    await expect(status).toContainText('320%');
    await page.getByRole('button', { name: 'Layout', exact: true }).click();
    await page.getByRole('button', { name: layout, exact: true }).click();
    await expect(status).not.toContainText('320%', { timeout: 10000 });
    await page.getByRole('button', { name: 'Layout', exact: true }).click();
    await expect(page.getByRole('button', { name: layout, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Layout', exact: true }).press('Escape');
  }
});

test('graph exports download both formats without changing the camera or canvas size', async ({ page }) => {
  await page.goto('/mock/todo-app');
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'App.tsx', exact: true }).click();
  const status = page.getByRole('contentinfo');
  await expect(status).toContainText('320%');
  const bounds = await canvas.boundingBox();
  for (const [label, extension] of [['PNG Image', 'png'], ['PDF Document', 'pdf']]) {
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: label, exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`mock_todo-app_graph.${extension}`);
    expect(await download.failure()).toBeNull();
    await expect(status).toContainText('320%');
    expect(await canvas.boundingBox()).toEqual(bounds);
  }
});

test('architecture finishes rendering and survives zoom and reset', async ({ page }) => {
  await page.goto('/mock/todo-app');
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Architecture', exact: true }).click();
  const diagram = page.getByRole('img', { name: 'Repository architecture diagram' }).locator('svg');
  await expect(diagram).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Preparing the diagram…', { exact: true })).toHaveCount(0);
  const renderedId = await diagram.getAttribute('id');
  await page.getByRole('button', { name: 'Zoom In', exact: true }).click();
  await expect(page.getByText('110%', { exact: true })).toBeVisible();
  await expect(diagram).toHaveAttribute('id', renderedId!);
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await expect(diagram).toHaveAttribute('id', renderedId!);
});

test('sample graph follows light and dark theme changes', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('#workspace-preview canvas').first();
  await expect(canvas).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light theme', exact: true }).click();
  await expect(canvas).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
  await expect(canvas).toHaveCSS('background-color', 'rgb(30, 30, 30)');
});

test('repository input reports invalid URLs accessibly', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('GitHub repository', { exact: true }).fill('invalid');
  await page.getByRole('button', { name: 'Analyze repository', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Enter a valid GitHub URL');
  await expect(page.getByLabel('GitHub repository', { exact: true })).toHaveAttribute('aria-invalid', 'true');
});

test.describe('Mobile workspace', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('new repositories keep the graph visible and drawers mutually exclusive', async ({ page }) => {
    await page.goto('/mock/todo-app');
    const explorer = page.getByRole('button', { name: 'Collapse file explorer', exact: true });
    const ai = page.getByRole('button', { name: 'Collapse repository insights', exact: true });
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });
    await expect(explorer).toBeHidden();
    await expect(ai).toBeHidden();
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.getByRole('button', { name: 'Open Explorer', exact: true }).click();
    await expect(explorer).toBeVisible();
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.getByRole('button', { name: 'Open AI Sidebar', exact: true }).click();
    await expect(ai).toBeVisible();
    await expect(explorer).toBeHidden();
  });

  test('view navigation and search remain reachable', async ({ page }) => {
    await page.goto('/mock/todo-app');
    const views = page.getByRole('navigation', { name: 'Repository views' });
    const commits = views.getByRole('button', { name: 'Commits', exact: true });
    await commits.click();
    await expect(commits).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: 'Search repository', exact: true }).click();
    await expect(page).toHaveURL(/\/mock\/todo-app\/search$/);
    await expect(page.getByRole('heading', { name: 'Find the idea behind the code.' })).toBeVisible();
  });
});

test('insights stay within their panel and file selection survives graph filters', async ({ page }) => {
  await page.setViewportSize({ width: 1256, height: 912 });
  await page.goto('/mock/todo-app');
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Filter', exact: true }).click();
  await page.getByRole('button', { name: 'Grouped', exact: true }).click();
  await page.getByRole('button', { name: 'Filter', exact: true }).press('Escape');
  await page.getByRole('button', { name: 'App.tsx', exact: true }).click();
  const details = page.getByRole('tabpanel', { name: 'Details', exact: true });
  await expect(details.getByRole('heading', { name: 'App.tsx', exact: true })).toBeVisible();
  await expect(page.getByText('The selected file is hidden by these filters.', { exact: false })).toBeVisible();
  const panel = await page.getByRole('complementary').boundingBox();
  const content = await details.boundingBox();
  expect(panel).not.toBeNull();
  expect(content).not.toBeNull();
  expect(content!.x).toBeGreaterThanOrEqual(panel!.x);
  expect(content!.x + content!.width).toBeLessThanOrEqual(panel!.x + panel!.width);
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(page.getByText('The selected file is hidden by these filters.', { exact: false })).toHaveCount(0);
});

test('panel resizing preserves the graph and inspector context follows related files', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/mock/todo-app');
  const handle = page.getByRole('separator', { name: 'Resize file explorer', exact: true });
  await expect(handle).toBeVisible({ timeout: 20000 });
  for (let i = 0; i < 20; i++) await handle.press('ArrowRight');
  expect((await page.locator('.graph-canvas-host').first().boundingBox())!.width).toBeGreaterThanOrEqual(360);
  await page.getByRole('button', { name: 'App.tsx', exact: true }).click();
  const inspector = page.getByRole('region', { name: 'File inspector' });
  await inspector.locator('summary').click();
  await inspector.getByRole('button', { name: 'src/context/TodoContext.tsx', exact: true }).click();
  await expect(inspector).toContainText('src/context/TodoContext.tsx');
  await expect(page.getByRole('tabpanel', { name: 'Details' }).getByRole('heading', { name: 'TodoContext.tsx', exact: true })).toBeVisible();
});
