import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function GetLaunchpadTokens(): Query<typeof schemas.GetTokens> {
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
        is_graduated,
      } = payload;

      // pagination configuration
      const direction = order_direction || 'DESC';
      let order_col: string;
      switch (order_by) {
        case 'market_cap':
        case 'price':
          order_col = 'trades.latest_price';
          break;
        case 'created_at':
        case 'name':
        default:
          order_col = `T.${order_by || 'name'}`;
          break;
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

      const conditions: string[] = [];
      if (search) {
        conditions.push('LOWER(T.name) LIKE :search');
      }
      if (is_graduated) {
        conditions.push(
          `T.liquidity_transferred IS ${is_graduated ? 'TRUE' : 'FALSE'}`,
        );
      }
      const where_clause = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      const sql = includeStats
        ? `
      WITH latest_trades AS (
                SELECT DISTINCT ON (token_address) *
                FROM "LaunchpadTrades"
                ORDER BY token_address, timestamp DESC
            ),
            older_trades AS (
                SELECT DISTINCT ON (token_address) *
                FROM "LaunchpadTrades"
                WHERE timestamp <= EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '24 hours')
                ORDER BY token_address, timestamp ASC
            ),
            trades AS (
                SELECT lt.token_address,
                        lt.price AS latest_price,
                        ot.price AS old_price
                FROM latest_trades lt
                LEFT JOIN older_trades ot ON lt.token_address = ot.token_address
            )
      SELECT DISTINCT ON (T.token_address) 
            T.*,
            C.id AS community_id,
            trades.latest_price, trades.old_price,
            count(*) OVER () AS total
      FROM "LaunchpadTokens" AS T
      JOIN "Communities" AS C ON T.namespace = C.namespace
      LEFT JOIN trades ON trades.token_address = T.token_address
      ${where_clause}
      ORDER BY T.token_address ${direction}, ${order_col} ${direction}
      LIMIT :limit OFFSET :offset
    `
        : `
      SELECT T.*,
            C.id AS community_id,
            count(*) OVER () AS total
      FROM "LaunchpadTokens" AS T
      JOIN "Communities" AS C ON T.namespace = C.namespace
      ${where_clause}
      ORDER BY ${order_col} ${direction}
      LIMIT :limit OFFSET :offset
    `;

      const tokens = await models.sequelize.query<
        z.infer<typeof schemas.TokenView> & {
          total?: number;
          community_id: string;
          latest_price?: number;
          old_price?: number;
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
