import { createBuffer } from './createBuffer';
import { Link } from './createDatabasePaginator';

/**
 * Creates a sitemap XML string based on the provided links array.
 *
 * @param {ReadonlyArray<Link>} links - The array of links.
 * @returns {string} - The sitemap XML string.
 */
export function createSitemap(links: ReadonlyArray<Link>): string {
  const buff = createBuffer();

  buff.append('<?xml version="1.0" encoding="UTF-8"?>\n');
  buff.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');

  for (const link of links) {
    buff.append('<url>\n');
    // loc, changefreq, priority, lastmod
    buff.append(`<loc>${link.url}</loc>\n`);
    buff.append(`<lastmod>${link.updated_at}</lastmod>\n`);
    buff.append('</url>\n');
  }

  buff.append('</urlset>\n');

  return buff.toString();
}
