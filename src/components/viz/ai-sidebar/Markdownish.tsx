import React from 'react';

function stripBadgeUrl(text: string) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
}

import { useVizStore } from '@/stores/vizStore';

function renderInline(text: string): React.ReactNode[] {
  const parts = stripBadgeUrl(text).split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      const content = part.slice(1, -1);
      // If it looks like a file path (has a dot and slash, or just slash), make it clickable
      if (content.includes('/') || content.includes('.')) {
        return (
          <button 
            key={idx} 
            onClick={() => {
              useVizStore.getState().setSelectedNodeId(content);
              useVizStore.getState().setFocusedFilePath(content);
            }}
            className="rounded bg-card px-1 py-0.5 font-mono text-xs text-accent hover:text-accent border border-border hover:bg-secondary transition-colors cursor-pointer inline-block"
          >
            {content}
          </button>
        );
      }
      return <code key={idx} className="rounded bg-card px-1 py-0.5 font-mono text-xs text-foreground border border-border">{content}</code>;
    }
    return part;
  });
}

export function Markdownish({ text }: { text: string }) {
  let normalized = text.trim();

  if (/^```(?:markdown|md)\s*\n/i.test(normalized)) {
    normalized = normalized.replace(/^```(?:markdown|md)\s*\n/i, '');
    normalized = normalized.replace(/\n```\s*$/i, '');
  }

  normalized = normalized
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/^\s*\|\s*-{2,}.*$/gm, '')
    .replace(/^\s*\|\s*Command\s*\|\s*Action\s*\|\s*$/gim, '## Scripts');

  const trimmed = normalized.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        steps?: { title: string; description: string; filePath?: string }[];
        overview?: string;
        explanation?: string;
      };
      if (parsed.steps?.length) {
        return (
          <ol className="space-y-3">
            {parsed.steps.map((step, i) => (
              <li key={i} className="rounded-xl border border-border bg-card p-3.5 hover:border-ui-active/20 transition-all">
                <p className="font-semibold text-foreground text-xs">{step.title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-normal">{step.description}</p>
                {step.filePath && (
                  <code className="mt-2 block text-xs font-mono text-muted-foreground truncate">
                    {step.filePath}
                  </code>
                )}
              </li>
            ))}
          </ol>
        );
      }
      if (parsed.overview) {
        return <p className="text-xs leading-relaxed text-foreground">{parsed.overview}</p>;
      }
      if (parsed.explanation) {
        return <p className="text-xs leading-relaxed text-foreground">{parsed.explanation}</p>;
      }
    } catch {
      // fall through to plain text markdown
    }
  }

  const lines = normalized.split('\n');
  const renderedElements: React.ReactNode[] = [];

  let insideCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (insideCodeBlock) {
        renderedElements.push(
          <pre key={`code-${codeBlockKey++}`} className="my-2.5 max-w-full overflow-x-auto rounded-lg bg-card p-3 text-xs font-mono text-foreground border border-border scrollbar-thin">
            <code className="block w-max min-w-full whitespace-pre">{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        insideCodeBlock = false;
      } else {
        insideCodeBlock = true;
      }
      continue;
    }

    if (insideCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    const trimmedLine = line.trim();

    if (/^---+$/.test(trimmedLine)) {
      renderedElements.push(
        <div key={i} className="my-4 h-px w-full bg-secondary" />
      );
    } else if (/^<[^>]+>$/.test(trimmedLine)) {
      continue;
    } else if (trimmedLine.startsWith('# ')) {
      renderedElements.push(
        <h1 key={i} className="mt-4 mb-2 text-sm font-bold text-foreground tracking-tight">
          {renderInline(trimmedLine.slice(2))}
        </h1>
      );
    } else if (trimmedLine.startsWith('## ')) {
      renderedElements.push(
        <h2 key={i} className="mt-3.5 mb-2 text-xs font-semibold text-foreground tracking-tight">
          {renderInline(trimmedLine.slice(3))}
        </h2>
      );
    } else if (trimmedLine.startsWith('### ')) {
      renderedElements.push(
        <h3 key={i} className="mt-3 mb-1.5 text-xs font-semibold dark:text-ui-active-text-green text-ui-active-text-green tracking-tight">
          {renderInline(trimmedLine.slice(4))}
        </h3>
      );
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      renderedElements.push(
        <div key={i} className="ml-3 flex items-start gap-2 my-1">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full dark:bg-ui-active-text-green bg-ui-active-text-green animate-pulse" />
          <span className="text-xs leading-relaxed text-muted-foreground">
            {renderInline(trimmedLine.slice(2))}
          </span>
        </div>
      );
    } else if (/^\d+\s*\.\s/.test(trimmedLine)) {
      const match = trimmedLine.match(/^(\d+)\s*\.\s(.*)/);
      if (match) {
        renderedElements.push(
          <div key={i} className="ml-3 flex items-start gap-1.5 my-1">
            <span className="text-xs font-mono dark:text-ui-active-text-green text-ui-active-text-green mt-0.5 shrink-0">{match[1]}.</span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {renderInline(match[2])}
            </span>
          </div>
        );
      }
    } else if (trimmedLine !== '') {
      renderedElements.push(
        <p key={i} className="break-words text-xs leading-relaxed text-muted-foreground my-2">
          {renderInline(line)}
        </p>
      );
    }
  }

  if (insideCodeBlock && codeBlockContent.length > 0) {
    renderedElements.push(
      <pre key={`code-${renderedElements.length}`} className="my-2.5 max-w-full overflow-x-auto rounded-lg bg-card p-3 text-xs font-mono text-foreground border border-border scrollbar-thin">
        <code className="block w-max min-w-full whitespace-pre">{codeBlockContent.join('\n')}</code>
      </pre>
    );
  }

  return <div className="space-y-1 min-w-0 overflow-hidden">{renderedElements}</div>;
}
