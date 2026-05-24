import type { FileClass } from '../../src/types';

const CONFIG_PATTERNS = [
  /^\.env/,
  /config/i,
  /\.config\./,
  /tsconfig/,
  /vite\.config/,
  /tailwind/,
  /eslint/,
  /prettier/,
  /\.github\//,
  /docker/i,
  /Makefile/,
  /CMakeLists/,
];

const TEST_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /\/test\//,
  /\/tests\//,
  /_test\./,
  /_spec\./,
];

const ENTRY_PATTERNS = [
  /^src\/main\./,
  /^src\/index\./,
  /^index\./,
  /^main\./,
  /^app\./,
  /^server\./,
  /\/index\.(tsx?|jsx?|py|go|rs)$/,
  /^src\/App\./,
];

const DOC_PATTERNS = [/README/i, /CHANGELOG/i, /LICENSE/i, /CONTRIBUTING/i, /\.md$/];

const ASSET_PATTERNS = [/\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|mp4|webp)$/i];

export function classifyFile(path: string): FileClass {
  const base = path.split('/').pop() ?? path;

  if (ENTRY_PATTERNS.some((p) => p.test(path) || p.test(base))) return 'entry';
  if (TEST_PATTERNS.some((p) => p.test(path))) return 'test';
  if (CONFIG_PATTERNS.some((p) => p.test(path) || p.test(base))) return 'config';
  if (DOC_PATTERNS.some((p) => p.test(path) || p.test(base))) return 'doc';
  if (ASSET_PATTERNS.some((p) => p.test(path))) return 'asset';

  const ext = base.includes('.') ? base.split('.').pop()?.toLowerCase() : '';
  const codeExts = ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'rb', 'php', 'cs', 'vue', 'svelte'];
  if (ext && codeExts.includes(ext)) return 'source';

  return 'other';
}

export function annotateTree(nodes: import('../../src/types').TreeNode[]): import('../../src/types').TreeNode[] {
  return nodes.map((node) => ({
    ...node,
    fileClass: node.type === 'file' ? classifyFile(node.path) : undefined,
    children: node.children ? annotateTree(node.children) : undefined,
  }));
}

export function findImportantFiles(paths: string[]): string[] {
  const scored = paths.map((path) => {
    const cls = classifyFile(path);
    let score = 0;
    if (cls === 'entry') score += 10;
    if (cls === 'config') score += 6;
    if (path === 'package.json' || path === 'README.md') score += 15;
    if (path.endsWith('package.json')) score += 8;
    if (cls === 'test') score -= 2;
    if (cls === 'asset') score -= 5;
    const depth = path.split('/').length;
    if (depth <= 2) score += 3;
    return { path, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .filter((s) => s.score > 0)
    .map((s) => s.path);
}
