import { expect, test } from 'bun:test';
import { motionDuration } from './motion-preference';

test('graph camera movement is immediate only when reduced motion is enabled', () => {
  expect(motionDuration(400, true)).toBe(0);
  expect(motionDuration(400, false)).toBe(400);
});
