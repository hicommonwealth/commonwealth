import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { PredictionMarketStatus } from '@hicommonwealth/schemas';
import { models } from '../../database';
import { mustExist } from '../../middleware';

export function CancelPredictionMarket(): Command<
  typeof schemas.CancelPredictionMarket
> {
  return {
    ...schemas.CancelPredictionMarket,
    auth: [],
    body: async ({ actor, payload }) => {
      const { prediction_market_id } = payload;

      const market = await models.PredictionMarket.findByPk(
        prediction_market_id,
        {
          include: [
            {
              model: models.Thread,
              required: true,
            },
          ],
        },
      );
      mustExist('PredictionMarket', market);

      // Validate the actor owns the thread
      const thread = (market as any).Thread;
      if (!actor.address_id) {
        throw new Error('Must be logged in to cancel a prediction market');
      }

      const isAuthor = thread.address_id === actor.address_id;
      if (!isAuthor) {
        throw new Error(
          'Only the thread author can cancel the prediction market',
        );
      }

      // Validate market status allows cancellation
      if (
        market.status !== PredictionMarketStatus.Draft &&
        market.status !== PredictionMarketStatus.Active
      ) {
        throw new Error('Can only cancel draft or active markets');
      }

      await models.sequelize.transaction(async (transaction) => {
        market.status = PredictionMarketStatus.Cancelled;
        await market.save({ transaction });
      });

      return true;
    },
  };
}
