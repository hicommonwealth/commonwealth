import { RedisCache } from '@hicommonwealth/adapters';
import { cache } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { config } from '../server/config';
import { ServerCommunitiesController } from '../server/controllers/server_communities_controller';
import { ServerGroupsController } from '../server/controllers/server_groups_controller';
import BanCache from '../server/util/banCheckCache';

async function main() {
  config.CACHE.REDIS_URL && cache(new RedisCache(config.CACHE.REDIS_URL));

  const banCache = new BanCache(models);

  const communitiesController = new ServerCommunitiesController(
    models,
    banCache,
  );

  const groupsController = new ServerGroupsController(models, banCache);

  const communitiesResult = await communitiesController.getCommunities({
    hasGroups: true,
  });

  for (const { community } of communitiesResult) {
    if (process.env.COMMUNITY_ID && process.env.COMMUNITY_ID !== community.id)
      continue;
    await groupsController.refreshCommunityMemberships({
      communityId: community.id,
    });
  }

  console.log(`done- refreshed ${communitiesResult.length} communities`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
