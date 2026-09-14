import { cancelIndexing, type IndexScope } from '@/lib/apiClient';
import { useSearchStore } from './searchStore';
import { IndexingStatusPanel } from './IndexingStatusPanel';
import { useQueryClient } from '@tanstack/react-query';
import { beginIndexOperation, finishIndexOperation } from './index-operations';

interface SearchIndexControlsProps {
  owner: string;
  repo: string;
  branch?: string;
  scope: IndexScope;
  includeInput: string;
  excludeInput: string;
  onIncludeChange: (value: string) => void;
  onExcludeChange: (value: string) => void;
  onIndex: () => void;
}

export function SearchIndexControls(props: SearchIndexControlsProps) {
  const queryClient = useQueryClient();
  const handleCancel = async () => {
    const context = beginIndexOperation('cancel');
    const buildId = useSearchStore.getState().indexBuildId;
    try {
      await queryClient.cancelQueries({ queryKey: ['indexingStatus', props.owner, props.repo] });
      const status = await cancelIndexing(props.owner, props.repo, props.branch, props.scope, buildId);
      finishIndexOperation(context, status);
    } catch {
      const previous =
        context.previous.state === 'paused' ? { ...context.previous, retryAt: undefined } : context.previous;
      if (finishIndexOperation(context, previous))
        useSearchStore.getState().setError('Could not cancel indexing. Please retry.');
    }
  };
  return (
    <div className="mb-4 shrink-0">
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        {[
          {
            label: 'Include paths',
            value: props.includeInput,
            onChange: props.onIncludeChange,
            placeholder: 'packages/next/src, apps/web',
          },
          {
            label: 'Exclude paths',
            value: props.excludeInput,
            onChange: props.onExcludeChange,
            placeholder: 'test, docs, examples',
          },
        ].map((field) => (
          <label key={field.label} className="text-[11px] text-muted-foreground">
            {field.label}
            <input
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              placeholder={field.placeholder}
              className="mt-1 block w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
          </label>
        ))}
      </div>
      <IndexingStatusPanel
        onRetry={props.onIndex}
        onCancel={() => {
          void handleCancel();
        }}
      />
    </div>
  );
}
