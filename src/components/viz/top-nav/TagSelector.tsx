import { Tag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingRow, ErrorRow, EmptyRow } from './dropdown-common';

interface TagSelectorProps {
  tags: { name: string }[] | undefined;
  tagsLoading: boolean;
  tagsError: Error | null;
  searchQuery: string;
  compareBranch: string | null;
  compareRefType: string | null;
  onSelect: (tagName: string) => void;
}

export function TagSelector({
  tags,
  tagsLoading,
  tagsError,
  searchQuery,
  compareBranch,
  compareRefType,
  onSelect,
}: TagSelectorProps) {
  const filteredTags = (tags ?? []).filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {tagsLoading && <LoadingRow label="Loading tags..." />}
      {tagsError && <ErrorRow label="Failed to fetch tags." />}
      {!tagsLoading && !tagsError && filteredTags.length === 0 && (
        <EmptyRow label="No tags found." />
      )}
      {!tagsLoading && !tagsError && filteredTags.length > 0 && (
        <div>
          <div className="px-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Tags</div>
          {filteredTags.map((t) => (
            <RefItem
              key={t.name}
              name={t.name}
              isCompared={compareBranch === t.name && compareRefType === 'tag'}
              onSelect={() => onSelect(t.name)}
              icon={<Tag className="h-3 w-3 text-muted-foreground shrink-0" />}
            />
          ))}
        </div>
      )}
    </>
  );
}

interface RefItemProps {
  name: string;
  isCompared: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
}

function RefItem({ name, isCompared, onSelect, icon }: RefItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs font-mono transition-colors cursor-pointer',
        isCompared
          ? 'bg-popover text-accent font-medium'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      )}
    >
      {icon}
      <span className="truncate flex-1">{name}</span>
      {isCompared && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
    </button>
  );
}
