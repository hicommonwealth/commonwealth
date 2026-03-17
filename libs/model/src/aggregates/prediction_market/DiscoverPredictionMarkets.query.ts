import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

type DiscoverResult = z.infer<typeof schemas.PredictionMarketView> & {
  total?: number;
  community_id?: string;
};

type DiscoverPayload = z.infer<typeof schemas.DiscoverPredictionMarkets.input>;

export function DiscoverPredictionMarkets(): Query<
  typeof schemas.DiscoverPredictionMarkets
> {
  return {
    ...schemas.DiscoverPredictionMarkets,
    auth: [],
    secure: false,
    body: async ({ payload }: { payload: DiscoverPayload }) => {
      const { community_id, statuses, sort, search, cursor, limit } = payload;

      const offset = limit! * (cursor! - 1);

      const hasStatusFilter = Array.isArray(statuses) && statuses.length > 0;
      const statusPlaceholders = hasStatusFilter
        ? statuses!.map((_, i) => `:status_${i}`).join(', ')
        : '';
      const statusFilter =
        hasStatusFilter && statusPlaceholders
          ? `AND pm.status IN (${statusPlaceholders})`
          : '';
      const communityFilter =
        community_id && community_id.trim() !== ''
          ? `AND t.community_id = :community_id`
          : '';
      const searchFilter =
        search && search.trim() !== '' ? `AND pm.prompt ILIKE :search` : '';
      const searchReplacement =
        search && search.trim() !== ''
          ? `%${search.trim().replace(/%/g, '\\%')}%`
          : null;

      const orderBy =
        sort === 'volume'
          ? 'COALESCE(pmv.market_volume_raw, 0) DESC NULLS LAST, pm.created_at DESC'
          : 'pm.created_at DESC';

      const replacements: Record<string, unknown> = {
        limit,
        offset,
        ...(hasStatusFilter &&
          statuses!.reduce<Record<string, unknown>>((acc, s, i) => {
            acc[`status_${i}`] = s;
            return acc;
          }, {})),
        ...(community_id && community_id.trim() !== '' ? { community_id } : {}),
        ...(searchReplacement != null ? { search: searchReplacement } : {}),
      };

      const results = await models.sequelize.query<DiscoverResult>(
        `SELECT pm.*, t.community_id, COALESCE(pmv.market_volume, '0') AS market_volume, count(*) OVER() AS total
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
             )::text AS market_volume,
             SUM(
               CASE
                 WHEN collateral_amount > 0 THEN collateral_amount
                 ELSE GREATEST(p_token_amount, f_token_amount)
               END
             ) AS market_volume_raw
           FROM "PredictionMarketTrades"
           GROUP BY prediction_market_id
         ) pmv ON pmv.prediction_market_id = pm.id
         WHERE 1=1
         ${statusFilter}
         ${communityFilter}
         ${searchFilter}
         ORDER BY ${orderBy}
         LIMIT :limit OFFSET :offset`,
        {
          replacements,
          type: QueryTypes.SELECT,
        },
      );

      const total = +(results.at(0)?.total ?? 0);
      const resultsWithoutTotal = results
        .map(({ total: _t, ...r }) => r)
        .filter(
          (r): r is DiscoverResult & { community_id: string } =>
            typeof r.community_id === 'string',
        );

      return schemas.buildPaginatedResponse(resultsWithoutTotal, total, {
        limit,
        offset,
      });
    },
  };
}
