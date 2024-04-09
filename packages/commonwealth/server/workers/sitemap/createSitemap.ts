import { Link } from './createPaginator';

function createBuffer() {
  let buff = '';

  function append(data: string) {
    buff += data;
  }

  function toString() {
    return buff;
  }

  return { append, toString };
}

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
