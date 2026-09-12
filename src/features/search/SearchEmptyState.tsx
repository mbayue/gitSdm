import { useSearchStore } from './searchStore';

export function SearchEmptyState({ chunkCount, onSubmit }: { chunkCount: number; onSubmit: (query: string) => void }) {
  return (
    <div className="mt-8 space-y-6">
      <div>
        <h3 className="text-[10px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
          Search Examples
        </h3>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          {[
            'How are API errors handled?',
            'Where is GitHub data fetched?',
            'How is the dependency graph generated?',
          ].map((example) => (
            <button
              key={example}
              onClick={() => {
                useSearchStore.getState().setQuery(example);
                onSubmit(example);
              }}
              className="px-3 py-1.5 text-xs text-foreground bg-card border border-border rounded-md hover:border-ring/50 hover:bg-secondary transition-all text-left"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-[10px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
            Recent Queries
          </h3>
          <div className="text-[11px] text-muted-foreground italic p-3 border border-border rounded-md bg-background flex items-center justify-center h-[76px]">
            No recent queries yet.
          </div>
        </div>
        <div>
          <h3 className="text-[10px] font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
            Index Details
          </h3>
          <div className="text-[11px] text-foreground p-3 border border-border rounded-md bg-card h-[76px] flex flex-col justify-center space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="flex items-center gap-1.5 text-ui-active-text-green font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-ui-active-text-green shadow-[0_0_8px_rgba(230,237,243,0.4)]" />
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Chunks Indexed</span>
              <span className="font-mono text-xs">{chunkCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
