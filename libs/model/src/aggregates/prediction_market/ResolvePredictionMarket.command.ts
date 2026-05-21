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

export function ResolvePredictionMarket(): Command<
  typeof schemas.ResolvePredictionMarket
> {
  return {
    ...schemas.ResolvePredictionMarket,
    auth: [authThread({ author: true })],
    secure: true,
    body: async ({ actor, payload, context }) => {
      const { thread } = mustBeAuthorizedThread(actor, context);
      const { prediction_market_id, winner } = payload;

      const market =
        await models.PredictionMarket.findByPk(prediction_market_id);
      mustExist('Prediction Market', market);

      if (market.thread_id !== thread.id) {
        throw new InvalidState(
          'Prediction market does not belong to this thread',
        );
      }

      if (market.status !== schemas.PredictionMarketStatus.Active) {
        throw new InvalidState(
          'Only active prediction markets can be resolved',
        );
      }

      return await models.sequelize.transaction(async (transaction) => {
        const resolved_at = new Date();
        await market.update(
          {
            status: schemas.PredictionMarketStatus.Resolved,
            winner,
            resolved_at,
          },
          { transaction },
        );

        await emitEvent(
          models.Outbox,
          [
            {
              event_name: 'PredictionMarketResolved',
              event_payload: {
                prediction_market_id: market.id!,
                winner,
                resolved_at,
              },
            } as EventPair<'PredictionMarketResolved'>,
          ],
          transaction,
        );

        return true;
      });
    },
  };
}
