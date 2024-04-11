import { models } from '@hicommonwealth/model';
import { expect } from 'chai';
import { createAsyncWriterS3 } from './createAsyncWriter';
import { createDatabasePaginatorDefault } from './createDatabasePaginator';
import { createSitemapGenerator } from './createSitemapGenerator';

describe('createSitemapGenerator', function () {
  it('basic', async () => {
    const community = await models.Community.create({ id: '1', name: 'Acme' });

    expect(community.id).to.not.equal(null);

    const nrPosts = 50;

    for (let i = 0; i < nrPosts; ++i) {
      const now = new Date();

      await models.Thread.create({
        title: 'Post ' + i,
        community_id: community.id,
        kind: 'unknown',
        created_at: now,
        updated_at: now,
      });
    }

    const writer = createAsyncWriterS3();
    const paginator = createDatabasePaginatorDefault(20);

    const sitemapGenerator = createSitemapGenerator(writer, paginator);

    const written = await sitemapGenerator.exec();

    expect(written.children.length).to.equal(4);
  });
});
