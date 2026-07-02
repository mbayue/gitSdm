import { describe, expect, it } from 'bun:test';
import { stripMermaidFences } from './stripMermaidFences';

describe('stripMermaidFences', () => {
  it('strips ```mermaid fences', () => {
    const input = '```mermaid\ngraph LR\n  A-->B\n```';
    expect(stripMermaidFences(input)).toBe('graph LR\n  A-->B');
  });

  it('strips plain ``` fences', () => {
    const input = '```\ngraph TD\n  C-->D\n```';
    expect(stripMermaidFences(input)).toBe('graph TD\n  C-->D');
  });

  it('returns trimmed content when there are no fences', () => {
    expect(stripMermaidFences('graph LR\n  A-->B')).toBe('graph LR\n  A-->B');
  });

  it('handles fence without closing backticks', () => {
    const input = '```mermaid\ngraph LR\n  A-->B';
    expect(stripMermaidFences(input)).toBe('graph LR\n  A-->B');
  });

  it('handles closing backticks only', () => {
    const input = 'graph LR\n  A-->B\n```';
    expect(stripMermaidFences(input)).toBe('graph LR\n  A-->B');
  });

  it('handles empty string', () => {
    expect(stripMermaidFences('')).toBe('');
  });

  it('handles whitespace padding', () => {
    const input = '  ```mermaid\ngraph LR\n```  ';
    expect(stripMermaidFences(input)).toBe('graph LR');
  });

  it('handles multiline mermaid with complex content', () => {
    const input = '```mermaid\nsequenceDiagram\n  Alice->>John: Hello John, how are you?\n  John-->>Alice: Great!\n```';
    expect(stripMermaidFences(input)).toBe(
      'sequenceDiagram\n  Alice->>John: Hello John, how are you?\n  John-->>Alice: Great!'
    );
  });

  it('preserves inner backticks that are not fences', () => {
    const input = '```mermaid\ngraph LR\n  A["text with `backticks`"]\n```';
    expect(stripMermaidFences(input)).toBe('graph LR\n  A["text with `backticks`"]');
  });
});
