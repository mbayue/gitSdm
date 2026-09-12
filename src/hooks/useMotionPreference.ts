import { useSyncExternalStore } from 'react';
import { prefersReducedMotion, REDUCED_MOTION_QUERY } from '@/lib/motion-preference';
import { useMotionStore } from '@/stores/motionStore';

function subscribe(listener: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', listener);
  const unsubscribe = useMotionStore.subscribe(listener);
  return () => {
    query.removeEventListener('change', listener);
    unsubscribe();
  };
}

export function useMotionPreference() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
