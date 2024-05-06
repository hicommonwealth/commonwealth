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

    const children: SitemapFile[] = [];
    for (const paginator of paginators) {
      console.log('Working with paginator...');

      while (await paginator.hasNext()) {
        const page = await paginator.next();

        if (page.links.length === 0) {
          continue;
        }

        console.log('Processing N links: ' + page.links.length);
        const sitemap = createSitemap(page.links);
        const sitemapPath = `sitemap-${idx++}.xml`;
        const res = await writer.write(sitemapPath, sitemap);
        console.log('Wrote sitemap: ' + sitemapPath);
        children.push({ location: res.location });
      }
    }

    async function writeIndex() {
      const index = createSitemapIndex(
        children.map((current) => current.location),
      );
      const idx_path = `sitemap-index.xml`;
      const res = await writer.write(idx_path, index);
      console.log('Wrote sitemap index ' + idx_path);
      return { location: res.location };
    }

    const index = await writeIndex();

    return { index, children };
  }

  return { exec };
}
