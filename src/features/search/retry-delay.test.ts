import { expect, test } from 'bun:test';
import { formatRetryDelay } from './retry-delay';

test('retry countdown uses readable minutes and hours', () => {
  expect(formatRetryDelay(63176000)).toBe('17 hr 33 min');
  expect(formatRetryDelay(60000)).toBe('1 min');
  expect(formatRetryDelay(3600000)).toBe('1 hr');
});
