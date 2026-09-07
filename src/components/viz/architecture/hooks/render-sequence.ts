/**
 * Sequence guard for async mermaid renders.
 *
 * Each render effect bumps a monotonic sequence number; only the latest
 * effect's async render may publish state (SVG) or user-facing errors/toasts.
 * A superseded render (its sequence no longer matches the ref) or a cleaned-up
 * effect (its `active` flag was flipped by the effect teardown) must drop its
 * success/rejection updates.
 *
 * Pure function so the stale-suppression contract is unit-testable without
 * React, jsdom, or mermaid.
 */
export function shouldApplyRender(seq: number, currentSeq: number, active: boolean): boolean {
  return active && seq === currentSeq;
}
