import { expect, test } from 'bun:test';
import { computeBlastRadius, getForceLinkColor, getForceNodeRadius } from './forceGraphUtils';
import type { ForceGraphLink, ForceGraphNode } from './forceGraphConstants';

test('getForceNodeRadius clamps low and high degrees', () => {
  expect(getForceNodeRadius({ degree: -1 } as ForceGraphNode)).toBe(3.8);
  expect(getForceNodeRadius({ degree: 100 } as ForceGraphNode)).toBe(13);
});

test('getForceLinkColor handles blast radius, diff, selected, and default states', () => {
  const selected = new Set(['a', 'b']);

  expect(getForceLinkColor({ source: 'a', target: 'b' } as ForceGraphLink, 'a', true, selected, null)).toBe('#22d3ee');
  expect(getForceLinkColor({ source: 'a', target: 'b' } as ForceGraphLink, 'x', true, selected, null)).toBe('#06b6d4');
  expect(getForceLinkColor({ source: 'a', target: 'c' } as ForceGraphLink, 'a', true, selected, null)).toBe('rgba(255,255,255,0.04)');

  expect(getForceLinkColor({ source: { id: 'a', diffStatus: 'deleted' }, target: 'b' } as ForceGraphLink, null, false, new Set(), 'main')).toBe('rgba(239,68,68,0.45)');
  expect(getForceLinkColor({ source: { id: 'a', diffStatus: 'added' }, target: 'b' } as ForceGraphLink, null, false, new Set(), 'main')).toBe('rgba(34,197,94,0.35)');
  expect(getForceLinkColor({ source: { id: 'a', diffStatus: 'modified' }, target: 'b' } as ForceGraphLink, null, false, new Set(), 'main')).toBe('rgba(245,158,11,0.35)');

  expect(getForceLinkColor({ source: { id: 'a', color: '#123456' }, target: 'b' } as ForceGraphLink, null, false, new Set(), null)).toBe('#123456');
  expect(getForceLinkColor({ source: { id: 'a', color: '#123456' }, target: 'b' } as ForceGraphLink, 'b', false, new Set(), null)).toBe('#123456');
  expect(getForceLinkColor({ source: 'a', target: 'b' } as ForceGraphLink, 'x', false, new Set(), null)).toBe('rgba(255,255,255,0.06)');
});

test('computeBlastRadius traces file dependents and ignores non-import edges', () => {
  const ids = computeBlastRadius(
    'file:core.ts',
    [
      { source: 'file:feature.ts', target: 'file:core.ts', type: 'imports' },
      { source: 'file:ui.ts', target: 'file:feature.ts', type: 'imports' },
      { source: 'file:test.ts', target: 'file:core.ts', type: 'tests' },
    ],
  );

  expect([...ids].sort()).toEqual(['file:core.ts', 'file:feature.ts', 'file:ui.ts']);
});

test('computeBlastRadius expands folder selections before tracing dependents', () => {
  const ids = computeBlastRadius(
    'folder:server',
    [
      { source: 'file:src/app.ts', target: 'file:server/api.ts', type: 'imports' },
      { source: 'file:src/unused.ts', target: 'file:serverless.ts', type: 'imports' },
    ],
    [
      { id: 'folder:server', type: 'folder', data: { label: 'server', path: 'server' } },
      { id: 'folder:empty', type: 'folder', data: { label: 'empty' } },
      { id: 'file:server/api.ts', type: 'file', data: { label: 'api.ts', path: 'server/api.ts' } },
      { id: 'file:serverless.ts', type: 'file', data: { label: 'serverless.ts', path: 'serverless.ts' } },
      { id: 'file:src/app.ts', type: 'file', data: { label: 'app.ts', path: 'src/app.ts' } },
      { id: 'file:src/unused.ts', type: 'file', data: { label: 'unused.ts', path: 'src/unused.ts' } },
    ],
  );

  expect([...ids].sort()).toEqual(['file:server/api.ts', 'file:src/app.ts', 'folder:server']);
});

test('computeBlastRadius keeps non-file folder without path to itself', () => {
  const ids = computeBlastRadius(
    'folder:empty',
    [{ source: 'file:src/app.ts', target: 'folder:empty', type: 'imports' }],
    [{ id: 'folder:empty', type: 'folder', data: { label: 'empty' } }],
  );

  expect([...ids]).toEqual(['folder:empty']);
});
