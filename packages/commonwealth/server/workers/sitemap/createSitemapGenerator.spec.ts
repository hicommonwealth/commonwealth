import { models } from '@hicommonwealth/model';
import { expect } from 'chai';
import { createAsyncWriterMock } from './createAsyncWriter';
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

    const writer = createAsyncWriterMock();
    const paginator = createDatabasePaginatorDefault(50);

    const sitemapGenerator = createSitemapGenerator(writer, [
      paginator.threads,
      paginator.profiles,
    ]);

    const written = await sitemapGenerator.exec();
    expect(written.children.length).to.equal(3);
  });
});
