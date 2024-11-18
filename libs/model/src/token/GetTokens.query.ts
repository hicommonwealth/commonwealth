import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

export function GetTokens(): Query<typeof schemas.GetTokens> {
  return {
    ...schemas.GetTokens,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const {
        search = '',
        cursor,
        limit,
        order_by,
        order_direction,
        with_stats,
      } = payload;

      // pagination configuration
      const direction = order_direction || 'DESC';
      let order_col: string = order_by || 'name';
      if (order_by === 'market_cap' || order_by === 'price') {
        order_col = 'trades.latest_price';
      }
      const includeStats = with_stats || order_col === 'trades.latest_price';

      const offset = limit! * (cursor! - 1);
      const replacements: {
        search?: string;
        offset: number;
        order_col: string;
        direction: string;
        limit: number;
      } = {
        search: search ? `%${search.toLowerCase()}%` : '',
        offset,
        order_col,
        direction,
        limit,
      };

      const sql = `
          ${
            includeStats
              ? `WITH latest_trades AS (SELECT DISTINCT ON (token_address) *
                                 FROM "LaunchpadTrades"
                                 ORDER BY token_address, timestamp DESC),
               older_trades AS (SELECT DISTINCT ON (token_address) *
                                FROM "LaunchpadTrades"
                                WHERE timestamp >= (SELECT EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '24 hours'))
                                ORDER BY token_address, timestamp ASC),
               trades AS (SELECT lt.token_address,
                                 lt.price as latest_price,
                                 ot.price as old_price
                          FROM latest_trades lt
                                   LEFT JOIN
                               older_trades ot
                               ON
                                   lt.token_address = ot.token_address)`
              : ''
          }
          SELECT T.*,
                 C.id as community_id,
                 ${includeStats ? 'trades.latest_price, trades.old_price,' : ''}
                         count(*) OVER () AS total
          FROM "Tokens" as T
              JOIN "Communities" as C
          ON T.namespace = C.namespace
              ${includeStats ? 'LEFT JOIN trades ON trades.token_address = T.token_address' : ''}
              ${search ? 'WHERE LOWER(T.name) LIKE :search' : ''}
          ORDER BY ${order_col} :direction
          LIMIT :limit OFFSET :offset
      `;

      const tokens = await models.sequelize.query<
        z.infer<typeof schemas.TokenView> & {
          total?: number;
          community_id: string;
          latest_price?: string;
          old_price?: string;
        }
      >(sql, {
        replacements,
        type: QueryTypes.SELECT,
        nest: true,
      });

      return schemas.buildPaginatedResponse(
        tokens,
        +(tokens.at(0)?.total ?? 0),
        {
          limit,
          offset,
        },
      );
    },
  };
}
