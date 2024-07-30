import { logger } from '@hicommonwealth/core';
import { fileURLToPath } from 'url';
import { AsyncWriter } from './createAsyncWriter';
import { Paginator } from './createDatabasePaginator';
import { createSitemap } from './createSitemap';
import { createSitemapIndex } from './createSitemapIndex';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

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
  writer: AsyncWriter,
  paginators: ReadonlyArray<Paginator>,
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
        const res = await writer.write(sitemapPath, sitemap);
        const url = new URL(res.location);
        const location = 'https://' + url.hostname + '/' + sitemapPath;
        log.info(`Wrote sitemap: ${sitemapPath} to location ${location}`);
        children.push({ location });
      }
    }

    async function writeIndex() {
      const index = createSitemapIndex(
        children.map((current) => current.location),
      );
      const idx_path = `sitemap-index.xml`;
      const res = await writer.write(idx_path, index);
      log.info(`Wrote sitemap index ${idx_path} at location: ${res.location}`);
      return { location: res.location };
    }

    const index = await writeIndex();

    return { index, children };
  }

  return { exec };
}
