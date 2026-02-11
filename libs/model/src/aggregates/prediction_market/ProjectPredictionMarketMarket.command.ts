import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { mustExist } from '../../middleware';

export function ProjectPredictionMarketMarket(): Command<
  typeof schemas.ProjectPredictionMarketMarket
> {
  return {
    ...schemas.ProjectPredictionMarketMarket,
    auth: [],
    body: async ({ payload }) => {
      const { prediction_market_id, market_id } = payload;
      const market =
        await models.PredictionMarket.findByPk(prediction_market_id);
      mustExist('Prediction Market', market);

      await market.update({ market_id });
      return {};
    },
  };
}
