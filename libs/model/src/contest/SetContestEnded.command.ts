import { Command, logger } from '@hicommonwealth/core';
import {
  getContestScore,
  rollOverContest,
} from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { config } from '../config';
import { models } from '../database';
import { emitEvent, getChainNodeUrl } from '../utils/utils';

const log = logger(import.meta);

async function cleanNeynarWebhook(
  contest_address: string,
  neynar_webhook_id: string,
) {
  try {
    const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
    await client.deleteWebhook(neynar_webhook_id);
    await models.ContestManager.update(
      {
        neynar_webhook_id: null,
        neynar_webhook_secret: null,
      },
      { where: { contest_address } },
    );
  } catch (err) {
    log.warn(`failed to delete neynar webhook: ${neynar_webhook_id}`);
  }
}

export function SetContestEnded(): Command<typeof schemas.SetContestEnded> {
  return {
    ...schemas.SetContestEnded,
    auth: [],
    body: async ({ payload }) => {
      const {
        contest_address,
        contest_id,
        is_one_off,
        prize_percentage,
        payout_structure,
        chain_url,
        chain_private_url,
        neynar_webhook_id,
      } = payload;

      const rpc = getChainNodeUrl({
        url: chain_url,
        private_url: chain_private_url,
      });

      await rollOverContest({
        privateKey: config.WEB3.PRIVATE_KEY,
        rpc,
        contest: contest_address,
        oneOff: is_one_off,
      });

      // better to get scores using views to avoid returning unbounded arrays in txs
      const score = await getContestScore(
        rpc,
        contest_address,
        prize_percentage,
        payout_structure,
        contest_id,
        is_one_off,
      );

      await models.sequelize.transaction(async (transaction) => {
        // update final score
        await models.Contest.update(
          { score, score_updated_at: new Date() },
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
              event_name: schemas.EventNames.ContestEnded,
              event_payload: {
                contest_address,
                contest_id,
                is_one_off,
                winners: score.map((s) => ({
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

      // clean up neynar webhooks when farcaster contest ends (fire and forget)
      if (neynar_webhook_id)
        void cleanNeynarWebhook(contest_address, neynar_webhook_id);

      return {};
    },
  };
}
