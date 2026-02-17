import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../../database';

export function GetPredictionMarketPositions(): Query<
  typeof schemas.GetPredictionMarketPositions
> {
  return {
    ...schemas.GetPredictionMarketPositions,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { prediction_market_id } = payload;

      const positions = await models.PredictionMarketPosition.findAll({
        where: { prediction_market_id },
        order: [['updated_at', 'DESC']],
      });

      // Sequelize returns DECIMAL(78,0) as strings at runtime,
      // matching the View schema (PG_ETH → z.string())
      return positions.map((p) => p.toJSON()) as unknown as z.infer<
        typeof schemas.GetPredictionMarketPositions.output
      >;
    },
  };
}
