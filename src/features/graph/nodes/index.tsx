import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useVizStore } from '@/stores/viz-store';
import { Folder, FileCode, FileText, Settings, FolderGit2, Users } from 'lucide-react';

function getNodeIcon(
  type: string | undefined,
  label: string,
  extension: string | undefined,
  color: string,
) {
  if (type === 'repo') {
    return <FolderGit2 className="h-3.5 w-3.5 text-violet-400" />;
  }
  if (type === 'folder') {
    return <Folder className="h-3.5 w-3.5 text-amber-400 fill-amber-400/10" />;
  }
  if (type === 'contributor') {
    return <Users className="h-3.5 w-3.5 text-sky-400" />;
  }

  const ext = extension?.toLowerCase() ?? label.split('.').pop()?.toLowerCase() ?? '';

  if (['ts', 'tsx', 'js', 'jsx', 'go', 'rs', 'py', 'java', 'c', 'cpp', 'sh', 'rb', 'php'].includes(ext)) {
    return <FileCode className="h-3.5 w-3.5" style={{ color }} />;
  }
  if (['json', 'yml', 'yaml', 'toml', 'xml', 'dockerignore', 'gitignore'].includes(ext)) {
    return <Settings className="h-3.5 w-3.5 text-zinc-400" />;
  }
  return <FileText className="h-3.5 w-3.5 text-zinc-400" />;
}

function CircleTreeNode({ data, selected, type }: NodeProps) {
  const label = data.label as string;
  const color = (data.nodeColor as string) ?? '#ffffff';
  const layoutType = useVizStore((state) => state.layoutType);

  const isLR = layoutType === 'LR';
  const targetPos = isLR ? Position.Left : Position.Top;
  const sourcePos = isLR ? Position.Right : Position.Bottom;

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all duration-200 backdrop-blur-md',
        selected
          ? 'bg-zinc-900/95 shadow-lg shadow-black/60'
          : 'bg-zinc-950/80 border-white/[0.06] hover:border-white/20 hover:bg-zinc-900/50',
      )}
      style={{
        borderColor: selected ? color : undefined,
        boxShadow: selected ? `0 0 14px ${color}22` : undefined,
      }}
    >
      <Handle
        type="target"
        position={targetPos}
        className="!h-1.5 !w-1.5 !border-0 !bg-zinc-600 !opacity-0 group-hover:!opacity-80 transition-opacity"
      />

      {/* Icon */}
      <span className="shrink-0 flex items-center justify-center">
        {getNodeIcon(type, label, data.extension as string | undefined, color)}
      </span>

      {/* Text label */}
      <span className="whitespace-nowrap font-mono text-[11px] font-medium leading-none text-zinc-200 group-hover:text-white transition-colors">
        {type === 'folder' && label.includes(' (') ? label.split(' (')[0] : label}
      </span>

      {/* Optional Folder child count badge */}
      {type === 'folder' && data.childCount !== undefined && (
        <span className="text-[9px] px-1 py-0.5 rounded bg-zinc-800/80 text-zinc-400 font-mono scale-90 select-none">
          {data.childCount as number}
        </span>
      )}

      <Handle
        type="source"
        position={sourcePos}
        className="!h-1.5 !w-1.5 !border-0 !bg-zinc-600 !opacity-0 group-hover:!opacity-80 transition-opacity"
      />
    </div>
  );
}

export const RepoNode = memo(CircleTreeNode);
RepoNode.displayName = 'RepoNode';

export const FolderNode = memo(CircleTreeNode);
FolderNode.displayName = 'FolderNode';

export const FileNode = memo(CircleTreeNode);
FileNode.displayName = 'FileNode';

/** Legacy types — same circle style if shown via filters */
export const PackageNode = memo(CircleTreeNode);
PackageNode.displayName = 'PackageNode';

export const ContributorNode = memo(CircleTreeNode);
ContributorNode.displayName = 'ContributorNode';

export const nodeTypes = {
  repo: RepoNode,
  folder: FolderNode,
  file: FileNode,
  package: PackageNode,
  contributor: ContributorNode,
};
