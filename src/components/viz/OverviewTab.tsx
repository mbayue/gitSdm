import { TooltipHint } from '@/components/ui/tooltip';
import { useCallback, useMemo } from 'react';
import { useVizStore } from '@/stores/vizStore';
import type { RepoAnalysis } from '@/types';
import {
  Plus, Activity, AlertTriangle, GitBranch,
  FileCode, Folder, Package, Users, Code2, ShieldAlert, Info, Flame
} from 'lucide-react';

const GRAPH_FILE_NODE_CAP = 1200;
const GRAPH_FOLDER_NODE_CAP = 300;

interface OverviewTabProps {
  analysis: RepoAnalysis;
  selectedBranch: string | null;
  graphDiff?: {
    added: Set<string>;
    modified: Set<string>;
    deleted: Set<string>;
  } | null;
}

export function OverviewTab({ analysis, selectedBranch, graphDiff }: OverviewTabProps) {
  // Direct graph centering helper — works for both file and folder nodes
  const focusOnNode = useCallback((nodeId: string, filePath?: string | null) => {
    useVizStore.getState().setSelectedNodeId(nodeId);
    if (filePath !== undefined) {
      useVizStore.getState().setFocusedFilePath(filePath);
    }
  }, []);

  const {
    fileCount,
    folderCount,
    depCount,
    contributorCount,
    highCoupling,
    entryPoints,
    degrees,
    nodeById,
    maintenanceHotspots,
  } = useMemo(() => {
    const fileCount = analysis.graph.nodes.filter(n => n.type === 'file').length;
    const folderCount = analysis.graph.nodes.filter(n => n.type === 'folder').length;
    const depCount = analysis.dependencies.length;
    const contributorCount = analysis.contributors.length;

    // Calculate High Coupling
    const degrees: Record<string, number> = {};
    analysis.graph.edges.forEach(e => {
      degrees[e.source] = (degrees[e.source] || 0) + 1;
      degrees[e.target] = (degrees[e.target] || 0) + 1;
    });
    const highCoupling = analysis.graph.nodes
      .filter(n => n.type === 'file' || n.type === 'folder')
      .sort((a, b) => (degrees[b.id] || 0) - (degrees[a.id] || 0))
      .slice(0, 5);

    const entryPoints = analysis.graph.nodes
      .filter(n => n.data.fileClass === 'entry')
      .slice(0, 5);

  const nodeById = new Map(analysis.graph.nodes.map(n => [n.id, n]));

  // Compute Maintenance Hotspots: files with churnScore or complexityScore,
  // ranked by combined score
  const maintenanceHotspots = analysis.graph.nodes
    .filter(n => n.type === 'file' && (n.data.churnScore != null || n.data.complexityScore != null))
    .map(n => ({
      node: n,
      combinedScore: (n.data.churnScore ?? 0) * 0.5 + (n.data.complexityScore ?? 0) * 0.5,
    }))
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, 5);

  return { fileCount, folderCount, depCount, contributorCount, highCoupling, entryPoints, degrees, nodeById, maintenanceHotspots };
  }, [analysis]);

  const totalFiles = analysis.totalFiles ?? fileCount;
  const isGraphCapped = totalFiles > fileCount;

  return (
    <div className="space-y-5">
      {useVizStore.getState().compareBranch && graphDiff ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-background p-2.5 flex items-center justify-between group hover:border-ring/50 transition-all">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-widest">Added</span>
              </div>
              <span className="text-[13px] font-semibold text-foreground font-mono">{graphDiff.added.size}</span>
            </div>
            <div className="rounded-md border border-border bg-background p-2.5 flex items-center justify-between group hover:border-ring/50 transition-all">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-widest">Modified</span>
              </div>
              <span className="text-[13px] font-semibold text-foreground font-mono">{graphDiff.modified.size}</span>
            </div>
            <div className="rounded-md border border-border bg-background p-2.5 flex items-center justify-between group hover:border-ring/50 transition-all">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-widest">Deleted</span>
              </div>
              <span className="text-[13px] font-semibold text-foreground font-mono">{graphDiff.deleted.size}</span>
            </div>
            <div className="rounded-md border border-border bg-background p-2.5 flex items-center justify-between group hover:border-ring/50 transition-all">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-ui-active-text-green" />
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-widest">Total</span>
              </div>
              <span className="text-[13px] font-semibold text-foreground font-mono">{graphDiff.added.size + graphDiff.modified.size + graphDiff.deleted.size}</span>
            </div>
          </div>

          <div className="space-y-4">
            {graphDiff.added.size > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">
                  <Plus className="w-3 h-3" /> Added Files
                </h4>
                <div className="rounded-md border border-border bg-background py-2 space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                  {Array.from(graphDiff.added).map(id => {
                    const node = nodeById.get(id);
                    return (
                      <button 
                        key={id} 
                        onClick={() => {
                          focusOnNode(id, node?.data?.path || id);
                          useVizStore.getState().setInspectorOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-secondary text-xs text-foreground font-mono truncate transition-colors"
                      >
                        {node?.data.path || id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {graphDiff.modified.size > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">
                  <Activity className="w-3 h-3" /> Modified Files
                </h4>
                <div className="rounded-md border border-border bg-background py-2 space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                  {Array.from(graphDiff.modified).map(id => {
                    const node = nodeById.get(id);
                    return (
                      <button 
                        key={id} 
                        onClick={() => {
                          focusOnNode(id, node?.data?.path || id);
                          useVizStore.getState().setInspectorOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-secondary text-xs text-foreground font-mono truncate transition-colors"
                      >
                        {node?.data.path || id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {graphDiff.deleted.size > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-widest mb-2">
                  <AlertTriangle className="w-3 h-3" /> Deleted Files
                </h4>
                <div className="rounded-md border border-border bg-background py-2 space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin">
                  {Array.from(graphDiff.deleted).map(id => {
                    const node = nodeById.get(id);
                    return (
                      <button
                        key={id} 
                        onClick={() => {
                          focusOnNode(id, node?.data?.path || id);
                          useVizStore.getState().setInspectorOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-secondary text-xs text-muted-foreground font-mono truncate line-through transition-colors"
                      >
                        {node?.data.path || id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Metadata Section */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-foreground leading-tight flex items-center gap-2">
              {analysis.meta.repo}
              <span className="rounded-sm border border-border bg-secondary px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                {analysis.meta.owner}
              </span>
            </h3>
            {analysis.meta.description && (
              <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                {analysis.meta.description}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono border border-border rounded-sm px-1.5 py-0.5">
                <Code2 className="h-3 w-3" />
                {analysis.meta.language || 'Unknown'}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono border border-border rounded-sm px-1.5 py-0.5">
                <GitBranch className="h-3 w-3" />
                {selectedBranch || analysis.meta.defaultBranch || 'main'}
              </div>
              {analysis.meta.license && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono border border-border rounded-sm px-1.5 py-0.5">
                  <ShieldAlert className="h-3 w-3" />
                  {analysis.meta.license}
                </div>
              )}
              {analysis.workspacePackages && analysis.workspacePackages.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-[#ec4899] font-mono border border-[#ec4899]/20 bg-[#ec4899]/10 rounded-sm px-1.5 py-0.5">
                  <Package className="h-3 w-3" />
                  Monorepo
                </div>
              )}
            </div>

            {analysis.meta.topics && analysis.meta.topics.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {analysis.meta.topics.slice(0, 4).map(topic => (
                  <span key={topic} className="px-1.5 py-0.5 text-accent bg-accent/10 text-xs rounded-sm font-mono max-w-[120px] truncate">
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="h-px w-full bg-secondary" />

          {/* Stats Rows */}
	          <div className="space-y-1.5">
	            {[
	              { label: 'Files', val: fileCount, icon: FileCode },
              { label: 'Folders', val: folderCount, icon: Folder },
              { label: 'Dependencies', val: depCount, icon: Package },
              { label: 'Contributors', val: contributorCount, icon: Users },
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <stat.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</span>
                </div>
                <span className="text-xs font-mono text-foreground">{stat.val}</span>
	              </div>
	            ))}
	          </div>

          {isGraphCapped && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/15 bg-amber-500/5 px-2 py-1.5 text-xs leading-snug text-amber-200/80">
              <Info className="mt-0.5 h-3 w-3 shrink-0 text-amber-300/80" />
              <span>
                Graph view renders up to {GRAPH_FILE_NODE_CAP.toLocaleString()} files and {GRAPH_FOLDER_NODE_CAP.toLocaleString()} folders for responsiveness. Showing {fileCount.toLocaleString()} of {totalFiles.toLocaleString()} files.
              </span>
            </div>
          )}
          {analysis.treeTruncated && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/15 bg-amber-500/5 px-2 py-1.5 text-xs leading-snug text-amber-200/80">
              <Info className="mt-0.5 h-3 w-3 shrink-0 text-amber-300/80" />
              <span>
                Repository size exceeds API limits. The dependency graph uses a prioritized 5,000-file subset.
              </span>
            </div>
          )}
	
	          {/* Useful Sections */}
          {(entryPoints.length > 0 || analysis.importantFiles.length > 0 || highCoupling.length > 0) && (
            <div className="h-px w-full bg-secondary" />
          )}

          <div className="space-y-4">
            {entryPoints.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Entry Points</h4>
                <div className="space-y-0.5">
                  {entryPoints.map(node => (
                    <button
                      key={node.id}
                      onClick={() => {
                        focusOnNode(node.id, node.data?.path || node.id);
                      }}
                      className="w-full text-left px-1.5 py-1 text-xs font-mono text-foreground hover:bg-secondary rounded-sm truncate transition-colors"
                    >
                      {node.data.path || node.id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {analysis.importantFiles.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Suggested Reading</h4>
                <div className="space-y-0.5">
                  {analysis.importantFiles.slice(0, 5).map(file => (
                    <button
                      key={file}
                      onClick={() => {
                        const node = nodeById.get(`file:${file}`) || nodeById.get(file);
                        if (node) focusOnNode(node.id, node.data?.path || file);
                      }}
                      className="w-full flex items-center gap-1.5 text-left px-1.5 py-1 text-xs font-mono text-foreground hover:bg-secondary rounded-sm truncate transition-colors"
                    >
                      <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-xs bg-secondary text-muted-foreground rounded-sm">
                        {analysis.importantFiles.indexOf(file) + 1}
                      </span>
                      <span className="truncate">{file}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {highCoupling.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">High Coupling</h4>
                <div className="space-y-0.5">
                  {highCoupling.map(node => (
                    <div key={node.id} className="flex items-center justify-between group px-1.5 py-1 hover:bg-secondary rounded-sm transition-colors cursor-pointer"
                         onClick={() => {
                           focusOnNode(node.id, node.data?.path || node.id);
                         }}>
                      <span className="text-xs font-mono text-foreground truncate">{node.data.path || node.id}</span>
                      <span className="text-xs font-mono text-muted-foreground bg-secondary px-1 rounded-sm border border-border">
                        {degrees[node.id]} edges
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {maintenanceHotspots.length > 0 && (
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                  <Flame className="h-3 w-3 text-destructive" />
                  Maintenance Hotspots
                </h4>
                <p className="text-xs text-muted-foreground mb-1.5 leading-tight">
                  Files ranked by combined churn + complexity. Switch to Churn or Complexity overlay in the Display menu to visualize.
                </p>
                <div className="space-y-0.5">
                  {maintenanceHotspots.map(({ node }) => (
                    <button key={node.id} type="button"
                         onClick={() => {
                           focusOnNode(node.id, node.data?.path || node.id);
                         }}
                         className="w-full flex items-center justify-between px-1.5 py-1 hover:bg-secondary rounded-sm transition-colors cursor-pointer text-left">
                      <span className="text-xs font-mono text-foreground truncate flex-1">{node.data.path || node.id}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {node.data.churnScore != null && (
                          <TooltipHint content={`Churn: ${node.data.churnScore}`}><span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-1 rounded-sm border border-orange-500/20">
                            C{node.data.churnScore.toFixed(2)}
                          </span></TooltipHint>
                        )}
                        {node.data.complexityScore != null && (
                          <TooltipHint content={`Complexity: ${node.data.complexityScore}`}><span className="text-xs font-mono text-destructive bg-rose-500/10 px-1 rounded-sm border border-rose-500/20">
                            X{node.data.complexityScore.toFixed(2)}
                          </span></TooltipHint>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-px w-full bg-secondary" />

          {/* Commit Density */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Commit Density</h4>
              <Activity className="h-3 w-3 text-muted-foreground" />
            </div>
            {analysis.timeline.length === 0 ? (
              <div className="text-xs text-muted-foreground italic py-2">
                No commit history available.
              </div>
            ) : (
              <div className="flex items-end gap-0.5 h-8">
                {(() => {
                  const maxCount = Math.max(1, Math.max(...analysis.timeline.map(w => w.count)));
                  return analysis.timeline.slice(-24).map((week, idx) => {
                    const ratio = week.count / maxCount;
                    const heightPercentage = Math.max(10, ratio * 100);
                    const opacity = Math.max(0.2, ratio);

                    return (
                      <TooltipHint key={idx} content={`${week.count} commits on ${new Date(week.week).toLocaleDateString()}`}><div
                        className="group relative flex-1 rounded-t-[1px] transition-all bg-accent hover:bg-accent/80"
                        style={{
                          height: `${heightPercentage}%`,
                          opacity: opacity
                        }}
                      /></TooltipHint>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
