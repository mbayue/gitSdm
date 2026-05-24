export const FILE_EXT_COLORS: Record<string, string> = {
  ts: '#3b82f6',     // Blue
  tsx: '#60a5fa',    // Light Blue
  js: '#eab308',     // Yellow
  jsx: '#facc15',    // Light Yellow
  json: '#f59e0b',   // Amber
  css: '#ec4899',    // Pink
  scss: '#ec4899',   // Pink
  html: '#ef4444',   // Red
  htm: '#ef4444',    // Red
  md: '#10b981',     // Green
  yml: '#f97316',    // Orange
  yaml: '#f97316',   // Orange
  go: '#06b6d4',     // Cyan
  rs: '#ea580c',     // Rust
  py: '#3b82f6',     // Python Blue
  sh: '#10b981',     // Green
  bat: '#10b981',    // Green
  cmd: '#10b981',    // Green
  svg: '#8b5cf6',    // Purple
  png: '#8b5cf6',    // Purple
  jpg: '#8b5cf6',    // Purple
  jpeg: '#8b5cf6',   // Purple
  vue: '#41b883',    // Vue green
};

export function getNodeCircleColor(
  nodeType: 'repo' | 'folder' | 'file',
  name: string,
  extension?: string,
  _path?: string,
): string {
  if (nodeType === 'repo') return '#a78bfa'; // Violet
  if (nodeType === 'folder') return '#fbbf24'; // Amber
  
  const ext = extension?.toLowerCase() ?? name.split('.').pop()?.toLowerCase() ?? '';
  return FILE_EXT_COLORS[ext] ?? '#9ca3af'; // Grey
}

export function getNodeCircleSize(nodeType: 'repo' | 'folder' | 'file'): number {
  if (nodeType === 'repo') return 14;
  if (nodeType === 'folder') return 12;
  return 8;
}
