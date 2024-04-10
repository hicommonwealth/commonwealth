import { models } from '@hicommonwealth/model';
import { expect } from 'chai';
import { createAsyncWriterS3 } from './createAsyncWriter';
import { createPaginatorDefault } from './createPaginator';
import { createSitemapGenerator } from './createSitemapGenerator';

describe('createSitemapGenerator', function () {
  it('basic', async () => {
    const community = await models.Community.create({ id: '1', name: 'Acme' });

    expect(community.id).to.not.equal(null);

    const now = new Date();
    const t = await models.Thread.create({
      title: 'First post',
      community_id: community.id,
      kind: 'unknown',
      created_at: now,
      updated_at: now,
    });

    // const writer = createAsyncWriterMock();
    const writer = createAsyncWriterS3();
    //const paginator = createPaginatorMock(10, 50000);
    const paginator = createPaginatorDefault();

    const sitemapGenerator = createSitemapGenerator(writer, paginator);

    const written = await sitemapGenerator.exec();

    console.log(written);

    // expect(Object.keys(writer.written).length).to.equal(1);
    // expect(Object.keys(writer.written)).to.contain('sitemap-0.xml');
    //
    // console.log(writer.written)
  });
});
