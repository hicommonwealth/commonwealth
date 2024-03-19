import type { Command } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { models } from '../database';

export const GetStakePriceChange: Command<
  typeof schemas.commands.GetPriceChange
> = () => ({
  ...schemas.commands.GetPriceChange,
  auth: [],
  secure: true,
  body: async ({ payload }) => {
    const { past_date_epoch, community_id, stake_id } = payload;

    const response: any = await models.sequelize.query(
      `
      WITH most_recent_timestamp AS (
        SELECT stake_price AS new_price
        FROM "StakeTransactions"
        WHERE community_id = :community_id AND stake_id = :stake_id AND stake_direction = 'buy'
        ORDER BY created_at DESC
        LIMIT 1
      ),
      closest_entry AS (
        SELECT created_at AS old_price
        FROM "StakeTransactions"
        WHERE community_id = :community_id AND stake_id = :stake_id AND stake_direction = 'buy'
        ORDER BY ABS(EXTRACT(EPOCH FROM created_at) - :past_date_epoch)
        LIMIT 1
      )
      SELECT new_price, old_price
      FROM most_recent_timestamp, closest_entry;`,
      {
        replacements: { past_date_epoch, community_id, stake_id },
        type: QueryTypes.SELECT,
      },
    );

    return { new_price: response.new_price, old_price: response.old_price };
  },
});
