import { useEffect } from 'react';
import { useVizStore } from '@/stores/viz-store';

export function ThemeSync() {
  const theme = useVizStore((s) => s.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    }
  }, [theme]);

  return null;
}
