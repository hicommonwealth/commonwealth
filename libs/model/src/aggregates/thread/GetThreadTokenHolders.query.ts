import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { GetThreadTokenTradesOutput } from '@hicommonwealth/schemas';
import { models } from 'model/src/database';

export function GetThreadTokenHolders(): Query<
  typeof schemas.GetThreadTokenTrades
> {
  return {
    ...schemas.GetThreadTokenTrades,
    auth: [],
    body: async ({ payload }) => {
      return models.sequelize.query(
        `WITH base AS (
            SELECT
             U.id AS user_id,
             U.profile->>'name' AS user_name,
             A.id AS address_id,
             A.address AS address,
             TTT.*
         FROM "ThreadTokens" AS TT
             JOIN "ThreadTokenTrades" AS TTT ON TT.token_address = TTT.token_address
             LEFT JOIN "Addresses" AS A   ON TTT.trader_address = A.address
             LEFT JOIN "Users" AS U   ON U.id = A.user_id
         WHERE TT.thread_id = :thread_id
             ),
             trades_by_address AS (
         SELECT
             user_id,
             user_name,
             COALESCE(address_id::text, address) AS addr_key,
             jsonb_agg(to_jsonb(base)) AS trades
         FROM base
         WHERE user_id IS NOT NULL
         GROUP BY user_id, user_name, addr_key
             ),
             addresses_by_user AS (
                SELECT
                    user_id,
                    user_name,
                    jsonb_object_agg(addr_key, trades) AS addresses
                FROM trades_by_address
                GROUP BY user_id, user_name
             )
        SELECT jsonb_object_agg(
          user_id::text,
          jsonb_build_object(
                  'name',      user_name,
                  'addresses', addresses
          )
        ) AS result
        FROM addresses_by_user;
        `,
        {
          replacements: {
            thread_id: payload.thread_id,
          },
        },
      ) as unknown as z.infer<GetThreadTokenTradesOutput>;
    },
  };
}
