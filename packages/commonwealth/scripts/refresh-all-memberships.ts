import Bluebird from 'bluebird';
import { TokenBalanceCache } from '../../token-balance-cache/src';
import { ServerCommunitiesController } from '../server/controllers/server_communities_controller';
import { ServerGroupsController } from '../server/controllers/server_groups_controller';
import db from '../server/database';
import BanCache from '../server/util/banCheckCache';

async function main() {
  const models = db;
  const tokenBalanceCache = new TokenBalanceCache();
  await tokenBalanceCache.initBalanceProviders();
  const banCache = new BanCache(models);

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

  await Bluebird.map(
    communitiesResult,
    async ({ community }) => {
      await groupsController.refreshCommunityMemberships({
        community,
      });
    },
    { concurrency: 10 }, // limit concurrency
  );

  console.log(`done- refreshed ${communitiesResult.length} communities`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
