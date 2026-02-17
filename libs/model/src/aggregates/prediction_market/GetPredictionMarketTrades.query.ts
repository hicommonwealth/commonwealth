import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function GetPredictionMarketTrades(): Query<
  typeof schemas.GetPredictionMarketTrades
> {
  return {
    ...schemas.GetPredictionMarketTrades,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { prediction_market_id, cursor, limit } = payload;
      const offset = limit! * (cursor! - 1);

      // PG returns DECIMAL(78,0) as strings, matching the View schema
      type TradeRow = z.infer<typeof schemas.PredictionMarketTradeView> & {
        total?: number;
      };
      const results = await models.sequelize.query<TradeRow>(
        `SELECT *, count(*) OVER() AS total
         FROM "PredictionMarketTrades"
         WHERE prediction_market_id = :prediction_market_id
         ORDER BY timestamp DESC
         LIMIT :limit OFFSET :offset`,
        {
          replacements: { prediction_market_id, limit, offset },
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
