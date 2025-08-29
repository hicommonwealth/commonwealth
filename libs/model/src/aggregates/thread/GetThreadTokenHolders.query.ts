import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { GetThreadTokenTrades } from '@hicommonwealth/schemas';
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
        `WITH trade_flows AS (
            SELECT
                TT.thread_id,
                COALESCE(U.id::text, TTT.trader_address) AS holder_key,
                U.id AS user_id,
                U.profile->>'avatar_url' AS avatar_url,
             COALESCE(U.profile->>'name', TTT.trader_address) as holder_name,
             SUM(
                CASE WHEN TTT.is_buy
                    THEN TTT.community_token_amount
                    ELSE -TTT.community_token_amount
                END
             ) AS net_tokens
         FROM "ThreadTokenTrades" TTT
             JOIN "ThreadTokens" TT
         ON TT.token_address = TTT.token_address
             LEFT JOIN "Addresses" A
             ON TTT.trader_address = A.address
             LEFT JOIN "Users" U
             ON U.id = A.user_id
         WHERE TT.thread_id = :thread_id
         GROUP BY
             TT.thread_id,
             holder_key,
             U.id,
             TTT.trader_address
             ),
             totals AS (
         SELECT thread_id, SUM(net_tokens) AS total_tokens
         FROM trade_flows
         GROUP BY thread_id
             )
        SELECT
            user_id,
            avatar_url,
            f.holder_name,
            f.net_tokens,
            ROUND(100.0 * f.net_tokens / NULLIF(t.total_tokens, 0), 2) AS percent_share
        FROM trade_flows f
                 JOIN totals t
                      ON f.thread_id = t.thread_id
        ORDER BY percent_share DESC;
        `,
        {
          replacements: {
            thread_id: payload.thread_id,
          },
        },
      );

      console.log(result);
      console.log(result);
      console.log(result);
      console.log(result);
      return result as unknown as z.infer<typeof GetThreadTokenTrades.output>;
    },
  };
}
