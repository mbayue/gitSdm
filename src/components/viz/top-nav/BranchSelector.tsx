import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingRow, ErrorRow, EmptyRow } from './dropdown-common';

interface BranchSelectorProps {
  branches: { name: string; protected: boolean }[] | undefined;
  branchesLoading: boolean;
  branchesError: Error | null;
  searchQuery: string;
  mode: 'switch' | 'compare';
  compareBranch: string | null;
  compareRefType: string | null;
  activeBranch: string;
  onSelect: (branchName: string) => void;
}

export function BranchSelector({
  branches,
  branchesLoading,
  branchesError,
  searchQuery,
  mode,
  compareBranch,
  compareRefType,
  activeBranch,
  onSelect,
}: BranchSelectorProps) {
  const getGroupedBranches = () => {
    if (!branches) return { current: [], recent: [], feature: [], other: [] };

    const filtered = branches.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const current = filtered.filter((b) => b.name === activeBranch);
    const rest = filtered.filter((b) => b.name !== activeBranch);

    const feature = rest.filter(
      (b) =>
        b.name.startsWith('feature/') ||
        b.name.startsWith('feat/') ||
        b.name.startsWith('refactor/') ||
        b.name.startsWith('fix/') ||
        b.name.startsWith('bug/')
    );

    const recent = rest.filter(
      (b) =>
        !feature.includes(b) &&
        ['main', 'master', 'develop', 'dev', 'production', 'prod'].includes(b.name)
    );

    const other = rest.filter((b) => !feature.includes(b) && !recent.includes(b));

    return { current, recent, feature, other };
  };

  const { current, recent, feature, other } = getGroupedBranches();
  const hasResults = current.length > 0 || recent.length > 0 || feature.length > 0 || other.length > 0;

  return (
    <>
      {branchesLoading && <LoadingRow label="Loading branches..." />}
      {branchesError && <ErrorRow label="Failed to fetch branches." />}
      {!branchesLoading && !branchesError && !hasResults && (
        <EmptyRow label="No branches found." />
      )}
      {!branchesLoading && !branchesError && hasResults && (
        <div className="space-y-3">
          {current.length > 0 && (
            <BranchGroup
              label="Current"
              items={current}
              compareBranch={compareBranch}
              compareRefType={compareRefType}
              mode={mode}
              onSelect={onSelect}
              activeBranch={activeBranch}
            />
          )}
          {recent.length > 0 && (
            <BranchGroup
              label="Recent"
              items={recent}
              compareBranch={compareBranch}
              compareRefType={compareRefType}
              mode={mode}
              onSelect={onSelect}
              activeBranch={activeBranch}
            />
          )}
          {feature.length > 0 && (
            <BranchGroup
              label="Feature"
              items={feature}
              compareBranch={compareBranch}
              compareRefType={compareRefType}
              mode={mode}
              onSelect={onSelect}
              activeBranch={activeBranch}
            />
          )}
          {other.length > 0 && (
            <BranchGroup
              label="Other"
              items={other}
              compareBranch={compareBranch}
              compareRefType={compareRefType}
              mode={mode}
              onSelect={onSelect}
              activeBranch={activeBranch}
            />
          )}
        </div>
      )}
    </>
  );
}

interface BranchGroupProps {
  label: string;
  items: { name: string; protected: boolean }[];
  compareBranch: string | null;
  compareRefType: string | null;
  mode: 'switch' | 'compare';
  activeBranch: string;
  onSelect: (name: string) => void;
}

function BranchGroup({ label, items, compareBranch, compareRefType, mode, activeBranch, onSelect }: BranchGroupProps) {
  return (
    <div>
      <div className="px-2 pb-1 text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono">{label}</div>
      {items.map((b) => (
        <BranchItem
          key={b.name}
          branch={b}
          isCurrent={b.name === activeBranch}
          isCompared={compareBranch === b.name && compareRefType === 'branch'}
          mode={mode}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

interface BranchItemProps {
  branch: { name: string; protected: boolean };
  isCurrent: boolean;
  isCompared: boolean;
  mode: 'switch' | 'compare';
  onSelect: (name: string) => void;
}

function BranchItem({ branch, isCurrent, isCompared, mode, onSelect }: BranchItemProps) {
  const isDisabled = mode === 'compare' && isCurrent;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelect(branch.name)}
      className={cn(
        'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs font-mono transition-colors cursor-pointer',
        isDisabled
          ? 'opacity-30 cursor-not-allowed text-[#8b949e]'
          : isCurrent && mode === 'switch'
            ? 'bg-[#1c2128] text-[#e6edf3] font-medium'
            : isCompared && mode === 'compare'
              ? 'bg-[#1c2128] text-[#58a6ff] font-medium'
              : 'text-[#8b949e] hover:bg-[rgba(240,246,252,0.1)] hover:text-[#e6edf3]'
      )}
    >
      <span className="truncate pr-4">{branch.name}</span>
      {mode === 'switch' && isCurrent && <Check className="h-3.5 w-3.5 text-[#e6edf3] shrink-0" />}
      {mode === 'compare' && isCompared && <Check className="h-3.5 w-3.5 text-[#58a6ff] shrink-0" />}
    </button>
  );
}
