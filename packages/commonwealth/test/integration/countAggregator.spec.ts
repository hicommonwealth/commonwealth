import { RedisCache } from '@hicommonwealth/adapters';
import {
  cache,
  CacheNamespaces,
  dispose,
  disposeAdapter,
} from '@hicommonwealth/core';
import { tester, type DB } from '@hicommonwealth/model';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { main } from '../../server/util/countAggregator';

chai.use(chaiHttp);

describe('DatabaseCleaner Tests', () => {
  let models: DB;

  beforeAll(async () => {
    models = await tester.seedDb();
    await models.Thread.create({
      community_id: 'ethereum',
      title: '',
      body: '',
      kind: 'discussion',
      topic_id: 1,
      search: '',
      address_id: 1,
      view_count: 0,
    });

    disposeAdapter(cache().name);
    cache({
      adapter: new RedisCache('redis://localhost:6379'),
    });
    await cache().ready();
    await cache().deleteNamespaceKeys(
      CacheNamespaces.Community_Thread_Count_Changed,
    );
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('Tests the count aggregator', () => {
    test('it shouldnt do anything when redis is empty', async () => {
      await main();
      const thread = await models.Thread.findOne({
        where: { id: 1 },
      });
      expect(thread?.view_count).to.equal(0);
      expect(thread?.reaction_count).to.equal(0);
    });

    test('it updates counts when redis updates', async () => {
      let thread = await models.Thread.findOne({
        where: { id: 1 },
      });
      await cache().setKey(
        CacheNamespaces.Community_Thread_Count_Changed,
        'ethereum',
        'true',
      );
      await cache().setKey(
        CacheNamespaces.Community_Profile_Count_Changed,
        'ethereum',
        'true',
      );
      await cache().setKey(
        CacheNamespaces.Thread_View_Count,
        thread!.id!.toString(),
        '5',
      );
      await main();
      const community = await models.Community.findOne({
        where: { id: 'ethereum' },
      });

      expect(community?.lifetime_thread_count).to.equal(1);
      expect(community?.profile_count).to.equal(2); // these 2 come from seedDB
      thread = await models.Thread.findOne({
        where: { community_id: 'ethereum' },
      });
      expect(thread!.view_count).to.equal(5);
    });
  });
});
