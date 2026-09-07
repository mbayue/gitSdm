import { describe, expect, test } from 'bun:test';
import { getPresetUrl, resolveRepoNavigation } from './RepoInput';

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
