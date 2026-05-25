import { describe, it, expect } from 'vitest';
import { analyzeDependencies } from './dependency-analyzer';

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
});
