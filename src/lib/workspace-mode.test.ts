import { expect, test } from 'bun:test';
import { modeFromPanels, panelsForMode } from './workspace-mode';
test('full workspace has a useful mobile panel and restores both desktop panels', () => {
  expect(panelsForMode('full', true)).toEqual({
    explorerOpen: true,
    aiSidebarOpen: false,
  });
  expect(panelsForMode('full', false)).toEqual({
    explorerOpen: true,
    aiSidebarOpen: true,
  });
});
test('legacy modes migrate according to actual saved panel visibility', () => {
  expect(modeFromPanels(false, true)).toBe('insights');
  expect(modeFromPanels(true, false)).toBe('explorer');
  expect(modeFromPanels(true, true)).toBe('full');
  expect(modeFromPanels(false, false)).toBe('focus');
});
