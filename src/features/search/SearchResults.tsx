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
      <div className="text-[11px] text-[#8b949e] font-medium uppercase tracking-widest pl-1">
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
    <div className="w-full rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-3 transition-all duration-200 shadow-sm hover:border-[rgba(240,246,252,0.3)]">
      {/* Header Info */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="h-3.5 w-3.5 shrink-0 text-[#8b949e]" />
          <span className="truncate text-xs font-semibold text-[#58a6ff] hover:underline cursor-pointer" onClick={() => onSelectFile?.(r.filePath, r.startLine)}>
            {r.filePath}
          </span>
          <span className="shrink-0 rounded-sm bg-[rgba(240,246,252,0.1)] px-1.5 py-0.5 text-[9px] font-mono text-[#8b949e]">
            {r.language}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#8b949e] font-mono">Lines {r.startLine}–{r.endLine}</span>
          <span className="shrink-0 rounded-sm border border-[#3fb950]/30 bg-[#3fb950]/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#3fb950]">
            {(r.score * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Code Preview */}
      <div className="relative group">
        <pre className="overflow-x-auto rounded-sm bg-[#161b22] border border-[rgba(240,246,252,0.1)] p-2.5 text-[11px] leading-relaxed">
          <code className="text-[#e6edf3] font-mono whitespace-pre">
            {displaySnippet}
          </code>
        </pre>
        {isLong && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#161b22] to-transparent pointer-events-none rounded-b-sm" />
        )}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute bottom-1 right-2 text-[10px] text-[#8b949e] bg-[#0d1117] border border-[rgba(240,246,252,0.1)] px-1.5 py-0.5 rounded-sm hover:text-[#e6edf3] transition-colors z-10"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onSelectFile?.(r.filePath, r.startLine, 'open')}
          className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-[#161b22] border border-[rgba(240,246,252,0.1)] hover:border-[#58a6ff] hover:text-[#58a6ff] text-[10px] text-[#e6edf3] transition-all"
        >
          <ExternalLink className="h-3 w-3" />
          Open File
        </button>
        <button
          onClick={() => onSelectFile?.(r.filePath, r.startLine, 'inspect')}
          className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-[#161b22] border border-[rgba(240,246,252,0.1)] hover:border-[#58a6ff] hover:text-[#58a6ff] text-[10px] text-[#e6edf3] transition-all"
        >
          <Network className="h-3 w-3" />
          Inspect Graph
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(r.filePath);
            useVizStore.getState().setToastMessage('Copied path to clipboard');
          }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-[#161b22] border border-[rgba(240,246,252,0.1)] hover:border-[#58a6ff] hover:text-[#58a6ff] text-[10px] text-[#e6edf3] transition-all ml-auto"
        >
          <Copy className="h-3 w-3" />
          Copy Path
        </button>
      </div>
    </div>
  );
}
