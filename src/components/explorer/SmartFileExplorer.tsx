import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TreeNode } from '@/types';
import { FileTypeIcon, FolderIcon } from './file-icons';

interface SmartFileExplorerProps {
  tree: TreeNode[];
  rootLabel: string;
  onSelectFile?: (path: string) => void;
  selectedPath?: string;
}

export function SmartFileExplorer({
  tree,
  rootLabel,
  onSelectFile,
  selectedPath,
}: SmartFileExplorerProps) {
  const [rootOpen, setRootOpen] = useState(true);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-1 text-[13px]">
      <button
        type="button"
        onClick={() => setRootOpen(!rootOpen)}
        className="flex w-full items-center gap-1 px-2 py-1 text-left text-zinc-300 hover:bg-white/[0.03]"
      >
        <ChevronRight
          className={cn('h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform', rootOpen && 'rotate-90')}
        />
        <FolderIcon open={rootOpen} />
        <span className="truncate font-medium text-zinc-200">{rootLabel}</span>
      </button>
      {rootOpen && (
        <div className="ml-2 border-l border-white/[0.06] pl-1">
          {tree.map((node) => (
            <TreeRow
              key={node.path}
              node={node}
              depth={0}
              onSelectFile={onSelectFile}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeRow({
  node,
  depth,
  onSelectFile,
  selectedPath,
}: {
  node: TreeNode;
  depth: number;
  onSelectFile?: (path: string) => void;
  selectedPath?: string;
}) {
  const [open, setOpen] = useState(depth < 1);

  if (node.type === 'dir') {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-[3px] text-left text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
          style={{ paddingLeft: 8 + depth * 12 }}
        >
          <ChevronRight
            className={cn('h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform', open && 'rotate-90')}
          />
          <FolderIcon open={open} />
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children && (
          <div className="ml-3 border-l border-white/[0.06]">
            {node.children.map((child) => (
              <TreeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                onSelectFile={onSelectFile}
                selectedPath={selectedPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const selected = selectedPath === node.path;
  const isHtml = node.name.endsWith('.html') || node.name.endsWith('.htm');

  return (
    <button
      type="button"
      onClick={() => onSelectFile?.(node.path)}
      className={cn(
        'flex w-full items-center gap-1.5 rounded-md py-[3px] pr-2 text-left transition-all',
        selected && isHtml &&
          'mx-1 border border-rose-500/50 bg-rose-500/20 text-white shadow-[0_0_14px_rgba(244,114,182,0.2)]',
        selected && !isHtml &&
          'mx-1 border border-violet-500/40 bg-violet-500/20 text-white shadow-[0_0_12px_rgba(139,92,246,0.15)]',
        !selected && 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200',
      )}
      style={{ paddingLeft: 22 + depth * 12 }}
    >
      <FileTypeIcon name={node.name} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}
