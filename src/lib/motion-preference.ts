export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  const preference = useMotionStore.getState().preference;
  if (preference !== 'system') return preference === 'reduced';
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function motionDuration(duration: number, reducedMotion = prefersReducedMotion()): number {
  return reducedMotion ? 0 : duration;
}
import { useMotionStore } from '@/stores/motionStore';
