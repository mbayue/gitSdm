import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../../../index.html', import.meta.url), 'utf8');
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!bootstrap) throw new Error('Theme bootstrap script missing');

function boot(storage: Record<string, string>) {
  const classes = new Set<string>();
  const root = {
    classList: { add: (name: string) => classes.add(name) },
    style: { colorScheme: '' },
  };
  runInNewContext(bootstrap!, {
    localStorage: { getItem: (key: string) => storage[key] ?? null },
    document: { documentElement: root },
  });
  return { light: classes.has('light'), scheme: root.style.colorScheme };
}

describe('theme before React mounts', () => {
  it('uses the persisted application theme over a stale legacy preference', () => {
    expect(boot({
      theme: 'dark',
      'gitsdm-viz-storage': JSON.stringify({ state: { theme: 'light' } }),
    })).toEqual({ light: true, scheme: 'light' });
    expect(boot({
      theme: 'light',
      'gitsdm-viz-storage': JSON.stringify({ state: { theme: 'dark' } }),
    })).toEqual({ light: false, scheme: 'dark' });
  });

  it('falls back to the legacy preference when saved state is malformed', () => {
    expect(boot({ theme: 'light', 'gitsdm-viz-storage': '{' }))
      .toEqual({ light: true, scheme: 'light' });
  });

  it('defaults to dark when no preference exists', () => {
    expect(boot({})).toEqual({ light: false, scheme: 'dark' });
  });
});
