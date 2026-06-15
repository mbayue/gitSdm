import { useMemo } from 'react';
import hljs from 'highlight.js';
import type { ReactNode } from 'react';

function languageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    json: 'json',
    yml: 'yaml',
    yaml: 'yaml',
    py: 'python',
    sh: 'bash',
    md: 'markdown',
    html: 'xml',
    htm: 'xml',
    css: 'css',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    swift: 'swift',
    kt: 'kotlin',
    sql: 'sql',
  };
  if (path.toLowerCase().includes('dockerfile')) return 'dockerfile';
  return map[ext] ?? 'plaintext';
}

function highlightLine(line: string, language: string): string {
  if (!line.trim()) return ' ';
  try {
    if (language === 'plaintext') {
      return escapeHtml(line) || ' ';
    }
    return hljs.highlight(line, { language, ignoreIllegals: true }).value;
  } catch {
    return escapeHtml(line);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function HighlightedCode({
  content,
  path,
  activeLine = 1,
}: {
  content: string;
  path: string;
  activeLine?: number;
}) {
  const language = languageFromPath(path);
  const lines = useMemo(() => content.split('\n'), [content]);
  const highlighted = useMemo(
    () => lines.map((line) => highlightLine(line, language)),
    [lines, language],
  );

  return (
    <pre className="code-inspector-font text-[13px] leading-[22px]">
      {highlighted.map((html, i) => {
        const lineNum = i + 1;
        const isActive = lineNum === activeLine;
        return (
          <div
            key={i}
            className={`flex border-l-2 ${isActive ? 'bg-violet-500/10 border-violet-500' : 'border-transparent'}`}
          >
            <span
              className={`w-12 shrink-0 select-none pr-4 text-right tabular-nums ${
                isActive ? 'text-zinc-100' : 'text-zinc-500'
              }`}
            >
              {lineNum}
            </span>
            <code
              className="hljs min-w-0 flex-1 whitespace-pre pl-4"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        );
      })}
    </pre>
  );
}

export function CodePlaceholder({ message }: { message: string }): ReactNode {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-xs text-zinc-500">
      {message}
    </div>
  );
}
