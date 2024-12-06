import type { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../database';

export function GetTransactions(): Query<typeof schemas.GetTransactions> {
  return {
    ...schemas.GetTransactions,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { addresses } = payload;

      return (await models.sequelize.query(
        `
        (
          SELECT
            'stake' AS transaction_category,
            t.transaction_hash as transaction_hash,
            t.address as address,
            t.stake_price as price,
            t.stake_amount as amount,
            t.timestamp as timestamp,
            t.stake_direction::text as transaction_type,
            json_build_object(
              'id', c.id,
              'default_symbol', c.default_symbol,
              'icon_url', c.icon_url,
              'name', c.name,
              'chain_node_id', c.chain_node_id,
              'chain_node_name', cn.name
            ) AS community
          FROM "StakeTransactions" AS t
          LEFT JOIN "Communities" AS c ON c.id = t.community_id
          LEFT JOIN "ChainNodes" AS cn ON cn.id = c.chain_node_id
          ${addresses ? 'WHERE t.address IN (:addresses)' : ''}
        )

        UNION ALL

        (
          SELECT
            'launchpad' AS transaction_category, 
            lts.transaction_hash as transaction_hash,
            lts.trader_address as address,
            lts.price as price,
            lts.community_token_amount as amount,
            lts.timestamp as timestamp,
            CASE 
              WHEN lts.is_buy THEN 'buy'
              ELSE 'sell'
            END AS transaction_type,
            json_build_object(
              'id', c.id,
              'default_symbol', c.default_symbol,
              'icon_url', c.icon_url,
              'name', c.name,
              'chain_node_id', c.chain_node_id,
              'chain_node_name', cn.name
            ) AS community
          FROM "LaunchpadTrades" lts
          LEFT JOIN "Tokens" AS tkns ON tkns.token_address = lts.token_address
          LEFT JOIN "Communities" AS c ON c.namespace = tkns.namespace
          LEFT JOIN "ChainNodes" AS cn ON cn.id = c.chain_node_id
          ${addresses ? 'WHERE lts.trader_address IN (:addresses)' : ''}
        )

        ORDER BY timestamp DESC
      `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            addresses: addresses ?? null,
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;
    },
  };
}
