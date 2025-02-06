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
        ended,
        chain_url,
        chain_private_url,
        neynar_webhook_id,
      } = payload;

      await models.sequelize.transaction(async (transaction) => {
        if (is_one_off && !ended) {
          // preemptively mark as ended so that rollover
          // is not attempted again after failure
          await models.ContestManager.update(
            { ended: true },
            { where: { contest_address }, transaction },
          );
        }

        await rollOverContest({
          privateKey: config.WEB3.PRIVATE_KEY,
          rpc: getChainNodeUrl({
            url: chain_url,
            private_url: chain_private_url,
          }),
          contest: contest_address,
          oneOff: is_one_off,
        });
        // TODO: @rbennettcw can we get scores as a result of rollOverContest to avoid two calls?
        const score = await getContestScore(
          chain_url,
          contest_address,
          contest_id,
          is_one_off,
        );
        // TODO: @rbennettcw how to map results from getContestScore to contest score projection?
        const mapped = score.scores.map((s) => ({
          content_id: '0', // TODO: @rbennettcw how to get content id from getContestScore?
          creator_address: s.winningAddress,
          votes: s.voteCount,
          prize: '0', // TODO: @rbennettcw how to get prize from getContestScore?
        }));

        // reset ending flag when ended
        await models.ContestManager.update(
          { ending: false }, // restart ending flag for future events
          { where: { contest_address }, transaction },
        );

        // update final score
        await models.Contest.update(
          { score: mapped, score_updated_at: new Date() },
          { where: { contest_address, contest_id }, transaction },
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
                balance: score.contestBalance,
                winners: score.scores.map((s) => ({
                  address: s.winningAddress,
                  content: s.winningContent,
                  votes: s.voteCount,
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
