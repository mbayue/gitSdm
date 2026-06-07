/** File extensions eligible for semantic indexing. */
export const SUPPORTED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.kt',
  '.c', '.cpp', '.h', '.hpp', '.cs',
  '.vue', '.svelte', '.astro',
  '.json', '.yaml', '.yml', '.toml',
  '.md', '.mdx',
  '.sql', '.graphql', '.gql',
  '.sh', '.bash', '.zsh',
  '.dockerfile', '.tf', '.hcl',
]);

/** Embedding dimension – configurable via EMBEDDING_DIMENSIONS env var.
 *  text-embedding-3-large native = 3072; Gemini/mock use this value. */
export const EMBEDDING_DIMENSIONS = parseInt(process.env.EMBEDDING_DIMENSIONS ?? '3072', 10);

/** Maximum tokens per chunk. */
export const MAX_CHUNK_TOKENS = 512;

/** Default maximum search results returned. */
export const DEFAULT_TOP_K = 10;

/** Minimum cosine similarity score for a result to be included. */
export const DEFAULT_MIN_SCORE = 0.3;

/** Maximum number of search results cached per repository. */
export const MAX_SEARCH_CACHE_PER_REPO = 100;

/** Search cache TTL in ms (60 minutes). */
export const SEARCH_CACHE_TTL_MS = 60 * 60 * 1000;

/** Index cache TTL in ms (2 hours). */
export const INDEX_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

/** Maximum index cache entries. */
export const MAX_INDEX_CACHE_ENTRIES = 50;

/** Languages with AST-aware chunking support. */
export const AST_SUPPORTED_LANGUAGES = new Set([
  'typescript', 'tsx', 'javascript', 'jsx', 'python',
]);

/** Map file extension to a language identifier. */
export function extToLanguage(ext: string): string {
  const map: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'tsx',
    '.js': 'javascript', '.jsx': 'jsx',
    '.mjs': 'javascript', '.cjs': 'javascript',
    '.py': 'python', '.rb': 'ruby',
    '.go': 'go', '.rs': 'rust',
    '.java': 'java', '.kt': 'kotlin',
    '.c': 'c', '.cpp': 'cpp',
    '.h': 'c', '.hpp': 'cpp',
    '.cs': 'csharp',
    '.vue': 'vue', '.svelte': 'svelte', '.astro': 'astro',
    '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml', '.toml': 'toml',
    '.md': 'markdown', '.mdx': 'mdx',
    '.sql': 'sql', '.graphql': 'graphql', '.gql': 'graphql',
    '.sh': 'shell', '.bash': 'shell', '.zsh': 'shell',
    '.dockerfile': 'dockerfile', '.tf': 'terraform', '.hcl': 'hcl',
  };
  return map[ext] ?? 'text';
}

/** Build a search cache key. */
export function searchCacheKey(
  owner: string,
  repo: string,
  sha: string,
  queryHash: string,
): string {
  return `search:${owner}/${repo}@${sha}:${queryHash}`;
}

/** Build an index cache key. */
export function indexCacheKey(
  owner: string,
  repo: string,
  sha: string,
): string {
  return `index:${owner}/${repo}@${sha}`;
}
