import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function GetMarkets(): Query<typeof schemas.GetMarkets> {
  return {
    ...schemas.GetMarkets,
    auth: [],
    body: async ({ payload }) => {
      const { community_id } = payload;

      const markets = await models.sequelize.query<
        z.infer<typeof schemas.MarketView>
      >(
        `
        SELECT
          m.id,
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
      `,
        {
          replacements: { community_id },
          type: QueryTypes.SELECT,
        },
      );

      return markets;
    },
  };
}
