import { Command, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import {
  authThread,
  mustBeAuthorizedThread,
  mustExist,
} from '../../middleware';
import { emitEvent } from '../../utils/outbox';

export function CreatePredictionMarket(): Command<
  typeof schemas.CreatePredictionMarket
> {
  return {
    ...schemas.CreatePredictionMarket,
    auth: [authThread({ author: true })],
    secure: true,
    body: async ({ actor, payload, context }) => {
      const { thread, community_id, address } = mustBeAuthorizedThread(
        actor,
        context,
      );
      const { prompt, collateral_address, duration, resolution_threshold } =
        payload;

      // Check if a prediction market already exists for this thread
      const existingMarket = await models.PredictionMarket.findOne({
        where: { thread_id: thread.id },
      });
      if (existingMarket) {
        throw new InvalidState(
          'Prediction market already exists for this thread',
        );
      }

      const community = await models.Community.findByPk(community_id, {
        include: [
          {
            model: models.ChainNode,
            required: true,
          },
        ],
      });
      mustExist('Community with ChainNode', community);

      const eth_chain_id = community.ChainNode!.eth_chain_id;
      if (eth_chain_id === null || eth_chain_id === undefined) {
        throw new InvalidState('Community must have an eth_chain_id');
      }

      return await models.sequelize.transaction(async (transaction) => {
        const market = await models.PredictionMarket.create(
          {
            thread_id: thread.id!,
            eth_chain_id,
            collateral_address,
            creator_address: address.address,
            prompt,
            status: schemas.PredictionMarketStatus.Draft,
            duration,
            resolution_threshold,
            total_collateral: 0n,
          },
          { transaction },
        );

        await emitEvent(
          models.Outbox,
          [
            {
              event_name: 'PredictionMarketCreated',
              event_payload: market.toJSON(),
            },
          ],
          transaction,
        );

        return market.toJSON();
      });
    },
  };
}
