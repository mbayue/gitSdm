export type SpatialMode = 'full' | 'explorer' | 'insights' | 'focus';
export function modeFromPanels(explorer: boolean, insights: boolean): SpatialMode {
  return explorer ? (insights ? 'full' : 'explorer') : insights ? 'insights' : 'focus';
}
export function panelsForMode(mode: SpatialMode, mobile: boolean) {
  return {
    explorerOpen: mode === 'explorer' || mode === 'full',
    aiSidebarOpen: mode === 'insights' || (mode === 'full' && !mobile),
  };
}
