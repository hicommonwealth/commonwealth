import { AsyncWriter } from './createAsyncWriter';
import { Paginator } from './createDatabasePaginator';
import { createSitemap } from './createSitemap';
import { createSitemapIndex } from './createSitemapIndex';

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

    const children = [];
    for (const paginator of paginators) {
      while (await paginator.hasNext()) {
        const page = await paginator.next();
        const sitemap = createSitemap(page.links);
        const res = await writer.write(`sitemap-${idx++}.xml`, sitemap);
        children.push({ location: res.location });
      }
    }

    async function writeIndex() {
      const index = createSitemapIndex(
        children.map((current) => current.location),
      );
      const res = await writer.write(`sitemap-index.xml`, index);
      return { location: res.location };
    }

    const index = await writeIndex();

    return { index, children };
  }

  return { exec };
}
