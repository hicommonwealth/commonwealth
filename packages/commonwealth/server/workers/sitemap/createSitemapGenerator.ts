import { createAsyncWriter } from './createAsyncWriter';
import { createPaginator } from './createPaginator';

export interface SitemapGenerator {
  readonly exec: () => Promise<void>;
}

export function createSitemapGenerator() {
  const writer = createAsyncWriter('mock');
  const paginator = createPaginator('mock');

  async function exec() {
    while (await paginator.hasNext()) {
      const page = await paginator.next();
    }
  }
}
