import { createAsyncWriter } from './createAsyncWriter';
import { createPaginatorMock } from './createPaginator';
import { createSitemapGenerator } from './createSitemapGenerator';

describe('createSitemapGenerator', function () {
  it('basic', async () => {
    const writer = createAsyncWriter('mock');
    const paginator = createPaginatorMock(10, 50000);

    const sitemapGenerator = createSitemapGenerator(writer, paginator);

    await sitemapGenerator.exec();
  });
});
