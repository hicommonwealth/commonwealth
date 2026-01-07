import { Command, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { config } from '../../config';
import { models } from '../../database';
import { authRoles, mustExist } from '../../middleware';

export function UnsubscribeMarket(): Command<typeof schemas.UnsubscribeMarket> {
  return {
    ...schemas.UnsubscribeMarket,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      if (!config.MARKETS?.ENABLED) {
        throw new InvalidState('Markets not enabled');
      }

      const { community_id, slug } = payload;

      const market = await models.Market.findOne({ where: { slug } });
      mustExist('Market', market);

      await models.CommunityMarket.destroy({
        where: { community_id, market_id: market.id },
      });

      // TODO: remove market if last one?

      return true;
    },
  };
}
