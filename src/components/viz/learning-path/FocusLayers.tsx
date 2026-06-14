import { cn } from '@/lib/utils';

export interface FocusLayer {
  id: 'all' | 'api' | 'ui' | 'core' | 'config';
  label: string;
}

export const focusLayers: FocusLayer[] = [
  { id: 'all', label: 'All Files' },
  { id: 'api', label: 'API / Routes' },
  { id: 'ui', label: 'UI / Components' },
  { id: 'core', label: 'Core Services' },
  { id: 'config', label: 'Configuration' }
];

interface FocusLayersProps {
  activeFocusLayer: string | null;
  setActiveFocusLayer: (id: 'all' | 'api' | 'ui' | 'core' | 'config') => void;
}

export function FocusLayers({ activeFocusLayer, setActiveFocusLayer }: FocusLayersProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Smart Focus Layers
        </h4>
        <span className="text-[10px] text-zinc-400 font-mono">Isolates graph modules</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {focusLayers.map((layer) => {
          const isActive = activeFocusLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => setActiveFocusLayer(layer.id)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-150',
                isActive
                  ? 'border-violet-500/35 bg-violet-500/12 text-violet-300'
                  : 'border-white/[0.05] bg-zinc-950/30 text-zinc-500 hover:border-white/10 hover:text-zinc-300'
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
