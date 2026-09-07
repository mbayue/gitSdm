export const GRAPH_THEMES = {
  dark: {
    background: '#1e1e1e',
    label: 'rgba(245,245,255,0.92)',
    hover: '#ffffff',
    mutedLink: 'rgba(255,255,255,0.06)',
    blastMutedLink: 'rgba(255,255,255,0.04)',
    activeLink: 'rgba(255,255,255,0.8)',
    defaultLink: 'rgba(180,190,220,0.35)',
  },
  light: {
    background: '#ffffff',
    label: '#333333',
    hover: '#333333',
    mutedLink: 'rgba(0,0,0,0.12)',
    blastMutedLink: 'rgba(0,0,0,0.08)',
    activeLink: 'rgba(0,0,0,0.8)',
    defaultLink: 'rgba(50,60,80,0.4)',
  },
} as const;

export type GraphTheme = keyof typeof GRAPH_THEMES;
