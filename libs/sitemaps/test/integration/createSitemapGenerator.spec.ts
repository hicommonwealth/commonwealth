import { dispose } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';
import { expect } from 'chai';
import {
  createAsyncWriterMock,
  createDatabasePaginatorDefault,
  createSitemapGenerator,
} from '../../src';

describe('createSitemapGenerator', function () {
  this.timeout(10000);

  before(async () => {
    const [user] = await tester.seed('User', {
      isAdmin: true,
      selected_community_id: null,
    });

    const [node] = await tester.seed('ChainNode', { contracts: [] });

    const [community] = await tester.seed('Community', {
      name: 'Acme',
      chain_node_id: node.id,
      discord_config_id: null,
      Addresses: [],
      CommunityStakes: [],
    });

    const [address] = await tester.seed('Address', {
      address: '0x0000',
      community_id: community.id,
      user_id: user.id,
      profile_id: null,
    });

    const [topic] = await tester.seed('Topic', {
      community_id: community.id,
    });

    const nrPosts = 50;

    for (let i = 0; i < nrPosts; ++i) {
      const now = new Date();
      await tester.seed('Thread', {
        title: 'Post ' + i,
        community_id: community.id,
        address_id: address.id,
        kind: 'unknown',
        created_at: now,
        updated_at: now,
        view_count: 0,
        canvas_action: '',
        canvas_session: '',
        canvas_hash: '',
        reaction_count: 0,
        reaction_weights_sum: 0,
        comment_count: 0,
        profile_name: 'foobar',
        topic_id: topic.id,
      });
    }
  });

  after(async () => {
    await dispose()();
  });

  xit('basic', async () => {
    const writer = createAsyncWriterMock();
    const paginator = createDatabasePaginatorDefault(50);

    const sitemapGenerator = createSitemapGenerator(writer, [
      paginator.threads,
      paginator.profiles,
    ]);

    const written = await sitemapGenerator.exec();
    expect(written.children.length).to.equal(2);
  });
});
