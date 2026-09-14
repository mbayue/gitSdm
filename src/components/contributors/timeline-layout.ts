/**
 * Fixed chart height for the commit activity timeline.
 * Responsive-height contract: the wrapper's min-height (see
 * {@link getContributorTimelineWrapperStyle}) must match this value so the
 * recharts `ResponsiveContainer` always has a sized parent (it renders
 * nothing when the parent height is 0). Width stays fluid.
 */
export const CONTRIBUTOR_TIMELINE_HEIGHT = 280;

/**
 * Wrapper style for the commit activity timeline. Derived from
 * {@link CONTRIBUTOR_TIMELINE_HEIGHT} (inline style — Tailwind cannot
 * interpolate a TS constant into an arbitrary-value class, so a hardcoded class would
 * silently drift from the chart height). Changing the constant changes
 * rendering.
 */
export function getContributorTimelineWrapperStyle(): { minHeight: number } {
  return { minHeight: CONTRIBUTOR_TIMELINE_HEIGHT };
}

