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

export function DeployPredictionMarket(): Command<
  typeof schemas.DeployPredictionMarket
> {
  return {
    ...schemas.DeployPredictionMarket,
    auth: [authThread({ author: true })],
    secure: true,
    body: async ({ actor, payload, context }) => {
      const { thread } = mustBeAuthorizedThread(actor, context);
      const {
        prediction_market_id,
        vault_address,
        governor_address,
        router_address,
        strategy_address,
        p_token_address,
        f_token_address,
        start_time,
        end_time,
      } = payload;

      const market =
        await models.PredictionMarket.findByPk(prediction_market_id);
      mustExist('Prediction Market', market);

      if (market.thread_id !== thread.id) {
        throw new InvalidState(
          'Prediction market does not belong to this thread',
        );
      }

      if (market.status !== schemas.PredictionMarketStatus.Draft) {
        throw new InvalidState('Only draft prediction markets can be deployed');
      }

      return await models.sequelize.transaction(async (transaction) => {
        await market.update(
          {
            vault_address,
            governor_address,
            router_address,
            strategy_address,
            p_token_address,
            f_token_address,
            start_time,
            end_time,
            status: schemas.PredictionMarketStatus.Active,
          },
          { transaction },
        );

        await emitEvent(
          models.Outbox,
          [
            {
              event_name: 'PredictionMarketDeployed',
              event_payload: {
                prediction_market_id: market.id!,
                proposal_id: market.proposal_id,
                market_id: market.market_id,
                eth_chain_id: market.eth_chain_id,
                vault_address,
                governor_address,
                router_address,
                strategy_address,
                p_token_address,
                f_token_address,
                start_time,
                end_time,
              },
            } as EventPair<'PredictionMarketDeployed'>,
          ],
          transaction,
        );

        return true;
      });
    },
  };
}
