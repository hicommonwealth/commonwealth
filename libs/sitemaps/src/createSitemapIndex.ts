import { createBuffer } from './createBuffer';

/**
 */
export function createSitemapIndex(links: ReadonlyArray<string>): string {
  const buff = createBuffer();

  buff.append('<?xml version="1.0" encoding="UTF-8"?>\n');
  buff.append(
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n',
  );

  for (const link of links) {
    buff.append('<sitemap>\n');
    // loc, changefreq, priority, lastmod
    buff.append(`<loc>${link}</loc>\n`);
    buff.append('</sitemap>\n');
  }

  buff.append('</sitemapindex>\n');

  return buff.toString();
}
