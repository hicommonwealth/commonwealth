import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod/v4';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';

export function GetLaunchpadToken(): Query<typeof schemas.GetToken> {
  return {
    ...schemas.GetToken,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, thread_id, with_stats } = payload;

      const community = await models.Community.findOne({
        where: {
          id: community_id,
        },
      });
      mustExist('Community', community);

      if (!community.namespace) {
        return null;
      }

      const threadTokenSql = `
        JOIN "Threads" AS TT ON TT.launchpad_token_address = T.token_address
        WHERE TT.thread_id = :threadId
      `;

      const replacements = community_id
        ? {
            namespace: community.namespace,
          }
        : {
            threadId: thread_id,
          };

      const sql = `
          ${
            with_stats
              ? `WITH latest_trades AS (SELECT DISTINCT ON (token_address) *
                    FROM "LaunchpadTrades"
                    ORDER BY token_address, timestamp DESC),
                    older_trades AS (SELECT DISTINCT ON (token_address) *
                      FROM "LaunchpadTrades"
                      WHERE timestamp <=
                            (SELECT EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '24 hours'))
                      ORDER BY token_address, timestamp ASC),
                    trades AS (SELECT lt.token_address,
                    lt.price as latest_price,
                    ot.price as old_price
                    FROM latest_trades lt
                      LEFT JOIN
                      older_trades ot ON lt.token_address = ot.token_address)`
              : ''
          }
          SELECT T.*${with_stats ? ', trades.latest_price, trades.old_price' : ''}
          FROM "LaunchpadTokens" as T
          ${with_stats ? 'LEFT JOIN trades ON trades.token_address = T.token_address' : ''}
          ${community_id ? 'WHERE T.namespace = :namespace' : threadTokenSql};
      `;

      const token = await models.sequelize.query<
        z.infer<typeof schemas.TokenView>
      >(sql, {
        replacements,
        type: QueryTypes.SELECT,
      });
      if (!token || !Array.isArray(token) || token.length !== 1) return null;

      return token[0];
    },
  };
}
