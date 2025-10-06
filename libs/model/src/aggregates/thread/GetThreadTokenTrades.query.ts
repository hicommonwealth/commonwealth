import { Query } from '@hicommonwealth/core';
import {
  ThreadTokenTradesOutput,
  ThreadTokenTradesSchema,
} from '@hicommonwealth/schemas';
import z from 'zod';
import { models } from '../../database';

export function GetThreadTokenTrades(): Query<typeof ThreadTokenTradesSchema> {
  return {
    ...ThreadTokenTradesSchema,
    auth: [],
    body: async ({ payload }) => {
      const [result] = await models.sequelize.query(
        `SELECT 
          TTT.transaction_hash as id,
          CASE WHEN TTT.is_buy THEN 'buy' ELSE 'sell' END as type,
          TTT.community_token_amount as amount,
          TTT.price as price,
          TTT.timestamp as timestamp,
          TTT.trader_address as address
        FROM "ThreadTokens" AS TT
        JOIN "ThreadTokenTrades" AS TTT ON TT.token_address = TTT.token_address
        WHERE TT.thread_id = :thread_id
        ORDER BY TTT.timestamp DESC
        `,
        {
          replacements: {
            thread_id: payload.thread_id,
          },
        },
      );

      if (!result || result.length === 0) {
        return {
          result: null,
        };
      }

      return {
        result: result as z.infer<typeof ThreadTokenTradesOutput>['result'],
      };
    },
  };
}
