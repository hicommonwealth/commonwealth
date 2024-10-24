import { dispose } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';
import { expect } from 'chai';
import { afterAll, beforeAll, describe, test } from 'vitest';
import {
  createDatabasePaginatorDefault,
  createSitemapGenerator,
} from '../../src';

describe('createSitemapGenerator', { timeout: 10_000 }, function () {
  beforeAll(async () => {
    const [user] = await tester.seed('User', {
      isAdmin: true,
    });

    if (!user) {
      throw new Error('No user');
    }

    const [node] = await tester.seed('ChainNode', {});

    if (!node) {
      throw new Error('No node');
    }

    const [community] = await tester.seed('Community', {
      name: 'Acme',
      chain_node_id: node.id,
      lifetime_thread_count: 0,
      profile_count: 0,
    });

    if (!community) {
      throw new Error('No community');
    }

    const [address] = await tester.seed('Address', {
      address: '0x0000',
      community_id: community.id,
      user_id: user.id,
    });

    if (!address) {
      throw new Error('No address');
    }

    const [topic] = await tester.seed('Topic', {
      community_id: community.id,
    });

    if (!topic) {
      throw new Error('No address');
    }

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
        canvas_signed_data: '',
        canvas_msg_id: '',
        reaction_count: 0,
        reaction_weights_sum: '0',
        comment_count: 0,
        profile_name: 'foobar',
        topic_id: topic.id,
      });
    }
  });

  afterAll(async () => {
    await dispose()();
  });

  test.skip('basic', async () => {
    const paginator = createDatabasePaginatorDefault(50);
    const sitemapGenerator = createSitemapGenerator([
      paginator.threads,
      paginator.profiles,
    ]);

    const written = await sitemapGenerator.exec();
    expect(written.children.length).to.equal(2);
  });
});
