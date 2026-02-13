import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { mustExist } from '../../middleware';

export function ProjectPredictionMarketProposal(): Command<
  typeof schemas.ProjectPredictionMarketProposal
> {
  return {
    ...schemas.ProjectPredictionMarketProposal,
    auth: [],
    body: async ({ payload }) => {
      const { prediction_market_id, proposal_id } = payload;
      const market =
        await models.PredictionMarket.findByPk(prediction_market_id);
      mustExist('Prediction Market', market);

      await market.update({ proposal_id });
      return {};
    },
  };
}
