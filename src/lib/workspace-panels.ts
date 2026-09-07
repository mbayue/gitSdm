/** Keep the working canvas usable while retaining the user's preferred panel widths. */
export function fitWorkspacePanels(viewport: number, left: number, right: number) {
  const minimumLeft = left > 0 ? 180 : 0;
  const minimumRight = right > 0 ? 300 : 0;
  const budget = Math.max(minimumLeft + minimumRight, viewport - 360);
  const extraLeft = Math.max(0, left - minimumLeft);
  const extraRight = Math.max(0, right - minimumRight);
  const availableExtra = Math.max(0, budget - minimumLeft - minimumRight);
  const scale = Math.min(1, availableExtra / (extraLeft + extraRight || 1));
  return {
    left: minimumLeft + Math.floor(extraLeft * scale),
    right: minimumRight + Math.floor(extraRight * scale),
  };
}
