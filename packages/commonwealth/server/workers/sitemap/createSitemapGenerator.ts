import { AsyncWriter } from './createAsyncWriter';
import { Paginator } from './createPaginator';
import { createSitemap } from './createSitemap';

export interface SitemapFile {
  readonly location: string;
}

export interface SitemapGenerator {
  readonly exec: () => Promise<ReadonlyArray<SitemapFile>>;
}

export function createSitemapGenerator(
  writer: AsyncWriter,
  paginator: Paginator,
): SitemapGenerator {
  async function exec() {
    let idx = 0;

    let written = [];

    while (await paginator.hasNext()) {
      const page = await paginator.next();
      const sitemap = createSitemap(page.links);
      const res = await writer.write(`sitemap-${idx++}.xml`, sitemap);
      written.push({ location: res.location });
    }

    return written;
  }

  return { exec };
}
