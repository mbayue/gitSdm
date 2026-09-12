export function pageMetadata(path: string) {
  const privacy = /^\/privacy\/?$/.test(path);
  const terms = /^\/terms\/?$/.test(path);
  const valid =
    path === '/' ||
    privacy ||
    terms ||
    /^\/(?!api\/|assets\/)[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9_.-]{1,100}(?:\/search)?\/?$/.test(path);
  return {
    title: privacy
      ? 'Privacy policy — gitSdm'
      : terms
        ? 'Terms of use — gitSdm'
        : valid
          ? 'gitSdmᵝ — Git Software Dependency Map'
          : 'Page not found — gitSdm',
    description: privacy
      ? 'How gitSdm stores settings, sends repository content to providers, and handles caches and logs.'
      : terms
        ? 'Rules for using gitSdm, including commercial use, automation, repository content, and service limits.'
        : valid
          ? 'Interactive dependency visualization for exploring repository files, modules, and architecture.'
          : 'This page could not be found. Return to gitSdm to explore a repository.',
    canonical:
      path === '/'
        ? 'https://gsdm.site/'
        : privacy
          ? 'https://gsdm.site/privacy'
          : terms
            ? 'https://gsdm.site/terms'
            : undefined,
    robots: valid ? 'index, follow' : 'noindex',
  };
}
