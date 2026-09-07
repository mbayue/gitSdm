import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  CONTRIBUTOR_TIMELINE_HEIGHT,
  getContributorTimelineWrapperStyle,
} from './ContributorsView';

// Responsive-height contract: the commit activity timeline renders inside a
// sized wrapper and recharts' ResponsiveContainer needs a sized parent (it
// renders nothing when the parent height is 0). The exported constant keeps
// the chart height and the wrapper in sync.

describe('ContributorsView timeline height contract', () => {
  test('timeline height matches the sized wrapper', () => {
    expect(CONTRIBUTOR_TIMELINE_HEIGHT).toBe(280);
  });

  test('wrapper style is derived from the constant', () => {
    expect(getContributorTimelineWrapperStyle()).toEqual({
      minHeight: CONTRIBUTOR_TIMELINE_HEIGHT,
    });
    expect(getContributorTimelineWrapperStyle().minHeight).toBe(280);
  });

  test('wrapper does not use a hardcoded min-h class that could drift', () => {
    const source = readFileSync(new URL('./ContributorsView.tsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/min-h-\[/);
    expect(source).toContain('getContributorTimelineWrapperStyle()');
  });
});
