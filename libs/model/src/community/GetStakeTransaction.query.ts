import type { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../database';

export function GetStakeTransaction(): Query<
  typeof schemas.GetStakeTransaction
> {
  return {
    ...schemas.GetStakeTransaction,
    auth: [],
    body: async ({ payload }) => {
      const { addresses } = payload;

      let addressFilter = '';
      if (addresses) {
        addressFilter = 'WHERE t.address IN (:addresses);';
      }

      return (await models.sequelize.query(
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
           'name', c.name,
           'chain_node_id', c.chain_node_id
         ) AS community
       FROM "StakeTransactions" AS t
       LEFT JOIN "Communities" AS c ON c.id = t.community_id
       LEFT JOIN "CommunityStakes" AS cs ON cs.community_id = t.community_id
       ${addressFilter}
      `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            addresses: addresses ?? null,
          },
        },
      )) as any;
    },
  };
}
