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
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">
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
                'rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all duration-150',
                isActive
                  ? 'border-[#58a6ff]/40 bg-[#58a6ff]/10 text-[#58a6ff]'
                  : 'border-[rgba(240,246,252,0.1)] bg-[#161b22] text-[#8b949e] hover:border-[#58a6ff]/20 hover:bg-[#0d1117] hover:text-[#e6edf3]'
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
