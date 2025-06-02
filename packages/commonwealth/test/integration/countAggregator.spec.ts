import { RedisCache } from '@hicommonwealth/adapters';
import { cache, CacheNamespaces, dispose } from '@hicommonwealth/core';
import {
  CommunityInstance,
  type DB,
  tester,
  ThreadInstance,
} from '@hicommonwealth/model';
import { CountAggregatorKeys } from '@hicommonwealth/shared';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { countAggregator } from '../../server/workers/graphileWorker/tasks/countAggregator';

chai.use(chaiHttp);

async function clearCountAggregatorCache() {
  await cache().deleteKey(
    CacheNamespaces.CountAggregator,
    CountAggregatorKeys.ThreadViewCount,
  );
  await cache().deleteKey(
    CacheNamespaces.CountAggregator,
    CountAggregatorKeys.CommunityThreadCount,
  );
  await cache().deleteKey(
    CacheNamespaces.CountAggregator,
    CountAggregatorKeys.CommunityProfileCount,
  );
}

describe('Count Aggregator Tests', () => {
  let models: DB;
  let community: CommunityInstance;
  let originalThreadCount: number;
  let originalProfileCount: number;
  let thread: ThreadInstance;

  beforeAll(async () => {
    cache({
      adapter: new RedisCache('redis://localhost:6379'),
    });
    models = await tester.seedDb();
    thread = await models.Thread.create({
      community_id: 'ethereum',
      title: '',
      body: '',
      kind: 'discussion',
      topic_id: 1,
      search: '',
      address_id: 1,
      view_count: 0,
    });
    community = (await models.Community.findOne({
      where: {
        id: 'ethereum',
      },
    }))!;
    console.log(
      `Start counts: thread = ${community.lifetime_thread_count}, profile = ${community.profile_count}`,
    );
    originalThreadCount = community.lifetime_thread_count!;
    originalProfileCount = community.profile_count!;
    await cache().ready();
    await clearCountAggregatorCache();
  });

  afterAll(async () => {
    await dispose()();
    await clearCountAggregatorCache();
  });

  describe('Tests the count aggregator', () => {
    test('it shouldnt do anything when redis is empty', async () => {
      await countAggregator();
      expect(thread.view_count).to.equal(0);
      expect(thread.reaction_count).to.equal(0);
    });

    test('it updates counts when redis updates', async () => {
      const [user] = await tester.seed('User', {});
      await tester.seed('Address', {
        user_id: user!.id,
        verified: new Date(),
        community_id: 'ethereum',
      });
      await cache().addToSet(
        CacheNamespaces.CountAggregator,
        CountAggregatorKeys.CommunityThreadCount,
        'ethereum',
      );
      await cache().addToSet(
        CacheNamespaces.CountAggregator,
        CountAggregatorKeys.CommunityProfileCount,
        'ethereum',
      );
      await cache().incrementHashKey(
        CacheNamespaces.CountAggregator,
        CountAggregatorKeys.ThreadViewCount,
        thread!.id!.toString(),
        5,
      );
      await cache().incrementHashKey(
        CacheNamespaces.CountAggregator,
        CountAggregatorKeys.ThreadViewCount,
        thread!.id!.toString(),
        10,
      );
      await countAggregator();
      await community.reload();
      await createReaction(models);

      expect(community.lifetime_thread_count).to.equal(originalThreadCount + 1);
      expect(community.profile_count).to.equal(originalProfileCount + 1);

      await thread.reload();
      expect(thread!.view_count).to.equal(15);
      expect(thread!.reaction_count).to.equal(1);

      const profileChangedSet = await cache().getSet(
        CacheNamespaces.CountAggregator,
        CountAggregatorKeys.CommunityProfileCount,
      );
      expect(profileChangedSet.length).to.equal(0);

      const threadChangedSet = await cache().getSet(
        CacheNamespaces.CountAggregator,
        CountAggregatorKeys.CommunityThreadCount,
      );
      expect(threadChangedSet.length).to.equal(0);

      const viewCountsHash = await cache().getHash(
        CacheNamespaces.CountAggregator,
        CountAggregatorKeys.ThreadViewCount,
      );
      expect(Object.keys(viewCountsHash).length).to.equal(0);
    });
  });
});

async function createReaction(models: DB) {
  await models.Reaction.create({
    thread_id: 1,
    reaction: 'like',
    address_id: 1,
  });
}
