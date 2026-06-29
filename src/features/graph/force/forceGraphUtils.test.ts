import { expect, test } from 'bun:test';
import { computeBlastRadius } from './forceGraphUtils';

test('computeBlastRadius expands folder selections before tracing dependents', () => {
  const ids = computeBlastRadius(
    'folder:server',
    [
      { source: 'file:src/app.ts', target: 'file:server/api.ts', type: 'imports' },
      { source: 'file:src/unused.ts', target: 'file:serverless.ts', type: 'imports' },
    ],
    [
      { id: 'folder:server', type: 'folder', data: { label: 'server', path: 'server' } },
      { id: 'file:server/api.ts', type: 'file', data: { label: 'api.ts', path: 'server/api.ts' } },
      { id: 'file:serverless.ts', type: 'file', data: { label: 'serverless.ts', path: 'serverless.ts' } },
      { id: 'file:src/app.ts', type: 'file', data: { label: 'app.ts', path: 'src/app.ts' } },
      { id: 'file:src/unused.ts', type: 'file', data: { label: 'unused.ts', path: 'src/unused.ts' } },
    ],
  );

  expect([...ids].sort()).toEqual(['file:server/api.ts', 'file:src/app.ts', 'folder:server']);
});