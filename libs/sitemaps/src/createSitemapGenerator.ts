import { blobStorage, logger } from '@hicommonwealth/core';
import { Paginator } from './createDatabasePaginator';
import { createSitemap } from './createSitemap';
import { createSitemapIndex } from './createSitemapIndex';
import { rewriteURL } from './rewriteURL';

const log = logger(import.meta);

export interface SitemapFile {
  readonly location: string;
}

export interface SitemapManifest {
  readonly index: SitemapFile;
  readonly children: ReadonlyArray<SitemapFile>;
}

export interface SitemapGenerator {
  readonly exec: () => Promise<SitemapManifest>;
}

export function createSitemapGenerator(
  paginators: ReadonlyArray<Paginator>,
  hostname: string | undefined,
): SitemapGenerator {
  async function exec(): Promise<SitemapManifest> {
    let idx = 0;

    const children: SitemapFile[] = [];
    for (const paginator of paginators) {
      log.info('Working with paginator...');

      while (await paginator.hasNext()) {
        const page = await paginator.next();

        if (page.links.length === 0) {
          continue;
        }

        log.info('Processing N links: ' + page.links.length);
        const sitemap = createSitemap(page.links);
        const sitemapPath = `sitemap-${idx++}.xml`;
        const res = await blobStorage().upload({
          key: sitemapPath,
          bucket: 'sitemap',
          content: sitemap,
          contentType: 'text/xml; charset=utf-8',
        });

        const url = rewriteURL(res.url, hostname);

        log.info(`Wrote sitemap: ${sitemapPath} to location ${url}`);
        children.push({ location: url });
      }
    }

    async function writeIndex() {
      const index = createSitemapIndex(
        children.map((current) => current.location),
      );
      const idx_path = `sitemap-index.xml`;
      const res = await blobStorage().upload({
        key: idx_path,
        bucket: 'sitemap',
        content: index,
        contentType: 'text/xml; charset=utf-8',
      });
      log.info(`Wrote sitemap index ${idx_path} at location: ${res.location}`);
      return { location: res.location };
    }

    const index = await writeIndex();

    return { index, children };
  }

  return { exec };
}
