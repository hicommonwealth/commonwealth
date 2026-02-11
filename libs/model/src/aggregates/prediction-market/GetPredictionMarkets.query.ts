import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function GetPredictionMarkets(): Query<
  typeof schemas.GetPredictionMarkets
> {
  return {
    ...schemas.GetPredictionMarkets,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { thread_id, limit, cursor, order_by, order_direction } = payload;

      const offset = limit * (cursor - 1);
      const order = order_by || 'created_at';
      const direction = order_direction || 'DESC';

      const { rows, count } = await models.PredictionMarket.findAndCountAll({
        where: { thread_id },
        limit,
        offset,
        order: [[order, direction]],
      });

      const results = rows.map((market) => {
        const json = market.toJSON();
        return {
          ...json,
          id: json.id!,
        };
      });

      return schemas.buildPaginatedResponse(results, count, { limit, cursor });
    },
  };
}
