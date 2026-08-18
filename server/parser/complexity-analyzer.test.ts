import { describe, expect, it } from 'bun:test';
import { analyzeFileComplexity, analyzeAllFileComplexity } from './complexity-analyzer';

describe('complexity-analyzer', () => {
  it('counts line of code, single exports, named exports, multiline export blocks, and comments', () => {
    const code = `// Single line comment
# Python style comment
import React from './react';
import { useState } from './state';

export const a = 1;
export function b() {}
export class C {}
export default function() {}

export { x, y, z };
export type { IgnoreThis };

export {
  foo, // inline comment
  bar
};

const internal = 10;`;

    const metrics = analyzeFileComplexity('test.ts', code);
    expect(metrics.loc).toBe(code.split('\n').length);
    expect(metrics.importCount).toBe(2);
    expect(metrics.exportCount).toBe(9); // a, b, C, default, x, y, z, foo, bar
    expect(metrics.complexityScore).toBeGreaterThan(0);
  });

  it('handles unclosed export block at EOF', () => {
    const unclosed = `
export {
  item1,
  item2
`;
    const metrics = analyzeFileComplexity('unclosed.ts', unclosed);
    expect(metrics.exportCount).toBe(1);
  });

  it('analyzes all files in batch', () => {
    const files = {
      'a.ts': 'export const a = 1;',
      'b.ts': 'import "./a";\nexport const b = 2;',
    };
    const results = analyzeAllFileComplexity(files);
    expect(results['a.ts'].exportCount).toBe(1);
    expect(results['b.ts'].importCount).toBe(1);
  });
});


