// backfills all clanker tokens

import { logger } from '@hicommonwealth/core';
import {
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

  for await (const tokens of paginateClankerTokens(new Date(0))) {
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
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  exit(1);
});
