import Bluebird from 'bluebird';
import { RedisCache } from '../../common-common/src/redisCache';
import { TokenBalanceCache as TokenBalanceCacheV1 } from '../../token-balance-cache/src';
import { REDIS_URL } from '../server/config';
import { ServerCommunitiesController } from '../server/controllers/server_communities_controller';
import { ServerGroupsController } from '../server/controllers/server_groups_controller';
import db from '../server/database';
import BanCache from '../server/util/banCheckCache';
import { TokenBalanceCache as TokenBalanceCacheV2 } from '../server/util/tokenBalanceCache/tokenBalanceCache';

async function main() {
  const models = db;
  const redisCache = new RedisCache();
  await redisCache.init(REDIS_URL);
  const banCache = new BanCache(models);

  const tokenBalanceCacheV1 = new TokenBalanceCacheV1();
  await tokenBalanceCacheV1.initBalanceProviders();
  await tokenBalanceCacheV1.start();

  const tokenBalanceCacheV2 = new TokenBalanceCacheV2(models, redisCache);

  const communitiesController = new ServerCommunitiesController(
    models,
    tokenBalanceCacheV1,
    banCache,
  );

  const groupsController = new ServerGroupsController(
    models,
    tokenBalanceCacheV2,
    banCache,
  );

  const communitiesResult = await communitiesController.getCommunities({
    hasGroups: true,
  });

  await Bluebird.map(
    communitiesResult,
    async ({ community }) => {
      await groupsController.refreshCommunityMemberships({
        community,
      });
    },
    { concurrency: 1 }, // limit concurrency
  );

  console.log(`done- refreshed ${communitiesResult.length} communities`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
