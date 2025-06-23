import { AppError, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import z from 'zod';
import { models } from '../../database';

export function GetLaunchpadTrades(): Query<typeof schemas.GetLaunchpadTrades> {
  return {
    ...schemas.GetLaunchpadTrades,
    auth: [],
    body: async ({ payload }) => {
      if (!payload.token_address && !payload.trader_addresses) {
        throw new AppError('Must provide a parameter');
      }

      const uniqueAddresses = [
        ...new Set(
          payload?.trader_addresses
            ?.split(',')
            .map((addr) => addr.trim().toLowerCase()),
        ),
      ];

      let whereClauseCondition = '';
      if (payload.token_address) {
        whereClauseCondition = `WHERE tokens.token_address = :token_address`;
      } else if (payload.trader_addresses && uniqueAddresses.length > 0) {
        whereClauseCondition = `WHERE trades.trader_address IN (:uniqueAddresses)`;
      }

      const trades = await models.sequelize.query(
        `
          SELECT 
            trades.*,
            tokens.name,
            tokens.symbol,
            c.id as community_id,
            c.icon_url as community_icon_url,
            u.id as user_id,
            u.profile->>'name' as user_name,
            u.profile->>'avatar_url' as user_avatar_url
          FROM 
            "LaunchpadTrades" trades
          LEFT JOIN 
            "LaunchpadTokens" tokens ON trades.token_address = tokens.token_address
          LEFT JOIN 
            "Communities" c ON c.namespace = tokens.namespace
          LEFT JOIN LATERAL (
            SELECT DISTINCT ON (address) user_id
            FROM "Addresses"
            WHERE address = trades.trader_address
            ORDER BY address, id
          ) a ON true
          LEFT JOIN
            "Users" u ON u.id = a.user_id
          ${whereClauseCondition}
        `,
        {
          replacements: {
            token_address: payload.token_address,
            uniqueAddresses: uniqueAddresses,
          },
          type: QueryTypes.SELECT,
        },
      );

      if (!trades) {
        return [];
      }

      type TradeType = z.infer<typeof schemas.GetLaunchpadTrades.output>;
      return (trades! as unknown as TradeType).map((trade) => ({
        ...trade,
        community_token_amount: trade?.community_token_amount?.toString(),
        floating_supply: trade?.floating_supply?.toString(),
      }));
    },
  };
}
