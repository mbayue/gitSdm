import { describe, it, expect } from 'vitest';
import { parsePackageJson, parseGoMod, parseManifest } from './index';

describe('manifest parsers', () => {
  it('parses package.json dependencies', () => {
    const deps = parsePackageJson(
      JSON.stringify({
        dependencies: { react: '^19.0.0' },
        devDependencies: { vite: '^6.0.0' },
      }),
    );
    expect(deps).toHaveLength(2);
    expect(deps.find((d) => d.name === 'react')?.type).toBe('prod');
    expect(deps.find((d) => d.name === 'vite')?.type).toBe('dev');
  });

  it('parses go.mod require block', () => {
    const deps = parseGoMod(`module example.com/app\n\nrequire (\n\tgithub.com/foo/bar v1.2.3\n)\n`);
    expect(deps.some((d) => d.name === 'github.com/foo/bar')).toBe(true);
  });

  it('routes by filename', () => {
    const deps = parseManifest('package.json', '{"dependencies":{"lodash":"^4.0.0"}}');
    expect(deps[0]?.ecosystem).toBe('npm');
  });
});
