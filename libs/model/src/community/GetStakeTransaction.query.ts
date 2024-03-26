import type { Query } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { models } from '../database';

export const GetStakeTransaction: Query<
  typeof schemas.queries.GetStakeTransaction
> = () => ({
  ...schemas.queries.GetStakeTransaction,
  auth: [],
  body: async ({ payload }) => {
    const { addresses } = payload;

    return await models.sequelize.query(
      `
       SELECT 
         t.transaction_hash,
         t.address,
         t.stake_price,
         t.stake_amount,
         cs.vote_weight,
         t.timestamp,
         t.stake_direction,
         json_build_object(
           'id', c.id,
           'default_symbol', c.default_symbol,
           'icon_url', c.icon_url,
           'name', c.name
         ) AS community
       FROM "StakeTransactions" AS t
       LEFT JOIN "Communities" AS c ON c.id = t.community_id
       LEFT JOIN "CommunityStakes" AS cs ON cs.community_id = t.community_id
       WHERE :addresses IS NULL OR t.address IN (:addresses);
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          addresses: addresses ?? null,
        },
      },
    );
  },
});
