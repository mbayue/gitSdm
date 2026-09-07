import { expect, test } from 'bun:test';
import { getFileContext } from './file-context';
import type { GraphData } from '@/types';

const graph: GraphData = {
  layout: 'force',
  nodes: [
    { id: 'app', type: 'file', position: { x: 0, y: 0 }, data: { label: 'App', path: 'App.tsx', fileClass: 'entry' } },
    { id: 'dep', type: 'file', position: { x: 0, y: 0 }, data: { label: 'Dependency', path: 'dep.ts' } },
    { id: 'caller', type: 'file', position: { x: 0, y: 0 }, data: { label: 'Caller', path: 'main.ts' } },
    { id: 'root', type: 'folder', position: { x: 0, y: 0 }, data: { label: 'root' } },
  ],
  edges: [
    { id: '1', source: 'app', target: 'dep', type: 'imports' },
    { id: '2', source: 'app', target: 'dep', type: 'imports' },
    { id: '3', source: 'caller', target: 'app', type: 'imports' },
    { id: '4', source: 'root', target: 'app', type: 'contains' },
    { id: '5', source: 'app', target: 'missing', type: 'imports' },
  ],
};
test('file dependencies are deduplicated and exclude containment and missing nodes', () => {
  const context = getFileContext(graph, 'App.tsx');
  expect(context.role).toBe('Entry point');
  expect(context.dependencies.map((node) => node.id)).toEqual(['dep']);
  expect(context.dependents.map((node) => node.id)).toEqual(['caller']);
});
test('files absent from the analyzed graph have no invented relationships', () => {
  const context = getFileContext(graph, 'unparsed.bin');
  expect(context.node).toBeUndefined();
  expect(context.dependencies).toEqual([]);
  expect(context.dependents).toEqual([]);
});
