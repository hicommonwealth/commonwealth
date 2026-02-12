import { Projection } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { models } from '../../database';
import { mustExist } from '../../middleware';

const inputs = {
  PredictionMarketProposalCreated: events.PredictionMarketProposalCreated,
  PredictionMarketMarketCreated: events.PredictionMarketMarketCreated,
};

export function PredictionMarketProjection(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      PredictionMarketProposalCreated: async ({ payload }) => {
        const { prediction_market_id, proposal_id } = payload;
        const market =
          await models.PredictionMarket.findByPk(prediction_market_id);
        mustExist('Prediction Market', market);

        await market.update({ proposal_id });
      },
      PredictionMarketMarketCreated: async ({ payload }) => {
        const { prediction_market_id, market_id } = payload;
        const market =
          await models.PredictionMarket.findByPk(prediction_market_id);
        mustExist('Prediction Market', market);

        await market.update({ market_id });
      },
    },
  };
}
