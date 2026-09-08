import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { Providers } from '../src/app/providers';
import { HomePage } from '../src/pages/HomePage';
import { PrivacyPage } from '../src/pages/PrivacyPage';
import { NotFoundPage } from '../src/pages/NotFoundPage';

const shell = await Bun.file('dist/index.html').text();
if (!shell.includes('<div id="root"></div>')) throw new Error('Prerender root marker missing');
// Repository routes use a blank shell, never the homepage's SEO or content.
await Bun.write('dist/app.html', shell.replace(/<link rel="canonical"[^>]*>/, ''));
for (const [route, file, page] of [
  ['/', 'dist/index.html', <HomePage />],
  ['/privacy', 'dist/privacy.html', <PrivacyPage />],
] as const) {
  const content = renderToStaticMarkup(<StaticRouter location={route}><Providers>{page}</Providers></StaticRouter>);
  const html = shell.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
  await Bun.write(file, route === '/' ? html : html
    .replaceAll('"https://gsdm.site/"', '"https://gsdm.site/privacy"')
    .replace('<title>gitSdmᵝ — Git Software Dependency Map</title>', '<title>Privacy policy — gitSdm</title>'));
}
const notFound = renderToStaticMarkup(<StaticRouter location="/not-found"><Providers><NotFoundPage /></Providers></StaticRouter>);
await Bun.write('dist/404.html', shell
  .replace('<div id="root"></div>', `<div id="root">${notFound}</div>`)
  .replace('<title>gitSdmᵝ — Git Software Dependency Map</title>', '<title>Page not found — gitSdm</title>')
  .replace(/<link rel="canonical"[^>]*>/, '<meta name="robots" content="noindex" />'));
