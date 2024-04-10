import { createAsyncWriter } from './createAsyncWriter';
import { createPaginatorMock } from './createPaginator';

export interface SitemapGenerator {
  readonly exec: () => Promise<void>;
}

export function createSitemapGenerator() {
  const writer = createAsyncWriter('mock');
  const paginator = createPaginatorMock(10, 50000);

  async function exec() {
    while (await paginator.hasNext()) {
      const page = await paginator.next();
    }
  }
}
