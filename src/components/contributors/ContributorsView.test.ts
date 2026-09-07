import { describe, expect, test } from 'bun:test';
import { CONTRIBUTOR_TIMELINE_HEIGHT } from './ContributorsView';

// Responsive-height contract: the commit activity timeline renders inside a
// `min-h-[280px]` wrapper and recharts' ResponsiveContainer needs a sized
// parent (it renders nothing when the parent height is 0). The exported
// constant keeps the chart height and the wrapper in sync.

describe('ContributorsView timeline height contract', () => {
  test('timeline height matches the min-h-[280px] wrapper', () => {
    expect(CONTRIBUTOR_TIMELINE_HEIGHT).toBe(280);
  });
});
