// backfills all clanker tokens

import { S3BlobStorage } from '@hicommonwealth/adapters';
import { blobStorage, logger } from '@hicommonwealth/core';
import {
  config,
  createCommunityFromClankerToken,
  models,
  paginateClankerTokens,
} from '@hicommonwealth/model';
import { exit } from 'process';
import { Op } from 'sequelize';

const log = logger(import.meta);

blobStorage({
  adapter: S3BlobStorage(),
});

/*
  This script fetches *all* tokens from the clanker API and
  directly creates a community for each, skipping the outbox.
  It starts from oldest token to newest so that the suffix
  numbers for duplicate names will increment properly.
*/
async function main() {
  const startedAt = new Date();

  let numTokensFound = 0;
  let numCommunitiesCreated = 0;

  for await (const tokens of paginateClankerTokens({
    cutoffDate: new Date(0),
    desc: false,
  })) {
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

  await models.CommunityIndexer.update(
    {
      last_checked: startedAt,
    },
    {
      where: {
        id: 'clanker',
      },
    },
  );
}

main().catch((err) => {
  console.error(err);
  exit(1);
});
