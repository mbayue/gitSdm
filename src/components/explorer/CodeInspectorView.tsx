import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchRepoFile } from '@/lib/api-client';
import { HighlightedCode, CodePlaceholder } from '@/lib/syntax-highlight';
import { useVizStore } from '@/stores/viz-store';

interface CodeInspectorViewProps {
  owner: string;
  repo: string;
  filePath: string | null;
  onClose: () => void;
}

export function CodeInspectorView({ owner, repo, filePath, onClose }: CodeInspectorViewProps) {
  const selectedBranch = useVizStore((s) => s.selectedBranch);
  const { data, isLoading, error } = useQuery({
    queryKey: ['file', owner, repo, selectedBranch, filePath],
    queryFn: () => fetchRepoFile(owner, repo, filePath!, selectedBranch || undefined),
    enabled: !!filePath,
    staleTime: 1000 * 60 * 10,
  });

  const fileName = filePath?.split('/').pop() ?? '';

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-zinc-950">
      <header className="flex h-9 shrink-0 items-center gap-2 border-b border-white/5 bg-zinc-900 px-3">
        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
          Code inspector
        </span>
        {filePath && (
          <>
            <span className="text-zinc-600">·</span>
            <span className="truncate font-mono text-xs text-zinc-100">{fileName}</span>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded p-0.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-100"
          aria-label="Close inspector"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="code-inspector-scroll min-h-0 flex-1 overflow-auto bg-zinc-950 py-1">
        {!filePath && (
          <CodePlaceholder message="Select a file in the explorer to view its contents." />
        )}
        {filePath && isLoading && (
          <CodeInspectorSkeleton />
        )}
        {filePath && error && (
          <CodePlaceholder
            message={error instanceof Error ? error.message : 'Failed to load file'}
          />
        )}
        {filePath && data && (
          <HighlightedCode content={data.content} path={data.path} activeLine={1} />
        )}
      </div>
    </div>
  );
}

function CodeInspectorSkeleton() {
  const skeletonLines = [
    { indent: 0, tokens: [{ w: 'w-12', c: 'keyword' }, { w: 'w-20', c: 'text' }, { w: 'w-8', c: 'keyword' }, { w: 'w-16', c: 'string' }] },
    { indent: 0, tokens: [{ w: 'w-12', c: 'keyword' }, { w: 'w-16', c: 'text' }, { w: 'w-8', c: 'keyword' }, { w: 'w-36', c: 'string' }] },
    { indent: 0, tokens: [] },
    { indent: 0, tokens: [{ w: 'w-64', c: 'comment' }] },
    { indent: 0, tokens: [{ w: 'w-14', c: 'keyword' }, { w: 'w-16', c: 'keyword' }, { w: 'w-28', c: 'function' }, { w: 'w-24', c: 'text' }] },
    { indent: 4, tokens: [{ w: 'w-10', c: 'keyword' }, { w: 'w-28', c: 'text' }, { w: 'w-16', c: 'function' }, { w: 'w-12', c: 'text' }] },
    { indent: 4, tokens: [{ w: 'w-10', c: 'keyword' }, { w: 'w-20', c: 'text' }, { w: 'w-14', c: 'function' }] },
    { indent: 8, tokens: [{ w: 'w-16', c: 'text' }, { w: 'w-8', c: 'text' }, { w: 'w-12', c: 'string' }, { w: 'w-10', c: 'text' }] },
    { indent: 8, tokens: [{ w: 'w-14', c: 'text' }, { w: 'w-24', c: 'function' }] },
    { indent: 4, tokens: [{ w: 'w-4', c: 'text' }] },
    { indent: 0, tokens: [] },
    { indent: 4, tokens: [{ w: 'w-12', c: 'keyword' }] },
    { indent: 8, tokens: [{ w: 'w-6', c: 'keyword' }, { w: 'w-8', c: 'text' }, { w: 'w-36', c: 'string' }] },
    { indent: 12, tokens: [{ w: 'w-16', c: 'text' }, { w: 'w-8', c: 'text' }] },
    { indent: 16, tokens: [{ w: 'w-6', c: 'keyword' }, { w: 'w-28', c: 'function' }] },
    { indent: 12, tokens: [{ w: 'w-10', c: 'text' }] },
    { indent: 16, tokens: [{ w: 'w-6', c: 'keyword' }, { w: 'w-24', c: 'function' }] },
    { indent: 12, tokens: [{ w: 'w-4', c: 'text' }] },
    { indent: 8, tokens: [{ w: 'w-12', c: 'keyword' }] },
    { indent: 4, tokens: [{ w: 'w-6', c: 'keyword' }] },
    { indent: 0, tokens: [{ w: 'w-2', c: 'text' }] }
  ];

  return (
    <pre className="code-inspector-font text-[13px] leading-[22px] py-2">
      {skeletonLines.map((line, index) => (
        <div key={index} className="flex border-l-2 border-transparent py-0.5">
          <span className="w-12 shrink-0 select-none pr-4 text-right tabular-nums text-zinc-700/40">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 pl-4 flex items-center h-[22px]">
            {line.indent > 0 && (
              <div style={{ width: `${line.indent * 8}px` }} className="shrink-0" />
            )}
            {line.tokens.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {line.tokens.map((token, tIdx) => (
                  <div
                    key={tIdx}
                    className={`h-2.5 rounded-sm ${token.w} ${
                      token.c === 'keyword'
                        ? 'bg-purple-500/15 dark:bg-purple-400/10'
                        : token.c === 'function'
                        ? 'bg-blue-500/15 dark:bg-blue-400/10'
                        : token.c === 'string'
                        ? 'bg-emerald-500/15 dark:bg-emerald-400/10'
                        : token.c === 'comment'
                        ? 'bg-zinc-500/20 dark:bg-zinc-700/20'
                        : 'bg-zinc-700/25 dark:bg-zinc-800/40'
                    } animate-pulse`}
                  />
                ))}
              </div>
            ) : (
              <div className="h-2.5" />
            )}
          </div>
        </div>
      ))}
    </pre>
  );
}
