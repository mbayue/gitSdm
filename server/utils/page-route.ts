/** Valid SPA paths; repository existence is resolved by the repository API. */
export function isRepositoryPage(path: string): boolean {
  return /^\/(?!api\/|assets\/)[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9_.-]{1,100}(?:\/search)?\/?$/.test(path);
}
