import { expect, test } from 'bun:test';
import { motionDuration, prefersReducedMotion, REDUCED_MOTION_QUERY } from './motion-preference';
import { useMotionStore } from '@/stores/motionStore';

test('graph camera movement is immediate only when reduced motion is enabled', () => {
  expect(motionDuration(400, true)).toBe(0);
  expect(motionDuration(400, false)).toBe(400);
});

test('preference defaults to system and stays full-motion without an OS signal', () => {
  expect(useMotionStore.getState().preference).toBe('system');
  // Headless (no window/matchMedia): OS signal unavailable, keep full motion.
  expect(prefersReducedMotion()).toBe(false);
});

test('explicit preference overrides the OS reduced-motion signal', () => {
  useMotionStore.getState().setPreference('reduced');
  expect(prefersReducedMotion()).toBe(true);
  useMotionStore.getState().setPreference('full');
  expect(prefersReducedMotion()).toBe(false);
  useMotionStore.setState({ preference: 'system' });
});

test("the 'system' preference consults window.matchMedia", () => {
  const globalRef = globalThis as unknown as {
    window?: { matchMedia: (query: string) => { matches: boolean } };
  };
  const original = globalRef.window;
  useMotionStore.setState({ preference: 'system' });
  globalRef.window = { matchMedia: (query) => ({ matches: query === REDUCED_MOTION_QUERY }) };
  try {
    expect(prefersReducedMotion()).toBe(true);
    globalRef.window = { matchMedia: () => ({ matches: false }) };
    expect(prefersReducedMotion()).toBe(false);
  } finally {
    globalRef.window = original;
    useMotionStore.setState({ preference: 'system' });
  }
});
