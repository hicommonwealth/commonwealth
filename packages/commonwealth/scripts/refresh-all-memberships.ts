import { RedisCache } from '@hicommonwealth/adapters';
import { cache, command, dispose, logger, query } from '@hicommonwealth/core';
import { Community, models } from '@hicommonwealth/model';
import { config } from '../server/config';

const log = logger(import.meta);

async function main() {
  config.CACHE.REDIS_URL &&
    cache({
      adapter: new RedisCache(config.CACHE.REDIS_URL),
    });

  const actor = {
    address: 'system',
    user: {
      email: 'system',
    },
  };

  // fetch all communities via pagination
  const limit = 50;
  let cursor = 1;
  const communitiesResult = await query(Community.GetCommunities(), {
    // no need for an actor, but argument is mandatory
    actor,
    payload: { has_groups: true, cursor, limit },
  });
  const totalPages = communitiesResult!.totalPages;
  const communities = communitiesResult!.results;
  while (cursor < totalPages) {
    cursor += 1;
    const cr = await query(Community.GetCommunities(), {
      actor,
      payload: { has_groups: true, cursor, limit },
    });
    communities.push(...cr!.results);
  }

  // refresh memberships on all fetched communities
  for (const community of communities) {
    if (process.env.COMMUNITY_ID && process.env.COMMUNITY_ID !== community.id)
      continue;

    try {
      const admin = await models.Address.findOne({
        where: { community_id: community.id, role: 'admin' },
      });
      await command(Community.RefreshCommunityMemberships(), {
        actor: {
          address: admin?.address,
          user: { id: admin!.user_id!, email: 'system' },
        },
        payload: { community_id: community.id },
      });
    } catch (e) {
      log.error(
        `Couldn't refresh memberships for community ${community.id}`,
        e,
      );
    }
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
