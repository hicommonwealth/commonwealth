// backfills all clanker tokens

import { logger } from '@hicommonwealth/core';
import {
  config,
  createCommunityFromClankerToken,
  models,
  paginateClankerTokens,
} from '@hicommonwealth/model';
import { exit } from 'process';
import { Op } from 'sequelize';

const log = logger(import.meta);

async function main() {
  await models.CommunityIndexer.update(
    {
      last_checked: new Date(),
    },
    {
      where: {
        id: 'clanker',
      },
    },
  );

  let numTokensFound = 0;
  let numCommunitiesCreated = 0;

  for await (const tokens of paginateClankerTokens(new Date(0))) {
    numTokensFound += tokens.length;

    const existingCommunities = await models.Community.findAll({
      where: {
        token_address: {
          [Op.in]: tokens.map((t) => t.contract_address),
        },
      },
    });

    for (const token of tokens) {
      const existingCommunity = existingCommunities.find(
        (c) => c.token_address === token.contract_address,
      );
      if (existingCommunity) {
        log.warn(
          `token already has community: ${token.contract_address}="${existingCommunity.name}"`,
        );
      } else {
        await createCommunityFromClankerToken(token);
        numCommunitiesCreated++;
      }
    }

    const max = config.COMMUNITY_INDEXER.MAX_CLANKER_BACKFILL!;
    if (max > 0 && numTokensFound >= max) {
      log.info(`reached limit of ${max} clanker communities created`);
      break;
    }
  }

  log.info(`found ${numTokensFound} tokens`);
  log.info(`created ${numCommunitiesCreated} clanker communities`);
}

main().catch((err) => {
  console.error(err);
  exit(1);
});
