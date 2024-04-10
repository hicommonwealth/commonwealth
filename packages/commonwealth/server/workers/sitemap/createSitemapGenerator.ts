import { AsyncWriter } from './createAsyncWriter';
import { Paginator } from './createPaginator';
import { createSitemap } from './createSitemap';

export interface SitemapGenerator {
  readonly exec: () => Promise<void>;
}

export function createSitemapGenerator(
  writer: AsyncWriter,
  paginator: Paginator,
): SitemapGenerator {
  async function exec() {
    let idx = 0;
    while (await paginator.hasNext()) {
      const page = await paginator.next();
      const sitemap = createSitemap(page.links);
      await writer.write(`sitemap-${idx++}.xml`, sitemap);
    }
  }

  return { exec };
}
