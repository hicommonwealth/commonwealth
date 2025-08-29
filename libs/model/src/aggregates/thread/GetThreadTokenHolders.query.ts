import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { GetThreadTokenTradesOutput } from '@hicommonwealth/schemas';
import z from 'zod';
import { models } from '../../database';

export function GetThreadTokenHolders(): Query<
  typeof schemas.GetThreadTokenTrades
> {
  return {
    ...schemas.GetThreadTokenTrades,
    auth: [],
    body: async ({ payload }) => {
      const [result] = await models.sequelize.query(
        `WITH base AS (
            SELECT
             COALESCE(U.id, -1)           AS user_id,
             COALESCE(U.profile->>'name') AS user_name,
             U.profile->>'avatar_url'     AS avatar_url,
             A.id                         AS address_id,
             A.address                    AS address,
             TTT.*                                        -- trade fields
         FROM "ThreadTokens"      AS TT
             JOIN "ThreadTokenTrades" AS TTT ON TT.token_address = TTT.token_address
             LEFT JOIN "Addresses"    AS A   ON TTT.trader_address = A.address
             LEFT JOIN "Users"        AS U   ON U.id = A.user_id
         WHERE TT.thread_id = :thread_id
             ),
             trades_by_user AS (
         SELECT
             user_id,
             user_name,
             avatar_url,
             jsonb_agg(
             (to_jsonb(base) - 'user_name' - 'avatar_url')
             ORDER BY base."timestamp" DESC
             ) AS trades
         FROM base
         WHERE user_id
         GROUP BY user_id, user_name, avatar_url
             )
        SELECT jsonb_build_object(
          'trades',
          jsonb_agg(
            jsonb_build_object(
              'user_id',    user_id,
              'name',       user_name,
              'avatar_url', avatar_url,
              'trades',     trades
            ) ORDER BY user_id
          )
        ) AS result
        FROM trades_by_user;
        `,
        {
          replacements: {
            thread_id: payload.thread_id,
          },
        },
      );

      return result[0] as unknown as z.infer<typeof GetThreadTokenTradesOutput>;
    },
  };
}
