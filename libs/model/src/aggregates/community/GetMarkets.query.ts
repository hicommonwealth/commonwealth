import { InvalidState, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { config } from '../../config';
import { models } from '../../database';
import { formatSequelizePagination } from '../../utils/paginationUtils';

export function GetMarkets(): Query<typeof schemas.GetMarkets> {
  return {
    ...schemas.GetMarkets,
    auth: [],
    body: async ({ payload }) => {
      if (!config.MARKETS.ENABLED) {
        throw new InvalidState('Markets feature is not enabled');
      }

      const { community_id, limit = 20, cursor = 1 } = payload;

      const countResult = await models.sequelize.query<{ count: string }>(
        `
        SELECT COUNT(*) as count
        FROM 
          "CommunityMarkets" cm
          JOIN "Markets" m ON cm.market_id = m.id
        WHERE 
          cm.community_id = :community_id
      `,
        {
          replacements: { community_id },
          type: QueryTypes.SELECT,
        },
      );

      const totalResults = parseInt(countResult[0]?.count || '0', 10);

      const pagination = formatSequelizePagination({
        limit,
        cursor,
        order_by: 'm.created_at',
        order_direction: 'DESC',
      });

      const markets = await models.sequelize.query<
        z.infer<typeof schemas.MarketView>
      >(
        `
        SELECT
          m.id,
          m.provider,
          m.slug,
          m.question,
          m.category,
          m.start_time,
          m.end_time,
          m.status,
          m.created_at,
          m.updated_at
        FROM 
          "CommunityMarkets" cm
          JOIN "Markets" m ON cm.market_id = m.id
        WHERE 
          cm.community_id = :community_id
        ORDER BY m.created_at DESC
        LIMIT :limit OFFSET :offset
      `,
        {
          replacements: {
            community_id,
            limit: pagination.limit,
            offset: pagination.offset,
          },
          type: QueryTypes.SELECT,
        },
      );

      return schemas.buildPaginatedResponse(markets, totalResults, {
        limit,
        cursor,
      });
    },
  };
}
