import { useEffect } from 'react';
import { pageMetadata } from '@/lib/page-metadata';

export function PageMetadata({ path }: { path: string }) {
  useEffect(() => {
    const meta = pageMetadata(path);
    document.title = meta.title;
    for (const [attribute, name, value] of [
      ['name', 'description', meta.description],
      ['name', 'robots', meta.robots],
      ['property', 'og:title', meta.title],
      ['property', 'og:description', meta.description],
      ['property', 'og:url', new URL(path, 'https://gsdm.site').href],
      ['name', 'twitter:title', meta.title],
      ['name', 'twitter:description', meta.description],
    ]) {
      const element =
        document.head.querySelector(`meta[${attribute}="${name}"]`) ??
        document.head.appendChild(document.createElement('meta'));
      element.setAttribute(attribute, name);
      element.setAttribute('content', value);
    }
    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (!meta.canonical) canonical?.remove();
    else {
      const link = canonical ?? document.head.appendChild(document.createElement('link'));
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', meta.canonical);
    }
  }, [path]);
  return null;
}
