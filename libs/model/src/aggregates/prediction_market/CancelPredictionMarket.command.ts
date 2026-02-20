import { Command, InvalidState } from '@hicommonwealth/core';
import type { EventPair } from '@hicommonwealth/schemas';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import {
  authThread,
  mustBeAuthorizedThread,
  mustExist,
} from '../../middleware';
import { emitEvent } from '../../utils/outbox';

export function CancelPredictionMarket(): Command<
  typeof schemas.CancelPredictionMarket
> {
  return {
    ...schemas.CancelPredictionMarket,
    auth: [authThread({ author: true })],
    secure: true,
    body: async ({ actor, payload, context }) => {
      const { thread } = mustBeAuthorizedThread(actor, context);
      const { prediction_market_id } = payload;

      const market =
        await models.PredictionMarket.findByPk(prediction_market_id);
      mustExist('Prediction Market', market);

      if (market.thread_id !== thread.id) {
        throw new InvalidState(
          'Prediction market does not belong to this thread',
        );
      }

      if (
        market.status !== schemas.PredictionMarketStatus.Draft &&
        market.status !== schemas.PredictionMarketStatus.Active
      ) {
        throw new InvalidState(
          'Only draft or active prediction markets can be cancelled',
        );
      }

      return await models.sequelize.transaction(async (transaction) => {
        await market.update(
          { status: schemas.PredictionMarketStatus.Cancelled },
          { transaction },
        );

        await emitEvent(
          models.Outbox,
          [
            {
              event_name: 'PredictionMarketCancelled',
              event_payload: {
                prediction_market_id: market.id!,
              },
            } as EventPair<'PredictionMarketCancelled'>,
          ],
          transaction,
        );

        return true;
      });
    },
  };
}
