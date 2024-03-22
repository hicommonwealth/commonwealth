import type { Query } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { models } from '../database';

export const GetStakeHistoricalPrice: Query<
  typeof schemas.queries.GetStakeHistoricalPrice
> = () => ({
  ...schemas.queries.GetStakeHistoricalPrice,
  auth: [],
  body: async ({ payload }) => {
    const { past_date_epoch, community_id, stake_id } = payload;

    const response: any = await models.sequelize.query(
      `
      SELECT stake_price / stake_amount::REAL
      FROM "StakeTransactions"
      WHERE community_id = :community_id AND stake_id = :stake_id
      AND timestamp <= :past_date_epoch
      ORDER BY timestamp DESC
      LIMIT 1`,
      {
        replacements: { past_date_epoch, community_id, stake_id },
        type: QueryTypes.SELECT,
      },
    );

    return { old_price: response[0]?.stake_price ?? null };
  },
});
