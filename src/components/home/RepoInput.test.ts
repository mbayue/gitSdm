import { describe, expect, test } from 'bun:test';
import {
  getPresetUrl,
  resolveOpenRepository,
  resolvePresetNavigation,
  resolveRepoNavigation,
} from './RepoInput';

// Locks the intended preset-click behavior: presets navigate immediately to
// `/owner/repo` (they don't just fill the input). These pure helpers drive
// both `handlePreset` and `openRepository`, so this tests the contract
// without needing DOM interaction infra.

describe('getPresetUrl', () => {
  test('builds the canonical GitHub URL for a preset slug', () => {
    expect(getPresetUrl('facebook/react')).toBe('https://github.com/facebook/react');
    expect(getPresetUrl('mock/todo-app')).toBe('https://github.com/mock/todo-app');
  });
});

describe('resolveRepoNavigation', () => {
  test('preset URL resolves to its route with pendingUrl', () => {
    expect(resolveRepoNavigation(getPresetUrl('facebook/react'))).toEqual({
      owner: 'facebook',
      repo: 'react',
      route: '/facebook/react',
      pendingUrl: 'https://github.com/facebook/react',
    });
  });

  test('owner/repo shorthand resolves too', () => {
    const nav = resolveRepoNavigation('vercel/next.js');
    expect(nav?.route).toBe('/vercel/next.js');
    expect(nav?.pendingUrl).toBe('vercel/next.js');
  });

  test('surrounding whitespace is trimmed', () => {
    const nav = resolveRepoNavigation('  https://github.com/vitejs/vite  ');
    expect(nav?.route).toBe('/vitejs/vite');
    expect(nav?.pendingUrl).toBe('https://github.com/vitejs/vite');
  });

  test('invalid input resolves to null (error path)', () => {
    expect(resolveRepoNavigation('not a repo !!!')).toBeNull();
    expect(resolveRepoNavigation('')).toBeNull();
  });
});

describe('resolveOpenRepository', () => {
  test('valid input yields the navigation target (submit flow)', () => {
    const result = resolveOpenRepository('https://github.com/facebook/react');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.nav.route).toBe('/facebook/react');
      expect(result.nav.pendingUrl).toBe('https://github.com/facebook/react');
    }
  });

  test('invalid input yields the displayed error (error flow)', () => {
    const result = resolveOpenRepository('not a repo !!!');
    expect(result).toEqual({
      ok: false,
      error: 'Enter a valid GitHub URL or owner/repo (e.g. facebook/react)',
    });
  });
});

describe('resolvePresetNavigation (preset-click behavior)', () => {
  test('a preset click navigates immediately to the preset route', () => {
    // Mirrors handlePreset: preset slug → preset URL → navigation target.
    // Guards the regression-sensitive change from input-only to
    // navigate-immediately behavior.
    const result = resolvePresetNavigation('facebook/react');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.nav).toEqual({
        owner: 'facebook',
        repo: 'react',
        route: '/facebook/react',
        pendingUrl: 'https://github.com/facebook/react',
      });
    }
  });

  test('every preset slug resolves to a navigation target', () => {
    for (const slug of ['facebook/react', 'vercel/next.js', 'mock/todo-app']) {
      const result = resolvePresetNavigation(slug);
      expect(result.ok).toBe(true);
    }
  });
});
