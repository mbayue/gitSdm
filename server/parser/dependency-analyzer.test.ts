import { describe, it, expect } from 'bun:test';
import {
  analyzeDependencies,
  analyzeManifestDependencies,
  analyzeWorkspacePackages,
  findWorkspacePackageForPath,
} from './dependency-analyzer';

describe('dependency-analyzer', () => {
  it('combines dependencies from multiple files', () => {
    const fileContents = {
      'package.json': JSON.stringify({
        dependencies: { lodash: '^4.17.21' },
      }),
      'go.mod': 'module main\nrequire github.com/gin-gonic/gin v1.9.1',
    };

    const deps = analyzeDependencies(fileContents);
    expect(deps).toHaveLength(2);
    expect(deps.find((d) => d.name === 'lodash')?.ecosystem).toBe('npm');
    expect(deps.find((d) => d.name === 'github.com/gin-gonic/gin')?.ecosystem).toBe('go');
  });

  it('deduplicates identical dependencies', () => {
    const fileContents = {
      'package.json': JSON.stringify({
        dependencies: { lodash: '^4.17.21' },
      }),
      'subproject/package.json': JSON.stringify({
        dependencies: { lodash: '^4.17.21' },
      }),
    };

    const deps = analyzeDependencies(fileContents);
    expect(deps).toHaveLength(1);
  });

  it('keeps scoped dependencies for same package across manifests', () => {
    // Given: two workspace package manifests share same dependency name
    const fileContents = {
      'packages/app/package.json': JSON.stringify({
        name: '@repo/app',
        dependencies: { lodash: '^4.17.21' },
      }),
      'packages/admin/package.json': JSON.stringify({
        name: '@repo/admin',
        dependencies: { lodash: '^4.17.21' },
      }),
    };

    // When: manifest-scoped dependencies are analyzed
    const deps = analyzeManifestDependencies(fileContents);

    // Then: each package keeps its own dependency edge source scope
    expect(deps).toContainEqual({
      name: 'lodash',
      version: '^4.17.21',
      type: 'prod',
      ecosystem: 'npm',
      manifestPath: 'packages/app/package.json',
      packageName: '@repo/app',
    });
    expect(deps).toContainEqual({
      name: 'lodash',
      version: '^4.17.21',
      type: 'prod',
      ecosystem: 'npm',
      manifestPath: 'packages/admin/package.json',
      packageName: '@repo/admin',
    });
  });

  it('detects root and package workspace records from package.json globs', () => {
    // Given: npm workspace with root plus two matching package manifests
    const fileContents = {
      'package.json': JSON.stringify({ name: '@repo/root', workspaces: ['packages/*'] }),
      'packages/a/package.json': JSON.stringify({ name: '@repo/a' }),
      'packages/b/package.json': JSON.stringify({ name: '@repo/b' }),
    };

    // When: workspace package records are analyzed
    const packages = analyzeWorkspacePackages(fileContents);

    // Then: root package and matched workspace packages are retained
    expect(packages).toEqual([
      { ecosystem: 'javascript', manager: 'npm', rootPath: '', manifestPath: 'package.json', name: '@repo/root' },
      { ecosystem: 'javascript', manager: 'npm', rootPath: 'packages/a', manifestPath: 'packages/a/package.json', name: '@repo/a' },
      { ecosystem: 'javascript', manager: 'npm', rootPath: 'packages/b', manifestPath: 'packages/b/package.json', name: '@repo/b' },
    ]);
  });

  it('detects pnpm workspace package records from pnpm-workspace.yaml', () => {
    // Given: pnpm workspace with app and package globs
    const fileContents = {
      'package.json': JSON.stringify({ name: 'root' }),
      'pnpm-workspace.yaml': 'packages:\n  - "apps/*"\n  - packages/*\n',
      'apps/web/package.json': JSON.stringify({ name: 'web' }),
      'packages/core/package.json': JSON.stringify({ name: 'core' }),
    };

    // When: workspace package records are analyzed
    const packages = analyzeWorkspacePackages(fileContents);

    // Then: pnpm owns all matching workspace package manifests
    expect(packages.map((pkg) => [pkg.manager, pkg.rootPath, pkg.name])).toEqual([
      ['pnpm', '', 'root'],
      ['pnpm', 'apps/web', 'web'],
      ['pnpm', 'packages/core', 'core'],
    ]);
  });

  it('keeps root package only when workspace globs match no package manifests', () => {
    // Given: workspace globs point at missing packages
    const fileContents = {
      'package.json': JSON.stringify({ name: 'root', workspaces: ['missing/*'] }),
      'packages/a/package.json': JSON.stringify({ name: 'a' }),
    };

    // When: workspace package records are analyzed
    const packages = analyzeWorkspacePackages(fileContents);

    // Then: unmatched package manifests are ignored without crashing
    expect(packages).toEqual([
      { ecosystem: 'javascript', manager: 'npm', rootPath: '', manifestPath: 'package.json', name: 'root' },
    ]);
  });

  it('does not emit workspace packages for plain package.json projects', () => {
    // Given: repository has package.json but no workspace declaration
    const fileContents = {
      'package.json': JSON.stringify({ name: 'plain-app', dependencies: { react: '^19' } }),
    };

    // When: workspace package records are analyzed
    const packages = analyzeWorkspacePackages(fileContents);

    // Then: legacy non-workspace repositories keep no package grouping data
    expect(packages).toEqual([]);
  });

  it('handles malformed workspace manifests without throwing', () => {
    // Given: invalid root package workspace and pnpm workspace inputs
    const fileContents = {
      'package.json': '{"workspaces": [',
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n    bad-indent',
    };

    // When: workspace package records are analyzed
    const packages = analyzeWorkspacePackages(fileContents);

    // Then: malformed workspace metadata is ignored like a non-workspace project
    expect(packages).toEqual([]);
  });

  it('chooses deepest workspace package root for path ownership', () => {
    // Given: nested workspace packages matched by globstar
    const packages = analyzeWorkspacePackages({
      'package.json': JSON.stringify({ name: 'root', workspaces: ['packages/**'] }),
      'packages/a/package.json': JSON.stringify({ name: 'a' }),
      'packages/a/nested/package.json': JSON.stringify({ name: 'nested' }),
    });

    // When: ownership is resolved for a nested source file
    const owner = findWorkspacePackageForPath('packages/a/nested/src/index.ts', packages);

    // Then: deepest matching package root wins
    expect(owner?.rootPath).toBe('packages/a/nested');
  });

  it('safely handles empty files maps', () => {
    const deps = analyzeDependencies({});
    expect(deps).toEqual([]);
  });
});
