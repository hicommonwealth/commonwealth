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
        const pinnedToken = await models.PinnedToken.findOne({
          where: {
            contract_address: payload.contract_address,
          },
        });
        if (pinnedToken) {
          log.warn(
            `token already has community: ${payload.contract_address}="${pinnedToken.community_id}"`,
          );
        } else {
          await createCommunityFromClankerToken(payload);
        }
      },
    },
  };
}
