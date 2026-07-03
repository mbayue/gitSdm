import { extractRawImports } from './import-resolver';

export interface FileComplexityMetrics {
  loc: number;
  importCount: number;
  exportCount: number;
  complexityScore: number;
}

/**
 * Count export statements in file content.
 * Handles: export const, export function, export class, export default, export {, export type/interface
 */
function countExports(content: string): number {
  let count = 0;
  const lines = content.split('\n');
  let inExportBlock = false;
  let blockContent = '';

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

    if (inExportBlock) {
      // Strip inline // comments before accumulating
      const withoutComment = trimmed.split('//')[0]!;
      blockContent += withoutComment;
      if (withoutComment.includes('}')) {
        // End of multi-line export { ... }
        const inner = blockContent.slice(0, blockContent.indexOf('}'));
        const names = inner.split(',').map(s => s.trim()).filter(Boolean);
        count += names.length || 1;
        inExportBlock = false;
        blockContent = '';
      }
      continue;
    }

    // Match export statements at line start (after whitespace)
    if (/^\bexport\b/.test(trimmed) && !/^export\s+type\s+\{/.test(trimmed)) {
      // Count each named export in a single export { a, b, c } statement
      if (trimmed.startsWith('export {') && !trimmed.includes('}')) {
        // Multi-line export { ... } block — start accumulating
        inExportBlock = true;
        blockContent = trimmed.slice('export {'.length);
      } else if (trimmed.startsWith('export {')) {
        const inner = trimmed.slice('export {'.length, trimmed.indexOf('}'));
        const names = inner.split(',').map(s => s.trim()).filter(Boolean);
        count += names.length || 1;
      } else {
        count++;
      }
    }
  }
  // If file ends without closing brace, count as 1 export
  if (inExportBlock) {
    count += 1;
  }
  return count;
}

/**
 * Compute complexity metrics for a single file from its content.
 */
export function analyzeFileComplexity(path: string, content: string): FileComplexityMetrics {
  const loc = content.split('\n').length;
  const rawImports = extractRawImports(path, content);
  const importCount = rawImports.length;
  const exportCount = countExports(content);

  // Normalize to 0-1 score: loc (0-2000), imports (0-50), exports (0-50)
  const locScore = Math.min(loc / 2000, 1);
  const importScore = Math.min(importCount / 50, 1);
  const exportScore = Math.min(exportCount / 50, 1);
  const complexityScore = +(locScore * 0.5 + importScore * 0.3 + exportScore * 0.2).toFixed(4);

  return { loc, importCount, exportCount, complexityScore };
}

/**
 * Compute complexity metrics for all files in fileContents map.
 */
export function analyzeAllFileComplexity(
  fileContents: Record<string, string>,
): Record<string, FileComplexityMetrics> {
  const results: Record<string, FileComplexityMetrics> = {};
  for (const [path, content] of Object.entries(fileContents)) {
    results[path] = analyzeFileComplexity(path, content);
  }
  return results;
}
