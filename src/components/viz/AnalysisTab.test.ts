import { expect, test } from 'bun:test';
import { getAnalysisRelations } from './AnalysisTab';
import type { GraphData } from '@/types';

const graph: GraphData = {
  layout: 'force',
  nodes: [
    { id: 'app', type: 'file', position: { x: 0, y: 0 }, data: { label: 'App', path: 'App.tsx', fileClass: 'entry' } },
    { id: 'dep', type: 'file', position: { x: 0, y: 0 }, data: { label: 'Dependency', path: 'dep.ts' } },
    { id: 'caller', type: 'file', position: { x: 0, y: 0 }, data: { label: 'Caller', path: 'main.ts' } },
    { id: 'root', type: 'folder', position: { x: 0, y: 0 }, data: { label: 'root', path: 'src' } },
  ],
  edges: [
    { id: '1', source: 'app', target: 'dep', type: 'imports' },
    { id: '2', source: 'app', target: 'dep', type: 'imports' },
    { id: '3', source: 'caller', target: 'app', type: 'imports' },
    { id: '4', source: 'root', target: 'app', type: 'contains' },
    { id: '5', source: 'app', target: 'missing', type: 'imports' },
    { id: '6', source: 'app', target: 'app', type: 'imports' },
  ],
};

test('duplicate edges collapse to one relation', () => {
  const { outgoing } = getAnalysisRelations(graph, 'app');
  expect(outgoing.map((e) => e.target)).toEqual(['dep']);
});

test('missing endpoints are excluded from counts', () => {
  const { outgoing, incoming } = getAnalysisRelations(graph, 'app');
  // 'missing' has no node; self-loop '6' is also excluded.
  expect(outgoing.some((e) => e.target === 'missing')).toBe(false);
  expect(outgoing).toHaveLength(1);
  expect(incoming.map((e) => e.source)).toEqual(['caller']);
});

test('file selections exclude folder containment', () => {
  const { outgoing, incoming } = getAnalysisRelations(graph, 'app');
  // root -> app is a contains edge: not a file dependency in either direction.
  expect(outgoing.every((e) => e.type !== 'contains')).toBe(true);
  expect(incoming.every((e) => e.type !== 'contains')).toBe(true);
  expect(incoming.map((e) => e.source)).toEqual(['caller']);
});

test('folder selections include containment', () => {
  const { outgoing, incoming } = getAnalysisRelations(graph, 'root');
  expect(outgoing.map((e) => e.target)).toEqual(['app']);
  expect(incoming).toEqual([]);
});

test('unknown or null selections have no relations', () => {
  expect(getAnalysisRelations(graph, 'nope')).toEqual({ outgoing: [], incoming: [] });
  expect(getAnalysisRelations(graph, null)).toEqual({ outgoing: [], incoming: [] });
});
