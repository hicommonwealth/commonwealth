import { logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { models } from '../database';
import { createCommunityFromClankerToken } from './utils/community-indexer-utils';

const log = logger(import.meta);

const inputs = {
  ClankerTokenFound: events.ClankerTokenFound,
};

export function CommunityIndexerWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      ClankerTokenFound: async ({ payload }) => {
        const existingCommunity = await models.Community.findOne({
          where: {
            token_address: payload.contract_address,
          },
        });
        if (existingCommunity) {
          log.warn(
            `token already has community: ${payload.contract_address}="${existingCommunity.name}"`,
          );
        } else {
          await createCommunityFromClankerToken(payload);
        }
      },
    },
  };
}
