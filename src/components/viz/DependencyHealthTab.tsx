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
        <div className="rounded-lg border border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-4 text-center space-y-3">
           <div className="mx-auto h-10 w-10 rounded-md bg-[#161b22] flex items-center justify-center border border-[rgba(240,246,252,0.1)]">
              <RefreshCw className="h-4 w-4 text-[#8b949e] animate-spin" />
           </div>
           <p className="text-[11px] text-[#8b949e]">Health data not found or still analyzing...</p>
        </div>
      </div>
    );
  }

  const { summary, items, ecosystemSupport } = health;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
         <div className="rounded-lg border border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-4 text-center space-y-3">
           <div className="mx-auto h-10 w-10 rounded-md bg-[#161b22] flex items-center justify-center border border-[rgba(240,246,252,0.1)]">
              <PackageX className="h-4 w-4 text-[#8b949e]" />
           </div>
           <p className="text-[11px] text-[#8b949e]">No dependencies found in supported manifests.</p>
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
              "rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-2 text-center cursor-pointer hover:bg-[#161b22] transition-colors",
              filter === 'all' && "border-[#8b949e]/30 bg-[#8b949e]/5"
            )}
            onClick={() => setFilter('all')}
          >
            <div className="text-[16px] font-mono text-[#e6edf3] font-semibold leading-none mb-1">{summary.total}</div>
            <div className="text-[8px] uppercase tracking-wider text-[#8b949e] font-bold">Total</div>
          </div>
          <div
            className={cn(
              "rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-2 text-center cursor-pointer hover:bg-[#161b22] transition-colors",
              filter === 'current' && "border-emerald-500/30 bg-emerald-500/5"
            )}
            onClick={() => setFilter('current')}
          >
            <div className="text-[16px] font-mono text-emerald-400 font-semibold leading-none mb-1">{summary.current}</div>
            <div className="text-[8px] uppercase tracking-wider text-emerald-500/80 font-bold">Current</div>
          </div>
          <div
            className={cn(
              "rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-2 text-center cursor-pointer hover:bg-[#161b22] transition-colors",
              filter === 'outdated' && "border-amber-500/30 bg-amber-500/5"
            )}
            onClick={() => setFilter('outdated')}
          >
            <div className="text-[16px] font-mono text-amber-400 font-semibold leading-none mb-1">{summary.outdated}</div>
            <div className="text-[8px] uppercase tracking-wider text-amber-500/80 font-bold">Outdated</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div
            className={cn(
              "rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-2 text-center cursor-pointer hover:bg-[#161b22] transition-colors",
              filter === 'unknown' && "border-rose-500/30 bg-rose-500/5"
            )}
            onClick={() => setFilter('unknown')}
          >
            <div className="text-[16px] font-mono text-rose-400 font-semibold leading-none mb-1">{summary.unknown + summary.errors}</div>
            <div className="text-[8px] uppercase tracking-wider text-rose-500/80 font-bold">Unknown</div>
          </div>
          <div
            className={cn(
              "rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] p-2 text-center cursor-pointer hover:bg-[#161b22] transition-colors",
              filter === 'unsupported' && "border-[#8b949e]/30 bg-[#8b949e]/5"
            )}
            onClick={() => setFilter('unsupported')}
          >
            <div className="text-[16px] font-mono text-[#8b949e] font-semibold leading-none mb-1">{summary.unsupported}</div>
            <div className="text-[8px] uppercase tracking-wider text-[#8b949e] font-bold">Unsupported</div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] px-3 py-2 flex items-start gap-2">
        <InfoIcon className="h-3.5 w-3.5 text-[#58a6ff] shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#8b949e] leading-snug">
          Freshness checks currently support <strong>npm</strong> only. Other ecosystems are inventoried but versions remain unchecked.
        </p>
      </div>

      <div className="space-y-3">
         <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold text-[#e6edf3] uppercase tracking-widest">
              Dependencies
            </h3>
            <span className="text-[10px] font-mono text-[#8b949e]">
               {filteredItems.length} {filter !== 'all' && `(${filter})`}
            </span>
         </div>

         <div className="space-y-1">
           {filteredItems.map(item => {
             const id = `${item.ecosystem}-${item.name}-${item.type}`;
             const isExpanded = expandedRows.has(id);
             return (
               <div key={id} className="rounded-md border border-[rgba(240,246,252,0.1)] bg-[#0d1117] overflow-hidden">
                 <div
                   className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-[#161b22] transition-colors"
                   onClick={() => toggleRow(id)}
                 >
                   <div className="flex items-center gap-2 overflow-hidden">
                     {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-[#8b949e] shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />}
                     <StateIcon state={item.state} />
                     <div className="truncate">
                       <div className="text-[11px] font-semibold text-[#e6edf3] truncate">{item.name}</div>
                       <div className="text-[9px] text-[#8b949e] flex gap-1.5 items-center">
                         <span className="capitalize">{item.ecosystem}</span>
                         <span className="w-1 h-1 rounded-full bg-[#8b949e]/30" />
                         <span className="font-mono">{item.currentVersion || 'unknown'}</span>
                         {item.latestVersion && item.latestVersion !== item.currentVersion && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-[#8b949e]/30" />
                              <span className="text-amber-400 font-mono">→ {item.latestVersion}</span>
                            </>
                         )}
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 shrink-0 pl-2">
                     <span className="text-[9px] font-mono text-[#8b949e] px-1.5 py-0.5 rounded border border-[rgba(240,246,252,0.1)] bg-[#161b22]">
                       {item.type}
                     </span>
                     {item.manifestPaths.length > 1 && (
                       <span className="text-[9px] font-mono text-[#58a6ff] bg-[#58a6ff]/10 px-1.5 py-0.5 rounded">
                         x{item.manifestPaths.length}
                       </span>
                     )}
                   </div>
                 </div>

                 {isExpanded && (
                   <div className="border-t border-[rgba(240,246,252,0.1)] bg-[#090d13] p-2.5 space-y-2">
                     <div className="grid grid-cols-[80px_1fr] gap-1 text-[10px]">
                       <div className="text-[#8b949e] font-semibold">Manifests</div>
                       <div className="text-[#e6edf3] font-mono space-y-1">
                         {item.manifestPaths.map((p, i) => (
                           <div key={i} className="truncate" title={p}>{p}</div>
                         ))}
                       </div>
                     </div>
                      {item.packageNames.length > 0 && item.packageNames.some(n => n !== item.name) && (
                        <div className="grid grid-cols-[80px_1fr] gap-1 text-[10px]">
                          <div className="text-[#8b949e] font-semibold">Imported By</div>
                          <div className="text-[#e6edf3] font-mono space-y-1">
                            {item.packageNames.filter(n => n !== item.name).map((name, i) => (
                              <div key={i} className="truncate" title={name}>{name}</div>
                            ))}
                          </div>
                        </div>
                      )}
                     {item.license && (
                       <div className="grid grid-cols-[80px_1fr] gap-1 text-[10px]">
                         <div className="text-[#8b949e] font-semibold">License</div>
                         <div className="text-[#e6edf3]">{item.license}</div>
                       </div>
                     )}
                     {item.checkedAt && (
                       <div className="grid grid-cols-[80px_1fr] gap-1 text-[10px]">
                         <div className="text-[#8b949e] font-semibold">Checked</div>
                         <div className="text-[#e6edf3] font-mono">{new Date(item.checkedAt).toLocaleString()}</div>
                       </div>
                     )}
                     {item.error && (
                       <div className="grid grid-cols-[80px_1fr] gap-1 text-[10px] mt-1 pt-1 border-t border-rose-500/10">
                         <div className="text-rose-400 font-semibold">Error</div>
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
    case 'unknown': return <HelpCircle className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />;
    default: return <Clock className="h-3.5 w-3.5 text-[#8b949e] shrink-0" />;
  }
}

function InfoIcon(props: React.ComponentProps<typeof Info>) {
  return <Info {...props} />;
}
