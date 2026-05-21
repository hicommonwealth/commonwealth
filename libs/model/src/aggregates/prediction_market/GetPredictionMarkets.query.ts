import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function GetPredictionMarkets(): Query<
  typeof schemas.GetPredictionMarkets
> {
  return {
    ...schemas.GetPredictionMarkets,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { thread_id, cursor, limit } = payload;
      const offset = limit! * (cursor! - 1);

      const results = await models.sequelize.query<
        z.infer<typeof schemas.PredictionMarketView> & { total?: number }
      >(
        `SELECT *, count(*) OVER() AS total
         FROM "PredictionMarkets"
         WHERE thread_id = :thread_id
         ORDER BY created_at DESC
         LIMIT :limit OFFSET :offset`,
        {
          replacements: { thread_id, limit, offset },
          type: QueryTypes.SELECT,
        },
      );

      return schemas.buildPaginatedResponse(
        results,
        +(results.at(0)?.total ?? 0),
        { limit, offset },
      );
    },
  };
}
