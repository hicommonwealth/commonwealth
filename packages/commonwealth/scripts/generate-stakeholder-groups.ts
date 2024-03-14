import { RedisCache } from '@hicommonwealth/adapters';
import { cache } from '@hicommonwealth/core';
import { UserInstance, models } from '@hicommonwealth/model';
import * as dotenv from 'dotenv';
import { REDIS_URL } from '../server/config';
import { ServerCommunitiesController } from '../server/controllers/server_communities_controller';
import { ServerGroupsController } from '../server/controllers/server_groups_controller';
import BanCache from '../server/util/banCheckCache';

dotenv.config();

async function main() {
  cache(new RedisCache(REDIS_URL));

  const banCache = new BanCache(models);

  const communitiesController = new ServerCommunitiesController(
    models,
    banCache,
  );

  const groupsController = new ServerGroupsController(models, banCache);

  const communitiesResult = await communitiesController.getCommunities({
    includeStakes: true,
  });

  // generate stakeholder group for each staked community
  for (const { community } of communitiesResult) {
    if (process.env.COMMUNITY_ID && process.env.COMMUNITY_ID !== community.id)
      continue;
    if (community.CommunityStakes.length > 0) {
      const [stakeholderGroups, created] =
        await groupsController.generateStakeholderGroups({
          user: { isAdmin: true } as UserInstance,
          community,
        });
      if (created) {
        console.log(
          `created ${stakeholderGroups.length} stakeholder groups for ${community.id} – refreshing memberships...`,
        );
        await groupsController.refreshCommunityMemberships({
          communityId: community.id,
        });
      } else {
        console.log(
          `stakeholder groups (${stakeholderGroups.length}) already exist for ${community.id}`,
        );
      }
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
