import { RedisCache } from '@hicommonwealth/adapters';
import { models } from '@hicommonwealth/model';
import * as dotenv from 'dotenv';
import { REDIS_URL } from '../server/config';
import { ServerCommunitiesController } from '../server/controllers/server_communities_controller';
import { ServerGroupsController } from '../server/controllers/server_groups_controller';
import BanCache from '../server/util/banCheckCache';
import { rollbar } from '../server/util/rollbar';
import { TokenBalanceCache } from '../server/util/tokenBalanceCache/tokenBalanceCache';

dotenv.config();

async function main() {
  const redisCache = new RedisCache(rollbar);
  await redisCache.init(REDIS_URL);
  const banCache = new BanCache(models);

  const tokenBalanceCache = new TokenBalanceCache(models, redisCache);

  const communitiesController = new ServerCommunitiesController(
    models,
    tokenBalanceCache,
    banCache,
  );

  const groupsController = new ServerGroupsController(
    models,
    tokenBalanceCache,
    banCache,
  );

  const communitiesResult = await communitiesController.getCommunities({
    hasGroups: true,
  });

  for (const { community } of communitiesResult) {
    if (process.env.COMMUNITY_ID && process.env.COMMUNITY_ID !== community.id)
      continue;
    await groupsController.refreshCommunityMemberships({
      community,
    });
  }

  console.log(`done- refreshed ${communitiesResult.length} communities`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
