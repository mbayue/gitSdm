import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchRepoFile } from '@/lib/api-client';
import { HighlightedCode, CodePlaceholder } from '@/lib/syntax-highlight';
import { Skeleton } from '@/components/ui/Skeleton';

interface CodeInspectorViewProps {
  owner: string;
  repo: string;
  filePath: string | null;
  onClose: () => void;
}

export function CodeInspectorView({ owner, repo, filePath, onClose }: CodeInspectorViewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['file', owner, repo, filePath],
    queryFn: () => fetchRepoFile(owner, repo, filePath!),
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
          <div className="space-y-2 p-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full bg-zinc-800" />
            ))}
          </div>
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
