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
        token_type,
      } = payload;

      // pagination configuration
      const direction = order_direction || 'DESC';
      let order_col: string;
      switch (order_by) {
        case '24_hr_pct_change':
          order_col = '(CT.latest_price - CT.old_price) / CT.old_price';
          break;
        case 'market_cap':
        case 'price':
          order_col = 'CT.latest_price';
          break;
        case 'created_at':
        case 'name':
        default:
          order_col = `CT.${order_by || 'name'}`;
          break;
      }
      const includeStats = with_stats || order_col === 'CT.latest_price';

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
        conditions.push('LOWER(CT.name) LIKE :search');
      }
      if (is_graduated) {
        conditions.push(
          `CT.liquidity_transferred IS ${is_graduated ? 'TRUE' : 'FALSE'}`,
        );
      }
      if (order_by === '24_hr_pct_change' && includeStats) {
        conditions.push(`CT.old_price > 0`);
      }
      const where_clause = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      const statsSubQuery = includeStats
        ? `
            WITH 
            ${
              !token_type || token_type === 'launchpad'
                ? `latest_launchpad_trades AS (
                SELECT DISTINCT ON (token_address) *
                FROM "LaunchpadTrades"
                ORDER BY token_address, timestamp DESC
            ),
            older_launchpad_trades AS (
                SELECT DISTINCT ON (token_address) *
                FROM "LaunchpadTrades"
                WHERE timestamp <= EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '24 hours')
                ORDER BY token_address, timestamp ASC
            ),`
                : ''
            }
            ${
              !token_type || token_type === 'postcoin'
                ? `latest_thread_trades AS (
                SELECT DISTINCT ON (token_address) *
                FROM "ThreadTokenTrades"
                ORDER BY token_address, timestamp DESC
            ),
            older_thread_trades AS (
                SELECT DISTINCT ON (token_address) *
                FROM "ThreadTokenTrades"
                WHERE timestamp <= EXTRACT(EPOCH FROM CURRENT_TIMESTAMP - INTERVAL '24 hours')
                ORDER BY token_address, timestamp ASC
            ),`
                : ''
            }
            trades AS (
                ${
                  !token_type || token_type === 'launchpad'
                    ? `SELECT lt.token_address,
                        lt.price AS latest_price,
                        ot.price AS old_price
                FROM latest_launchpad_trades lt
                LEFT JOIN older_launchpad_trades ot ON lt.token_address = ot.token_address`
                    : ''
                }
                ${!token_type ? 'UNION ALL' : ''}
                ${
                  !token_type || token_type === 'postcoin'
                    ? `SELECT ltt.token_address,
                        ltt.price AS latest_price,
                        ott.price AS old_price
                FROM latest_thread_trades ltt
                LEFT JOIN older_thread_trades ott ON ltt.token_address = ott.token_address`
                    : ''
                }
            )
          `
        : ``;

      const sql = `
      ${statsSubQuery ? `${statsSubQuery},` : `WITH `}
      combined_tokens AS (
          ${
            !token_type || token_type === 'launchpad'
              ? `SELECT 
            LT.token_address as token_address,
            LT.name as name,
            LT.symbol as symbol,
            LT.initial_supply as initial_supply,
            LT.liquidity_transferred as liquidity_transferred,
            LT.launchpad_liquidity as launchpad_liquidity,
            LT.eth_market_cap_target as eth_market_cap_target,
            LT.icon_url as icon_url,
            LT.description as description,
            LT.created_at as created_at,
            LT.updated_at as updated_at,
            LT.namespace as namespace,
            LT.creator_address as creator_address,
            LTC.id AS community_id,
            NULL AS thread_id,
            'launchpad' AS token_type,
            ${statsSubQuery ? `trades.latest_price` : `NULL`} as latest_price,
            ${statsSubQuery ? `trades.old_price` : `NULL`} as old_price
          FROM "LaunchpadTokens" AS LT
          JOIN "Communities" AS LTC ON LT.namespace = LTC.namespace
          ${statsSubQuery ? `LEFT JOIN trades ON trades.token_address = LT.token_address` : ``}`
              : ``
          }

          ${!token_type ? 'UNION ALL' : ''}

          ${
            !token_type || token_type === 'postcoin'
              ? `SELECT 
            PT.token_address as token_address,
            PT.name as name,
            PT.symbol as symbol,
            PT.initial_supply as initial_supply,
            PT.liquidity_transferred as liquidity_transferred,
            PT.launchpad_liquidity as launchpad_liquidity,
            PT.eth_market_cap_target as eth_market_cap_target,
            NULL as icon_url,
            NULL as description,
            PT.created_at as created_at,
            PT.updated_at as updated_at,
            NULL as namespace,
            PT.creator_address as creator_address,
            PTC.id AS community_id,
            PT.thread_id AS thread_id,
            'postcoin' AS token_type,
            ${statsSubQuery ? `trades.latest_price` : `NULL`} as latest_price,
            ${statsSubQuery ? `trades.old_price` : `NULL`} as old_price
          FROM "ThreadTokens" AS PT
          JOIN "Threads" AS PTT ON PTT.id = PT.thread_id
          JOIN "Communities" AS PTC ON PTT.community_id = PTC.id
          ${statsSubQuery ? `LEFT JOIN trades ON trades.token_address = PT.token_address` : ``}`
              : ``
          }
        )
        SELECT 
          CT.*, 
          count(CT.*) OVER () AS total 
        FROM combined_tokens AS CT
        ${where_clause}
        ORDER BY ${order_col} ${direction} ${order_col === 'CT.latest_price' ? 'NULLS LAST' : ''}
        LIMIT :limit OFFSET :offset;
    `;

      const tokens = await models.sequelize.query<
        z.infer<typeof schemas.TokenView> & {
          total?: number;
        }
      >(sql, {
        replacements,
        type: QueryTypes.SELECT,
        nest: true,
        logging: true,
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
