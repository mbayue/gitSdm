import { describe, expect, it } from 'bun:test';

import { buildDependencyHealthReport } from './dependency-health';

describe('dependency-health', () => {
  it('builds grouped dependency health report with package scope and npm freshness states', () => {
    const report = buildDependencyHealthReport(
      [
        { ecosystem: 'npm', name: 'lodash', type: 'prod', version: '^4.17.21' },
        { ecosystem: 'npm', name: 'react', type: 'prod', version: '^19.0.0' },
        { ecosystem: 'go', name: 'github.com/gin-gonic/gin', type: 'prod' },
      ],
      [
        { ecosystem: 'npm', name: 'lodash', type: 'prod', version: '^4.17.21', manifestPath: 'packages/app/package.json', packageName: '@repo/app' },
        { ecosystem: 'npm', name: 'lodash', type: 'prod', version: '^4.17.21', manifestPath: 'packages/admin/package.json', packageName: '@repo/admin' },
        { ecosystem: 'go', name: 'github.com/gin-gonic/gin', type: 'prod', manifestPath: 'go.mod' },
      ],
      {
        'npm:lodash:^4.17.21:prod': {
          status: 'current',
          currentVersion: 'v4.17.21',
          latestVersion: '4.17.21',
          license: 'MIT',
          checkedAt: '2026-06-30T00:00:00.000Z',
        },
        'npm:react:^19.0.0:prod': {
          status: 'outdated',
          currentVersion: '19.0.0',
          latestVersion: '19.1.0',
          license: 'MIT',
          checkedAt: '2026-06-30T00:00:00.000Z',
        },
      },
      '2026-06-30T00:00:00.000Z',
    );

    expect(report.generatedAt).toBe('2026-06-30T00:00:00.000Z');
    expect(report.cacheTtlMs).toBe(1000 * 60 * 60 * 24);
    expect(report.ecosystemSupport).toEqual({
      npm: 'freshness',
      python: 'inventory-only',
      go: 'inventory-only',
      java: 'inventory-only',
      rust: 'inventory-only',
      docker: 'inventory-only',
    });
    expect(report.items).toEqual([
      {
        ecosystem: 'go',
        name: 'github.com/gin-gonic/gin',
        type: 'prod',
        state: 'unsupported',
        manifestPaths: ['go.mod'],
        packageNames: [],
      },
      {
        ecosystem: 'npm',
        name: 'lodash',
        type: 'prod',
        state: 'current',
        manifestPaths: ['packages/admin/package.json', 'packages/app/package.json'],
        packageNames: ['@repo/admin', '@repo/app'],
        currentVersion: '4.17.21',
        latestVersion: '4.17.21',
        license: 'MIT',
        checkedAt: '2026-06-30T00:00:00.000Z',
      },
      {
        ecosystem: 'npm',
        name: 'react',
        type: 'prod',
        state: 'outdated',
        manifestPaths: [],
        packageNames: [],
        currentVersion: '19.0.0',
        latestVersion: '19.1.0',
        license: 'MIT',
        checkedAt: '2026-06-30T00:00:00.000Z',
      },
    ]);
    expect(report.summary).toEqual({
      total: 3,
      current: 1,
      outdated: 1,
      unknown: 0,
      errors: 0,
      unsupported: 1,
    });
  });

  it('marks npm dependency unknown or error when freshness metadata is missing or failed', () => {
    const report = buildDependencyHealthReport(
      [
        { ecosystem: 'npm', name: 'chalk', type: 'dev', version: '^5.3.0' },
        { ecosystem: 'npm', name: 'vite', type: 'dev', version: '^5.0.0' },
      ],
      [],
      {
        'npm:vite:^5.0.0:dev': { status: 'error', error: 'registry timeout', checkedAt: '2026-06-30T00:00:00.000Z' },
      },
      '2026-06-30T00:00:00.000Z',
    );

    expect(report.items).toEqual([
      {
        ecosystem: 'npm',
        name: 'chalk',
        type: 'dev',
        state: 'unknown',
        manifestPaths: [],
        packageNames: [],
      },
      {
        ecosystem: 'npm',
        name: 'vite',
        type: 'dev',
        state: 'error',
        manifestPaths: [],
        packageNames: [],
        error: 'registry timeout',
        checkedAt: '2026-06-30T00:00:00.000Z',
      },
    ]);
  });

  it('handles fallback version comparison paths correctly', () => {
    const report = buildDependencyHealthReport(
      [
        // Case 1: status is 'unknown'
        { ecosystem: 'npm', name: 'dep-unknown', type: 'prod', version: '1.0.0' },
        // Case 2: status is undefined, and missing versions
        { ecosystem: 'npm', name: 'dep-missing-ver', type: 'prod', version: '1.0.0' },
        // Case 3: status is undefined, versions match
        { ecosystem: 'npm', name: 'dep-match', type: 'prod', version: '1.0.0' },
        // Case 4: status is undefined, outdated
        { ecosystem: 'npm', name: 'dep-outdated', type: 'prod', version: '1.0.0' },
        // Case 5: status is undefined, newer major
        { ecosystem: 'npm', name: 'dep-newer-major', type: 'prod', version: '1.0.0' },
        // Case 6: status is undefined, build metadata ignored
        { ecosystem: 'npm', name: 'dep-build', type: 'prod', version: '1.0.0' },
        // Case 7: status is undefined, pre-release older than release
        { ecosystem: 'npm', name: 'dep-pre', type: 'prod', version: '1.0.0' },
        // Case 8: status is undefined, release newer than pre-release
        { ecosystem: 'npm', name: 'dep-rel-pre', type: 'prod', version: '1.0.0' },
        // Case 9: status is undefined, pre-release comparison
        { ecosystem: 'npm', name: 'dep-pre-cmp', type: 'prod', version: '1.0.0' },
        // Case 10: status is undefined, pre-release numeric comparison
        { ecosystem: 'npm', name: 'dep-pre-num', type: 'prod', version: '1.0.0' },
        // Case 11: status is undefined, pre-release non-numeric vs numeric
        { ecosystem: 'npm', name: 'dep-pre-mix', type: 'prod', version: '1.0.0' },
        // Case 12: status is undefined, non-numeric pre-release parts sorting
        { ecosystem: 'npm', name: 'dep-pre-lex', type: 'prod', version: '1.0.0' },
        // Case 13: status is undefined, pre-release unequal part lengths
        { ecosystem: 'npm', name: 'dep-pre-len', type: 'prod', version: '1.0.0' },
        // Case 14: status is undefined, invalid non-numeric parts fallback
        { ecosystem: 'npm', name: 'dep-invalid', type: 'prod', version: 'foo' },
        // Case 15: status is undefined, non-numeric vs numeric (line 249)
        { ecosystem: 'npm', name: 'dep-pre-nonnum-num', type: 'prod', version: '1.0.0' },
        // Case 16: status is undefined, identical pre-releases (line 254 loop finish)
        { ecosystem: 'npm', name: 'dep-pre-identical', type: 'prod', version: '1.0.0' },
      ],
      [],
      {
        'npm:dep-unknown:1.0.0:prod': { status: 'unknown' },
        'npm:dep-missing-ver:1.0.0:prod': { status: undefined, currentVersion: '1.0.0', latestVersion: undefined },
        'npm:dep-match:1.0.0:prod': { status: undefined, currentVersion: '1.0.0', latestVersion: '1.0.0' },
        'npm:dep-outdated:1.0.0:prod': { status: undefined, currentVersion: '1.0.0', latestVersion: '1.0.1' },
        'npm:dep-newer-major:1.0.0:prod': { status: undefined, currentVersion: '1.0.0', latestVersion: '2.0.0' },
        'npm:dep-build:1.0.0:prod': { status: undefined, currentVersion: '1.0.0+build1', latestVersion: '1.0.0+build2' },
        'npm:dep-pre:1.0.0:prod': { status: undefined, currentVersion: '1.0.0-alpha', latestVersion: '1.0.0' },
        'npm:dep-rel-pre:1.0.0:prod': { status: undefined, currentVersion: '1.0.0', latestVersion: '1.0.0-alpha' },
        'npm:dep-pre-cmp:1.0.0:prod': { status: undefined, currentVersion: '1.0.0-alpha', latestVersion: '1.0.0-beta' },
        'npm:dep-pre-num:1.0.0:prod': { status: undefined, currentVersion: '1.0.0-alpha.1', latestVersion: '1.0.0-alpha.2' },
        'npm:dep-pre-mix:1.0.0:prod': { status: undefined, currentVersion: '1.0.0-alpha.1', latestVersion: '1.0.0-alpha.beta' },
        'npm:dep-pre-lex:1.0.0:prod': { status: undefined, currentVersion: '1.0.0-alpha.beta', latestVersion: '1.0.0-alpha.gamma' },
        'npm:dep-pre-len:1.0.0:prod': { status: undefined, currentVersion: '1.0.0-alpha', latestVersion: '1.0.0-alpha.1' },
        'npm:dep-invalid:foo:prod': { status: undefined, currentVersion: 'abc', latestVersion: 'xyz' },
        'npm:dep-pre-nonnum-num:1.0.0:prod': { status: undefined, currentVersion: '1.0.0-alpha.beta', latestVersion: '1.0.0-alpha.1' },
        'npm:dep-pre-identical:1.0.0:prod': { status: undefined, currentVersion: '1.0.0-alpha.1', latestVersion: '1.0.0-alpha.1' },
      },
      '2026-06-30T00:00:00.000Z',
    );

    const items = report.items;
    expect(items.find(i => i.name === 'dep-unknown')?.state).toBe('unknown');
    expect(items.find(i => i.name === 'dep-missing-ver')?.state).toBe('unknown');
    expect(items.find(i => i.name === 'dep-match')?.state).toBe('current');
    expect(items.find(i => i.name === 'dep-outdated')?.state).toBe('outdated');
    expect(items.find(i => i.name === 'dep-newer-major')?.state).toBe('outdated');
    expect(items.find(i => i.name === 'dep-build')?.state).toBe('current');
    expect(items.find(i => i.name === 'dep-pre')?.state).toBe('outdated');
    expect(items.find(i => i.name === 'dep-rel-pre')?.state).toBe('current');
    expect(items.find(i => i.name === 'dep-pre-cmp')?.state).toBe('outdated');
    expect(items.find(i => i.name === 'dep-pre-num')?.state).toBe('outdated');
    expect(items.find(i => i.name === 'dep-pre-mix')?.state).toBe('outdated');
    expect(items.find(i => i.name === 'dep-pre-lex')?.state).toBe('outdated');
    expect(items.find(i => i.name === 'dep-pre-len')?.state).toBe('outdated');
    expect(items.find(i => i.name === 'dep-invalid')?.state).toBe('current');
    expect(items.find(i => i.name === 'dep-pre-nonnum-num')?.state).toBe('current');
    expect(items.find(i => i.name === 'dep-pre-identical')?.state).toBe('current');
  });
});
