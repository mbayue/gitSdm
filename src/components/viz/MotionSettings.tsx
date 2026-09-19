import { useMotionStore, type MotionPreference } from '@/stores/motionStore';

const options: { value: MotionPreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'full', label: 'Full' },
  { value: 'reduced', label: 'Reduced' },
];

export function MotionSettings() {
  const { preference, setPreference } = useMotionStore();
  return (
    <div className="block space-y-2 border-t border-border pt-3 text-sm text-foreground">
      <span className="font-medium">Motion</span>
      <div role="group" aria-label="Motion" className="grid grid-cols-3 gap-1 rounded-md border border-border bg-background p-1">
        {options.map(({ value, label }) => (
          <button key={value} type="button" aria-pressed={preference === value}
            onClick={() => setPreference(value)}
            className={`min-w-0 rounded border px-2 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${preference === value ? 'border-accent bg-accent/15 text-accent' : 'border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>
      <span className="block text-xs text-muted-foreground">
        Reduce interface and graph animations. Changes are saved automatically.
      </span>
    </div>
  );
}
