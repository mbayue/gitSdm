import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TreeNode } from '@/types';
import { FileTypeIcon, FolderIcon } from './FileIcons';

interface SmartFileExplorerProps {
  tree: TreeNode[];
  rootLabel: string;
  onSelectFile?: (path: string) => void;
  selectedPath?: string;
  searchQuery?: string;
  expansionTrigger?: { type: 'expand' | 'collapse'; time: number } | null;
}

// Recursive function to filter the file tree based on query
function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query) return nodes;
  const lowerQuery = query.toLowerCase();

  const filterNode = (node: TreeNode): TreeNode | null => {
    if (node.type === 'file') {
      return node.name.toLowerCase().includes(lowerQuery) ? node : null;
    }

    const filteredChildren: TreeNode[] = [];
    if (node.children) {
      for (const child of node.children) {
        const res = filterNode(child);
        if (res) filteredChildren.push(res);
      }
    }

    if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lowerQuery)) {
      return {
        ...node,
        children: filteredChildren,
      };
    }

    return null;
  };

  const result: TreeNode[] = [];
  for (const node of nodes) {
    const res = filterNode(node);
    if (res) result.push(res);
  }
  return result;
}

export function SmartFileExplorer({
  tree,
  rootLabel,
  onSelectFile,
  selectedPath,
  searchQuery = '',
  expansionTrigger = null,
}: SmartFileExplorerProps) {
  const [rootOpen, setRootOpen] = useState(true);

  // Defer the search query to prevent blocking the main thread during typing
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Filter the tree based on search query
  const filteredTree = useMemo(() => {
    return filterTree(tree, deferredSearchQuery);
  }, [tree, deferredSearchQuery]);

  useEffect(() => {
    if (selectedPath && !rootOpen) {
      setRootOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath]);

  // Keep root folder open when filtering
  useEffect(() => {
    if (deferredSearchQuery) {
      setRootOpen(true);
    }
  }, [deferredSearchQuery]);

  // Sync root open state with expansion triggers
  useEffect(() => {
    if (expansionTrigger) {
      setRootOpen(expansionTrigger.type === 'expand');
    }
  }, [expansionTrigger]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2 text-xs select-none">
      <button
        type="button"
        onClick={() => setRootOpen(!rootOpen)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-zinc-300 hover:bg-white/[0.03] hover:text-white transition-colors duration-150 outline-none"
      >
        <ChevronRight
          className={cn('h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-150', rootOpen && 'rotate-90')}
        />
        <FolderIcon open={rootOpen} />
        <span className="truncate font-semibold text-zinc-200">{rootLabel}</span>
      </button>
      {rootOpen && (
        <div className="ml-3.5 border-l border-white/[0.04] pl-0.5">
          {filteredTree.map((node) => (
            <TreeRow
              key={node.path}
              node={node}
              depth={0}
              onSelectFile={onSelectFile}
              selectedPath={selectedPath}
              searchQuery={deferredSearchQuery}
              expansionTrigger={expansionTrigger}
            />
          ))}
          {filteredTree.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-zinc-500 font-medium">
              No files match filter.
            </div>
          )}
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
  searchQuery,
  expansionTrigger,
}: {
  node: TreeNode;
  depth: number;
  onSelectFile?: (path: string) => void;
  selectedPath?: string;
  searchQuery: string;
  expansionTrigger: { type: 'expand' | 'collapse'; time: number } | null;
}) {
  const [open, setOpen] = useState(depth < 1);

  // Auto expand when search query is typed
  useEffect(() => {
    if (searchQuery) {
      setOpen(true);
    }
  }, [searchQuery]);

  // Sync with global expansion triggers
  useEffect(() => {
    if (expansionTrigger) {
      setOpen(expansionTrigger.type === 'expand');
    }
  }, [expansionTrigger]);

  // Sync with active selection
  useEffect(() => {
    if (selectedPath && (selectedPath === node.path || selectedPath.startsWith(node.path + '/')) && !open) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, node.path]);

  if (node.type === 'dir') {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 transition-colors duration-150 outline-none"
          style={{ paddingLeft: 8 + depth * 12 }}
        >
          <ChevronRight
            className={cn('h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform duration-150', open && 'rotate-90')}
          />
          <FolderIcon open={open} />
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {open && node.children && (
          <div className="ml-3.5 border-l border-white/[0.04] pl-0.5">
            {node.children.map((child) => (
              <TreeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                onSelectFile={onSelectFile}
                selectedPath={selectedPath}
                searchQuery={searchQuery}
                expansionTrigger={expansionTrigger}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const selected = selectedPath === node.path;

  return (
    <button
      type="button"
      onClick={() => onSelectFile?.(node.path)}
      className={cn(
        'flex w-full items-center gap-2 py-1.5 px-2 text-xs transition-all duration-150 select-none border-l-2 outline-none',
        selected
          ? 'bg-ui-active/15 border-ui-active/35 text-ui-active-text-green font-semibold'
          : 'border-transparent text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200',
      )}
      style={{ paddingLeft: 22 + depth * 12 }}
    >
      <FileTypeIcon name={node.name} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}
