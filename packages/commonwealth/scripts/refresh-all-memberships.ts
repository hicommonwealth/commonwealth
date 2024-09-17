import { RedisCache } from '@hicommonwealth/adapters';
import { cache, dispose, logger, query } from '@hicommonwealth/core';
import { Community, models } from '@hicommonwealth/model';
import { config } from '../server/config';
import { ServerGroupsController } from '../server/controllers/server_groups_controller';

const log = logger(import.meta);

async function main() {
  config.CACHE.REDIS_URL &&
    cache({
      adapter: new RedisCache(config.CACHE.REDIS_URL),
    });

  const groupsController = new ServerGroupsController(models);

  // fetch all communities via pagination
  const limit = 50;
  let cursor = 1;
  const communitiesResult = await query(Community.GetCommunities(), {
    // no need for an actor, but argument is mandatory
    actor: { user: { email: '' } },
    payload: { has_groups: true, cursor, limit },
  });
  const totalPages = communitiesResult!.totalPages;
  const communities = communitiesResult!.results;
  while (cursor < totalPages) {
    cursor += 1;
    const cr = await query(Community.GetCommunities(), {
      actor: { user: { email: '' } },
      payload: { has_groups: true, cursor, limit },
    });
    communities.push(...cr!.results);
  }

  // refresh memberships on all fetched communities
  for (const community of communities) {
    if (process.env.COMMUNITY_ID && process.env.COMMUNITY_ID !== community.id)
      continue;
    await groupsController.refreshCommunityMemberships({
      communityId: community.id,
    });
  }

  log.info(
    `done- refreshed ${
      process.env.COMMUNITY_ID ? 1 : communities.length
    } communities`,
  );
}

main()
  .then(
    async () =>
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      await dispose()('EXIT', true),
  )
  .catch((err) => {
    log.error('Failed to refresh all membership', err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('ERROR', true);
  });
