import { FileCode, ChevronRight } from 'lucide-react';
import { useSearchStore } from './searchStore';

interface SearchResultsProps {
  onSelectFile?: (filePath: string, startLine: number) => void;
}

export function SearchResults({ onSelectFile }: SearchResultsProps) {
  const { results } = useSearchStore();

  if (results.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs text-zinc-500">
        {results.length} result{results.length !== 1 ? 's' : ''} found
      </div>
      {results.map((r, i) => (
        <button
          key={`${r.filePath}-${r.startLine}-${i}`}
          onClick={() => onSelectFile?.(r.filePath, r.startLine)}
          className="group w-full cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-all duration-200 hover:border-violet-500/20 hover:bg-white/[0.04]"
        >
          <div className="mb-2 flex items-center gap-2">
            <FileCode className="h-3.5 w-3.5 shrink-0 text-violet-400" />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-200">
              {r.filePath}
            </span>
            <span className="shrink-0 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-500">
              {r.language}
            </span>
            <span className="shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              {(r.score * 100).toFixed(0)}%
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-1.5">
            <span>Lines {r.startLine}–{r.endLine}</span>
          </div>

          <pre className="overflow-hidden rounded-lg bg-black/30 p-2.5 text-[11px] leading-relaxed">
            <code className="text-zinc-300 font-mono whitespace-pre">
              {r.snippet}
            </code>
          </pre>
        </button>
      ))}
    </div>
  );
}
