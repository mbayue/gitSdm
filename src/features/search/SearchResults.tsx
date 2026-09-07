import { useState } from 'react';
import { FileCode, ExternalLink, Network, Copy } from 'lucide-react';
import { useSearchStore } from './searchStore';
import { useVizStore } from '@/stores/vizStore';
import type { SearchResultCard as SearchResultCardType } from '@/types';

export interface SearchResultCardProps {
  result: SearchResultCardType & {
    highlights?: { line: number }[];
  };
  onSelectFile?: (filePath: string, startLine: number, action?: 'open' | 'inspect') => void;
}

interface SearchResultsProps {
  onSelectFile?: (filePath: string, startLine: number, action?: 'open' | 'inspect') => void;
}

export function SearchResults({ onSelectFile }: SearchResultsProps) {
  const { results } = useSearchStore();

  if (results.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest pl-1">
        {results.length} result{results.length !== 1 ? 's' : ''} found
      </div>
      {results.map((r, i) => (
        <SearchResultCard 
          key={`${r.filePath}-${r.startLine}-${i}`} 
          result={r} 
          onSelectFile={onSelectFile} 
        />
      ))}
    </div>
  );
}

function SearchResultCard({ result: r, onSelectFile }: SearchResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const snippetLines = r.snippet.split('\n');
  const isLong = snippetLines.length > 8;
  const displaySnippet = expanded || !isLong ? r.snippet : snippetLines.slice(0, 8).join('\n');

  return (
    <div className="w-full rounded-md border border-border bg-background p-3 transition-all duration-200 shadow-sm hover:border-ring/50">
      {/* Header Info */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs font-semibold text-accent hover:underline cursor-pointer" onClick={() => onSelectFile?.(r.filePath, r.startLine)}>
            {r.filePath}
          </span>
          <span className="shrink-0 rounded-sm bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
            {r.language}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground font-mono">Lines {r.startLine}–{r.endLine}</span>
          <span className="shrink-0 rounded-sm border border-success/30 bg-success/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-success">
            {(r.score * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Code Preview */}
      <div className="relative group">
        <pre className="overflow-x-auto rounded-sm bg-card border border-border p-2.5 text-[11px] leading-relaxed">
          <code className="text-foreground font-mono whitespace-pre">
            {displaySnippet}
          </code>
        </pre>
        {isLong && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent pointer-events-none rounded-b-sm" />
        )}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute bottom-1 right-2 text-[10px] text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded-sm hover:text-foreground transition-colors z-10"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSelectFile?.(r.filePath, r.startLine, 'open')}
          className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-card border border-border hover:border-accent hover:text-accent text-[10px] text-foreground transition-all"
        >
          <ExternalLink className="h-3 w-3" />
          Open File
        </button>
        <button
          onClick={() => onSelectFile?.(r.filePath, r.startLine, 'inspect')}
          className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-card border border-border hover:border-accent hover:text-accent text-[10px] text-foreground transition-all"
        >
          <Network className="h-3 w-3" />
          Inspect Graph
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(r.filePath);
            useVizStore.getState().setToastMessage('Copied path to clipboard');
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-card border border-border hover:border-accent hover:text-accent text-[10px] text-foreground transition-all ml-auto"
        >
          <Copy className="h-3 w-3" />
          Copy Path
        </button>
      </div>
    </div>
  );
}
