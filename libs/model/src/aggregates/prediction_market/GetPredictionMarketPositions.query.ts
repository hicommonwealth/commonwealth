import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
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

      return positions.map((p) => p.toJSON());
    },
  };
}
