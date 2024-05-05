import type { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../database';

export const GetStakeHistoricalPrice: Query<
  typeof schemas.GetStakeHistoricalPrice
> = () => ({
  ...schemas.GetStakeHistoricalPrice,
  auth: [],
  body: async ({ payload }) => {
    const { past_date_epoch, community_id, stake_id } = payload;

    const response: any = await models.sequelize.query(
      `
        SELECT s.community_id, (s.stake_price / s.stake_amount::REAL)::TEXT as old_price
        FROM "StakeTransactions" s
        INNER JOIN (
            SELECT community_id, MIN(timestamp) AS earliest_timestamp
            FROM "StakeTransactions"
            WHERE stake_id = :stake_id
            AND stake_direction = 'buy'
            AND timestamp >= :past_date_epoch
            ${community_id ? 'AND community_id = :community_id' : ''}
            GROUP BY community_id
        ) AS latest ON s.community_id = latest.community_id AND s.timestamp = latest.earliest_timestamp
      `,
      {
        replacements: { past_date_epoch, community_id, stake_id },
        type: QueryTypes.SELECT,
      },
    );

    return response;
  },
});
