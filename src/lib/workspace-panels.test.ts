import { expect, test } from 'bun:test';
import { fitWorkspacePanels } from './workspace-panels';

test('oversized desktop sidebars leave at least 360 pixels for the canvas', () => {
  for (const viewport of [1024, 1100, 1256, 1440]) {
    const panels = fitWorkspacePanels(viewport, 450, 700);
    expect(viewport - panels.left - panels.right).toBeGreaterThanOrEqual(360);
    expect(panels.left).toBeGreaterThanOrEqual(180);
    expect(panels.right).toBeGreaterThanOrEqual(300);
  }
});

test('closed panels use no space and preferences return when room is available', () => {
  expect(fitWorkspacePanels(1256, 0, 360)).toEqual({ left: 0, right: 360 });
  expect(fitWorkspacePanels(1920, 450, 700)).toEqual({ left: 450, right: 700 });
});
