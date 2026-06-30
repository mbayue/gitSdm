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
        'npm:lodash:prod': {
          status: 'current',
          currentVersion: 'v4.17.21',
          latestVersion: '4.17.21',
          license: 'MIT',
          checkedAt: '2026-06-30T00:00:00.000Z',
        },
        'npm:react:prod': {
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
        'npm:vite:dev': { status: 'error', error: 'registry timeout', checkedAt: '2026-06-30T00:00:00.000Z' },
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
});
