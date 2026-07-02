import { describe, it, expect } from 'bun:test';
import { buildGraph } from './graph-builder';

describe('buildGraph', () => {
  it('creates repo node and edges', () => {
    const graph = buildGraph({
      owner: 'test',
      repo: 'app',
      tree: [
        {
          path: 'src',
          name: 'src',
          type: 'dir',
          children: [
            { path: 'src/index.ts', name: 'index.ts', type: 'file', fileClass: 'entry' },
          ],
        },
      ],
      dependencies: [{ name: 'react', version: '^19', type: 'prod', ecosystem: 'npm' }],
      contributors: [{ login: 'dev', avatarUrl: '', contributions: 10 }],
    });

    expect(graph.nodes.some((n) => n.type === 'repo')).toBe(true);
    expect(graph.nodes.some((n) => n.type === 'folder' && n.data.label.includes('(1)'))).toBe(true);
    expect(graph.nodes.some((n) => n.type === 'package')).toBe(false);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.layout).toBe('force');
  });

  it('handles empty trees gracefully without crashing', () => {
    const graph = buildGraph({
      owner: 'test',
      repo: 'app',
      tree: [],
      dependencies: [],
      contributors: [],
    });
    expect(graph.nodes.length).toBe(1); // repo node still constructed
    expect(graph.nodes[0].type).toBe('repo');
  });

  it('builds import edges when fileContents are provided', () => {
    const graph = buildGraph({
      owner: 'test',
      repo: 'app',
      tree: [
        {
          path: 'src',
          name: 'src',
          type: 'dir',
          children: [
            { path: 'src/index.ts', name: 'index.ts', type: 'file', fileClass: 'source' },
            { path: 'src/utils.ts', name: 'utils.ts', type: 'file', fileClass: 'source' },
          ],
        },
      ],
      dependencies: [],
      contributors: [],
      fileContents: {
        'src/index.ts': "import { helper } from './utils';\nconsole.log(helper());",
        'src/utils.ts': 'export function helper() { return 42; }',
      },
    });

    const importEdges = graph.edges.filter((e) => e.type === 'imports');
    expect(importEdges.length).toBeGreaterThan(0);
    expect(importEdges.some((e) => e.source === 'file:src/index.ts' && e.target === 'file:src/utils.ts')).toBe(true);
  });

  it('creates package nodes, file ownership edges, and workspace dependency edges', () => {
    const graph = buildGraph({
      owner: 'test',
      repo: 'app',
      tree: [
        {
          path: 'packages',
          name: 'packages',
          type: 'dir',
          children: [
            {
              path: 'packages/a',
              name: 'a',
              type: 'dir',
              children: [{ path: 'packages/a/src/index.ts', name: 'index.ts', type: 'file' }],
            },
            {
              path: 'packages/b',
              name: 'b',
              type: 'dir',
              children: [{ path: 'packages/b/src/index.ts', name: 'index.ts', type: 'file' }],
            },
          ],
        },
      ],
      dependencies: [],
      contributors: [],
      workspacePackages: [
        { ecosystem: 'javascript', manager: 'pnpm', rootPath: 'packages/a', manifestPath: 'packages/a/package.json', name: '@repo/a' },
        { ecosystem: 'javascript', manager: 'pnpm', rootPath: 'packages/b', manifestPath: 'packages/b/package.json', name: '@repo/b' },
      ],
      scopedDependencies: [
        { ecosystem: 'npm', type: 'prod', name: '@repo/b', version: 'workspace:*', manifestPath: 'packages/a/package.json', packageName: '@repo/a' },
      ],
    });

    expect(graph.nodes.some((node) => node.id === 'package:packages/a' && node.data.label === '@repo/a')).toBe(true);
    expect(graph.nodes.some((node) => node.id === 'package:packages/b' && node.data.label === '@repo/b')).toBe(true);
    expect(graph.edges.some((edge) => edge.source === 'package:packages/a' && edge.target === 'file:packages/a/src/index.ts' && edge.type === 'contains')).toBe(true);
    expect(graph.edges.some((edge) => edge.source === 'package:packages/a' && edge.target === 'package:packages/b' && edge.type === 'depends_on')).toBe(true);
  });

  it('traverses hidden folders after folder cap and preserves package edges', () => {
    const graph = buildGraph({
      owner: 'test',
      repo: 'app',
      tree: [
        {
          path: 'packages',
          name: 'packages',
          type: 'dir',
          children: [
            {
              path: 'packages/a',
              name: 'a',
              type: 'dir',
              children: [
                { path: 'packages/a/src/index.ts', name: 'index.ts', type: 'file' },
              ],
            },
            {
              path: 'packages/b',
              name: 'b',
              type: 'dir',
              children: [
                { path: 'packages/b/src/index.ts', name: 'index.ts', type: 'file' },
              ],
            },
          ],
        },
      ],
      dependencies: [],
      contributors: [],
      limits: { maxFolders: 1, maxFiles: 10 },
      workspacePackages: [
        { ecosystem: 'javascript', manager: 'pnpm', rootPath: 'packages/a', manifestPath: 'packages/a/package.json', name: '@repo/a' },
        { ecosystem: 'javascript', manager: 'pnpm', rootPath: 'packages/b', manifestPath: 'packages/b/package.json', name: '@repo/b' },
      ],
      scopedDependencies: [
        { ecosystem: 'npm', type: 'prod', name: '@repo/b', version: 'workspace:*', manifestPath: 'packages/a/package.json', packageName: '@repo/a' },
      ],
    });

    const nodeIds = new Set(graph.nodes.map((node) => node.id));

    expect(nodeIds.has('folder:packages')).toBe(true);
    expect(nodeIds.has('folder:packages/a')).toBe(false);
    expect(nodeIds.has('folder:packages/b')).toBe(false);
    expect(nodeIds.has('file:packages/a/src/index.ts')).toBe(true);
    expect(nodeIds.has('file:packages/b/src/index.ts')).toBe(true);
    expect(graph.edges.every((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))).toBe(true);
    expect(graph.edges.some((edge) => edge.source === 'folder:packages' && edge.target === 'file:packages/a/src/index.ts' && edge.type === 'contains')).toBe(true);
    expect(graph.edges.some((edge) => edge.source === 'folder:packages' && edge.target === 'file:packages/b/src/index.ts' && edge.type === 'contains')).toBe(true);
    expect(graph.edges.some((edge) => edge.source === 'package:packages/a' && edge.target === 'file:packages/a/src/index.ts' && edge.type === 'contains')).toBe(true);
    expect(graph.edges.some((edge) => edge.source === 'package:packages/a' && edge.target === 'package:packages/b' && edge.type === 'depends_on')).toBe(true);
  });

  it('does not create external dependency package nodes or bogus shared external edges', () => {
    const graph = buildGraph({
      owner: 'test',
      repo: 'app',
      tree: [
        { path: 'packages/a/src/index.ts', name: 'index.ts', type: 'file' },
        { path: 'packages/b/src/index.ts', name: 'index.ts', type: 'file' },
      ],
      dependencies: [{ name: 'react', version: '^19', type: 'prod', ecosystem: 'npm' }],
      contributors: [],
      workspacePackages: [
        { ecosystem: 'javascript', manager: 'pnpm', rootPath: 'packages/a', manifestPath: 'packages/a/package.json', name: '@repo/a' },
        { ecosystem: 'javascript', manager: 'pnpm', rootPath: 'packages/b', manifestPath: 'packages/b/package.json', name: '@repo/b' },
      ],
      scopedDependencies: [
        { ecosystem: 'npm', type: 'prod', name: 'react', version: '^19', manifestPath: 'packages/a/package.json', packageName: '@repo/a' },
        { ecosystem: 'npm', type: 'prod', name: 'react', version: '^19', manifestPath: 'packages/b/package.json', packageName: '@repo/b' },
      ],
    });

    expect(graph.nodes.some((node) => node.id === 'package:react')).toBe(false);
    expect(graph.edges.some((edge) => edge.source === 'package:packages/a' && edge.target === 'package:packages/b' && edge.type === 'depends_on')).toBe(false);
    expect(graph.edges.some((edge) => edge.source === 'package:packages/b' && edge.target === 'package:packages/a' && edge.type === 'depends_on')).toBe(false);
  });

  it('handles packageLabel fallbacks when name is missing', () => {
    const graph = buildGraph({
      owner: 'test',
      repo: 'app',
      tree: [],
      dependencies: [],
      contributors: [],
      workspacePackages: [
        { ecosystem: 'javascript', manager: 'pnpm', rootPath: '', manifestPath: 'package.json' },
        { ecosystem: 'javascript', manager: 'pnpm', rootPath: 'packages/c', manifestPath: 'packages/c/package.json' },
      ],
    });

    const rootNode = graph.nodes.find((n) => n.id === 'package:.');
    expect(rootNode?.data.label).toBe('app'); // Fallback to repo name

    const cNode = graph.nodes.find((n) => n.id === 'package:packages/c');
    expect(cNode?.data.label).toBe('c'); // Fallback to last segment of rootPath
  });

  it('respects maxFiles limit and skips files', () => {
    const graph = buildGraph({
      owner: 'test',
      repo: 'app',
      tree: [
        { path: 'src/index.ts', name: 'index.ts', type: 'file' },
        { path: 'src/utils.ts', name: 'utils.ts', type: 'file' },
      ],
      dependencies: [],
      contributors: [],
      limits: { maxFiles: 1 },
    });

    const fileNodes = graph.nodes.filter((n) => n.type === 'file');
    expect(fileNodes.length).toBe(1);
  });
});
