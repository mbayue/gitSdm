import { describe, expect, it } from 'vitest';
import { getVisibleRepoPresets } from './repo-presets';

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
});
