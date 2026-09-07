import { TooltipHint } from '@/components/ui/tooltip';
import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, HelpCircle, PackageX, ChevronDown, ChevronRight, RefreshCw, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RepoAnalysis, DependencyHealthItem } from '@/types';

interface DependencyHealthTabProps {
  analysis: RepoAnalysis;
}

type FilterType = 'all' | 'current' | 'outdated' | 'unknown' | 'unsupported';

export function DependencyHealthTab({ analysis }: DependencyHealthTabProps) {
  const health = analysis.dependencyHealth;
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (!health) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background p-4 text-center space-y-3">
           <div className="mx-auto h-10 w-10 rounded-md bg-card flex items-center justify-center border border-border">
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
           </div>
           <p className="text-xs text-muted-foreground">Health data not found or still analyzing...</p>
        </div>
      </div>
    );
  }

  const { summary, items, ecosystemSupport } = health;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
         <div className="rounded-lg border border-border bg-background p-4 text-center space-y-3">
           <div className="mx-auto h-10 w-10 rounded-md bg-card flex items-center justify-center border border-border">
              <PackageX className="h-4 w-4 text-muted-foreground" />
           </div>
           <p className="text-xs text-muted-foreground">No dependencies found in supported manifests.</p>
        </div>
      </div>
    );
  }

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'current') return item.state === 'current';
    if (filter === 'outdated') return item.state === 'outdated';
    if (filter === 'unknown') return item.state === 'unknown' || item.state === 'error';
    if (filter === 'unsupported') {
      const support = ecosystemSupport[item.ecosystem as keyof typeof ecosystemSupport];
      return support !== 'freshness';
    }
    return true;
  });

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="space-y-1.5">
        <div className="grid grid-cols-3 gap-1.5">
          <div
            className={cn(
              "rounded-md border border-border bg-background p-2 text-center cursor-pointer hover:bg-card transition-colors",
              filter === 'all' && "border-muted-foreground/30 bg-muted-foreground/5"
            )}
            onClick={() => setFilter('all')}
          >
            <div className="text-[16px] font-mono text-foreground font-semibold leading-none mb-1">{summary.total}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Total</div>
          </div>
          <div
            className={cn(
              "rounded-md border border-border bg-background p-2 text-center cursor-pointer hover:bg-card transition-colors",
              filter === 'current' && "border-emerald-500/30 bg-emerald-500/5"
            )}
            onClick={() => setFilter('current')}
          >
            <div className="text-[16px] font-mono text-success font-semibold leading-none mb-1">{summary.current}</div>
            <div className="text-xs uppercase tracking-wider text-emerald-500/80 font-bold">Current</div>
          </div>
          <div
            className={cn(
              "rounded-md border border-border bg-background p-2 text-center cursor-pointer hover:bg-card transition-colors",
              filter === 'outdated' && "border-amber-500/30 bg-amber-500/5"
            )}
            onClick={() => setFilter('outdated')}
          >
            <div className="text-[16px] font-mono text-warning font-semibold leading-none mb-1">{summary.outdated}</div>
            <div className="text-xs uppercase tracking-wider text-amber-500/80 font-bold">Outdated</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div
            className={cn(
              "rounded-md border border-border bg-background p-2 text-center cursor-pointer hover:bg-card transition-colors",
              filter === 'unknown' && "border-rose-500/30 bg-rose-500/5"
            )}
            onClick={() => setFilter('unknown')}
          >
            <div className="text-[16px] font-mono text-destructive font-semibold leading-none mb-1">{summary.unknown + summary.errors}</div>
            <div className="text-xs uppercase tracking-wider text-rose-500/80 font-bold">Unknown</div>
          </div>
          <div
            className={cn(
              "rounded-md border border-border bg-background p-2 text-center cursor-pointer hover:bg-card transition-colors",
              filter === 'unsupported' && "border-muted-foreground/30 bg-muted-foreground/5"
            )}
            onClick={() => setFilter('unsupported')}
          >
            <div className="text-[16px] font-mono text-muted-foreground font-semibold leading-none mb-1">{summary.unsupported}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Unsupported</div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-background px-3 py-2 flex items-start gap-2">
        <InfoIcon className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-snug">
          Freshness checks currently support <strong>npm</strong> only. Other ecosystems are inventoried but versions remain unchecked.
        </p>
      </div>

      <div className="space-y-3">
         <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">
              Dependencies
            </h3>
            <span className="text-xs font-mono text-muted-foreground">
               {filteredItems.length} {filter !== 'all' && `(${filter})`}
            </span>
         </div>

         <div className="space-y-1">
           {filteredItems.map(item => {
             const id = `${item.ecosystem}-${item.name}-${item.type}`;
             const isExpanded = expandedRows.has(id);
             return (
               <div key={id} className="rounded-md border border-border bg-background overflow-hidden">
                 <div
                   className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-card transition-colors"
                   onClick={() => toggleRow(id)}
                 >
                   <div className="flex items-center gap-2 overflow-hidden">
                     {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                     <StateIcon state={item.state} />
                     <div className="truncate">
                       <div className="text-xs font-semibold text-foreground truncate">{item.name}</div>
                       <div className="text-xs text-muted-foreground flex gap-1.5 items-center">
                         <span className="capitalize">{item.ecosystem}</span>
                         <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                         <span className="font-mono">{item.currentVersion || 'unknown'}</span>
                         {item.latestVersion && item.latestVersion !== item.currentVersion && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                              <span className="text-warning font-mono">→ {item.latestVersion}</span>
                            </>
                         )}
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 shrink-0 pl-2">
                     <span className="text-xs font-mono text-muted-foreground px-1.5 py-0.5 rounded border border-border bg-card">
                       {item.type}
                     </span>
                     {item.manifestPaths.length > 1 && (
                       <span className="text-xs font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                         x{item.manifestPaths.length}
                       </span>
                     )}
                   </div>
                 </div>

                 {isExpanded && (
                   <div className="border-t border-border bg-card p-2.5 space-y-2">
                     <div className="grid grid-cols-[80px_1fr] gap-1 text-xs">
                       <div className="text-muted-foreground font-semibold">Manifests</div>
                       <div className="text-foreground font-mono space-y-1">
                         {item.manifestPaths.map((p, i) => (
                           <TooltipHint key={i} content={p}><div className="truncate">{p}</div></TooltipHint>
                         ))}
                       </div>
                     </div>
                      {item.packageNames.length > 0 && item.packageNames.some(n => n !== item.name) && (
                        <div className="grid grid-cols-[80px_1fr] gap-1 text-xs">
                          <div className="text-muted-foreground font-semibold">Imported By</div>
                          <div className="text-foreground font-mono space-y-1">
                            {item.packageNames.filter(n => n !== item.name).map((name, i) => (
                              <TooltipHint key={i} content={name}><div className="truncate">{name}</div></TooltipHint>
                            ))}
                          </div>
                        </div>
                      )}
                     {item.license && (
                       <div className="grid grid-cols-[80px_1fr] gap-1 text-xs">
                         <div className="text-muted-foreground font-semibold">License</div>
                         <div className="text-foreground">{item.license}</div>
                       </div>
                     )}
                     {item.checkedAt && (
                       <div className="grid grid-cols-[80px_1fr] gap-1 text-xs">
                         <div className="text-muted-foreground font-semibold">Checked</div>
                         <div className="text-foreground font-mono">{new Date(item.checkedAt).toLocaleString()}</div>
                       </div>
                     )}
                     {item.error && (
                       <div className="grid grid-cols-[80px_1fr] gap-1 text-xs mt-1 pt-1 border-t border-rose-500/10">
                         <div className="text-destructive font-semibold">Error</div>
                         <div className="text-rose-300">{item.error}</div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             );
           })}
         </div>
      </div>

    </div>
  );
}

function StateIcon({ state }: { state: DependencyHealthItem['state'] }) {
  switch (state) {
    case 'current': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
    case 'outdated': return <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
    case 'error': return <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
    case 'unknown': return <HelpCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
    default: return <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  }
}

function InfoIcon(props: React.ComponentProps<typeof Info>) {
  return <Info {...props} />;
}
