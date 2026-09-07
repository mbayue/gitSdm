/**
 * Sequence guard for async mermaid renders.
 *
 * Each render effect starts an attempt via `createRenderSequence().start()`.
 * Starting a new attempt supersedes earlier ones; abandoning an attempt
 * models effect teardown. Only a live, latest attempt may publish state
 * (SVG) or user-facing errors/toasts — stale successes and stale rejections
 * are dropped.
 *
 * Self-contained (no React, jsdom, or mermaid) so the stale-suppression
 * contract is unit-testable; `useArchitectureState` holds one sequence in a
 * ref and delegates to it.
 */
export interface RenderAttempt {
  readonly seq: number;
  /** True while this attempt is live and no newer attempt has started. */
  shouldApply(): boolean;
  /** Model effect cleanup: this attempt must never apply afterwards. */
  abandon(): void;
}

export interface RenderSequence {
  /** Start a new render attempt, superseding all previous ones. */
  start(): RenderAttempt;
}

export function createRenderSequence(): RenderSequence {
  let current = 0;
  return {
    start(): RenderAttempt {
      const seq = (current += 1);
      let live = true;
      return {
        seq,
        shouldApply: () => live && seq === current,
        abandon: () => {
          live = false;
        },
      };
    },
  };
}
