/**
 * Clipboard copy using the modern Clipboard API.
 * Throws if the API is unavailable or the copy fails, so callers can surface the error.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API is not available in this context (requires HTTPS or user permission).');
  }
  await navigator.clipboard.writeText(text);
}
