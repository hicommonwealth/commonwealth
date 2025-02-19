import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function GetLaunchpadTrades(): Query<typeof schemas.GetLaunchpadTrades> {
  return {
    ...schemas.GetLaunchpadTrades,
    auth: [],
    body: async ({ payload }) => {
      const trades = await models.LaunchpadTrade.findAll({
        where: {
          token_address: payload.token_address,
        },
        raw: true,
      });

      return trades.map((trade) => ({
        ...trade,
        community_token_amount: trade.community_token_amount.toString(),
        floating_supply: trade.floating_supply.toString(),
      }));
    },
  };
}
