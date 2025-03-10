import { command, Command, logger } from '@hicommonwealth/core';
import {
  getContestScore,
  mustBeProtocolChainId,
  rollOverContest,
} from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { config } from '../config';
import { models } from '../database';
import { systemActor } from '../middleware';
import { mustExist } from '../middleware/guards';
import { emitEvent, getChainNodeUrl } from '../utils/utils';
import { UpdateContestManagerFrameHashes } from './UpdateContestManagerFrameHashes.command';

const log = logger(import.meta);

export function SetContestEnded(): Command<typeof schemas.SetContestEnded> {
  return {
    ...schemas.SetContestEnded,
    auth: [],
    body: async ({ payload }) => {
      const {
        eth_chain_id,
        contest_address,
        contest_id,
        is_one_off,
        prize_percentage,
        payout_structure,
        chain_url,
        chain_private_url,
      } = payload;

      const rpc = getChainNodeUrl({
        url: chain_url,
        private_url: chain_private_url,
      });

      mustBeProtocolChainId(eth_chain_id);

      // better to get scores using views to avoid returning unbounded arrays in txs
      const { contestBalance, scores } = await getContestScore(
        { eth_chain_id, rpc },
        contest_address,
        prize_percentage,
        payout_structure,
        contest_id,
        is_one_off,
      );

      await rollOverContest({
        chain: { rpc, eth_chain_id },
        privateKey: config.WEB3.PRIVATE_KEY,
        contest: contest_address,
        oneOff: is_one_off,
      });

      const contestManager = await models.ContestManager.findByPk(
        contest_address,
        {
          attributes: ['farcaster_frame_hashes'],
        },
      );
      mustExist('Contest Manager', contestManager);

      if (contestManager.farcaster_frame_hashes?.length) {
        try {
          await command(UpdateContestManagerFrameHashes(), {
            actor: systemActor({}),
            payload: {
              contest_address,
              frames_to_remove: contestManager.farcaster_frame_hashes,
              webhooks_only: true,
            },
          });
        } catch (err) {
          log.error(
            'Failed to update contest manager frame hashes',
            err as Error,
          );
        }
      }

      await models.sequelize.transaction(async (transaction) => {
        // update final score
        await models.Contest.update(
          {
            score: scores,
            score_updated_at: new Date(),
            contest_balance: contestBalance,
          },
          { where: { contest_address, contest_id }, transaction },
        );

        // reset end/ending flags - preemptively endeding oneoffs so that rollover stops
        await models.ContestManager.update(
          { ending: false, ended: is_one_off },
          { where: { contest_address }, transaction },
        );

        await emitEvent(
          models.Outbox,
          [
            {
              event_name: 'ContestEnded',
              event_payload: {
                contest_address,
                contest_id,
                is_one_off,
                winners: scores.map((s) => ({
                  address: s.creator_address,
                  content: s.content_id,
                  votes: s.votes,
                  prize: s.prize,
                })),
              },
            },
          ],
          transaction,
        );
      });

      return {};
    },
  };
}
