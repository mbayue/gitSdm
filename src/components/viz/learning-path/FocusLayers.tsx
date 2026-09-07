import { cn } from '@/lib/utils';

export interface FocusLayer {
  id: 'all' | 'api' | 'ui' | 'core' | 'config';
  label: string;
}

const focusLayers: FocusLayer[] = [
  { id: 'all', label: 'All Files' },
  { id: 'api', label: 'API / Routes' },
  { id: 'ui', label: 'UI / Components' },
  { id: 'core', label: 'Core Services' },
  { id: 'config', label: 'Configuration' }
];

interface FocusLayersProps {
  activeFocusLayer: FocusLayer['id'] | null;
  setActiveFocusLayer: (id: FocusLayer['id']) => void;
}

export function FocusLayers({ activeFocusLayer, setActiveFocusLayer }: FocusLayersProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Graph Focus Filters
        </h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {focusLayers.map((layer) => {
          const isActive = activeFocusLayer === layer.id;
          return (
            <button
              type="button"
              key={layer.id}
              onClick={() => setActiveFocusLayer(layer.id)}
              aria-pressed={isActive}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150',
                isActive
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-border bg-card text-muted-foreground hover:border-accent/20 hover:bg-background hover:text-foreground'
              )}
            >
              {layer.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
