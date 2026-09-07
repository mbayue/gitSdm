import { RotateCcw, X } from 'lucide-react';
import { useVizStore } from '@/stores/vizStore';

export function GraphFilterSummary({ selectionHidden }: {
  selectionHidden: boolean;
}) {
  const state = useVizStore();
  const scopeNames = { source: 'Source', important: 'Important', grouped: 'Grouped', full: 'Full graph' };
  const chips: { label: string; clear: () => void }[] = [];
  for (const type of ['file', 'folder', 'repo', 'package'] as const) {
    if (!state.nodeTypeFilters.has(type)) chips.push({ label: `Hidden: ${type}`, clear: () => state.toggleNodeTypeFilter(type) });
  }
  if (state.activeFocusLayer !== 'all') chips.push({ label: `Layer: ${state.activeFocusLayer}`, clear: () => state.setActiveFocusLayer('all') });
  if (state.searchQuery) chips.push({ label: `Search: ${state.searchQuery}`, clear: () => state.setSearchQuery('') });
  for (const extension of state.fileTypeFilters) chips.push({ label: extension, clear: () => state.toggleFileTypeFilter(extension) });
  for (const status of state.diffStatusFilters) chips.push({ label: `Changes: ${status}`, clear: () => state.toggleDiffStatusFilter(status) });
  const customContent = state.contentFilters.size !== 2 || !state.contentFilters.has('source') || !state.contentFilters.has('config');
  const changed = chips.length > 0 || state.graphScope !== 'source' || customContent;
  return (
    <div className="shrink-0 border-b border-border bg-background px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button type="button" onClick={() => state.setActiveDropdown('filter')} className="rounded text-accent hover:underline">
          Scope: {scopeNames[state.graphScope]}
        </button>
        {changed && <button type="button" onClick={state.resetFilters} className="ml-auto flex min-h-7 items-center gap-1 rounded px-2 text-foreground hover:bg-secondary">
          <RotateCcw className="size-3" /> Reset filters
        </button>}
      </div>
      {customContent && <p className="mt-2 break-words text-muted-foreground">Content: {Array.from(state.contentFilters).join(', ') || 'none'}</p>}
      {chips.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((chip) => <button key={chip.label} type="button" onClick={chip.clear} aria-label={`Remove filter ${chip.label}`}
          className="flex max-w-full items-center gap-1 rounded border border-border bg-card px-2 py-1 text-foreground hover:border-accent">
          <span className="truncate">{chip.label}</span><X className="size-3 shrink-0" />
        </button>)}
      </div>}
      {selectionHidden && <p className="mt-2 text-warning">The selected file is hidden by these filters. Its details remain available.</p>}
    </div>
  );
}
