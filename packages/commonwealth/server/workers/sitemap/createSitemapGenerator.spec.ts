import { expect } from 'chai';
import { createAsyncWriterMock } from './createAsyncWriter';
import { createPaginatorDefault } from './createPaginator';
import { createSitemapGenerator } from './createSitemapGenerator';

describe('createSitemapGenerator', function () {
  it('basic', async () => {
    const writer = createAsyncWriterMock();
    //const paginator = createPaginatorMock(10, 50000);
    const paginator = createPaginatorDefault();

    const sitemapGenerator = createSitemapGenerator(writer, paginator);

    await sitemapGenerator.exec();

    expect(Object.keys(writer.written).length).to.equal(1);
    expect(Object.keys(writer.written)).to.contain('sitemap-0.xml');
  });
});
