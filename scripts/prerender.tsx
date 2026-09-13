import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { Providers } from '../src/app/providers';
import { HomePage } from '../src/pages/HomePage';
import { PrivacyPage } from '../src/pages/PrivacyPage';
import { TermsPage } from '../src/pages/TermsPage';
import { NotFoundPage } from '../src/pages/NotFoundPage';
import { pageMetadata } from '../src/lib/page-metadata';

const shell = await Bun.file('dist/index.html').text();
if (!shell.includes('<div id="root"></div>')) throw new Error('Prerender root marker missing');
const appHtml = shell
  .replace(/<link rel="canonical"[^>]*>/, '')
  .replace(/<meta property="og:url"[^>]*>/, '')
  .replace(/<title>[^<]*<\/title>/, '<title>gitSdm — Repository Explorer</title>');
await Bun.write('dist/app.html', appHtml);
for (const [route, file, page] of [
  ['/', 'dist/index.html', <HomePage />],
  ['/privacy', 'dist/privacy.html', <PrivacyPage />],
  ['/terms', 'dist/terms.html', <TermsPage />],
  ['/not-found', 'dist/404.html', <NotFoundPage />],
] as const) {
  const meta = pageMetadata(route);
  const content = renderToStaticMarkup(
    <StaticRouter location={route}>
      <Providers>{page}</Providers>
    </StaticRouter>,
  );
  let html = shell
    .replace('<div id="root"></div>', `<div id="root">${content}</div>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
    .replace(/<link rel="canonical"[^>]*>/, meta.canonical ? `<link rel="canonical" href="${meta.canonical}" />` : '')
    .replace('</head>', `<meta name="robots" content="${meta.robots}" /></head>`);
  for (const [attribute, name, value] of [
    ['name', 'description', meta.description],
    ['property', 'og:title', meta.title],
    ['property', 'og:description', meta.description],
    ['property', 'og:url', `https://gsdm.site${route}`],
    ['name', 'twitter:title', meta.title],
    ['name', 'twitter:description', meta.description],
  ])
    html = html.replace(
      new RegExp(`<meta ${attribute}="${name}"[^>]*>`),
      `<meta ${attribute}="${name}" content="${value}" />`,
    );
  await Bun.write(file, html);
}
