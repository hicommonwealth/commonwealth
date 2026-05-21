import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

type ActivePredictionMarketRow = z.infer<
  typeof schemas.ActivePredictionMarketRow
>;

export function GetActivePredictionMarkets(): Query<
  typeof schemas.GetActivePredictionMarkets
> {
  return {
    ...schemas.GetActivePredictionMarkets,
    auth: [],
    secure: false,
    body: async ({
      payload,
    }: {
      payload: z.infer<typeof schemas.GetActivePredictionMarkets.input>;
    }) => {
      const { community_id, limit } = payload;
      const hasCommunityFilter = community_id != null && community_id !== '';

      const results = await models.sequelize.query<ActivePredictionMarketRow>(
        `SELECT pm.*, t.community_id, COALESCE(pmv.market_volume, '0') AS market_volume
         FROM "PredictionMarkets" pm
         INNER JOIN "Threads" t ON t.id = pm.thread_id
         LEFT JOIN (
           SELECT
             prediction_market_id,
             SUM(
               CASE
                 WHEN collateral_amount > 0 THEN collateral_amount
                 ELSE GREATEST(p_token_amount, f_token_amount)
               END
             )::text AS market_volume
           FROM "PredictionMarketTrades"
           GROUP BY prediction_market_id
         ) pmv ON pmv.prediction_market_id = pm.id
         WHERE pm.status = 'active'
         ${hasCommunityFilter ? 'AND t.community_id = :community_id' : ''}
         ORDER BY pm.total_collateral DESC NULLS LAST, pm.created_at DESC
         LIMIT :limit`,
        {
          replacements: {
            ...(hasCommunityFilter && { community_id }),
            limit: limit ?? 10,
          },
          type: QueryTypes.SELECT,
        },
      );

      return { results };
    },
  };
}
