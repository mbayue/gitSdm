import { describe, expect, it } from 'bun:test';
import { getVisibleRepoPresets } from './repoPresets';

describe('getVisibleRepoPresets', () => {
  it('hides mock presets when mock provider is disabled', () => {
    const repos = getVisibleRepoPresets(false).map((item) => item.repo);

    expect(repos).not.toContain('mock/todo-app');
    expect(repos).not.toContain('mock/gitsdm');
    expect(repos).toContain('facebook/react');
  });

  it('shows mock presets when mock provider is enabled', () => {
    const repos = getVisibleRepoPresets(true).map((item) => item.repo);

    expect(repos).toContain('mock/todo-app');
    expect(repos).toContain('mock/gitsdm');
  });

  it('returns valid structures containing descriptive details', () => {
    const items = getVisibleRepoPresets(true);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].repo).toBeDefined();
    expect(items[0].label).toBeDefined();
    expect(items[0].desc).toBeDefined();
  });
});
