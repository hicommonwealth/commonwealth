import { Command, logger } from '@hicommonwealth/core';
import { rollOverContest } from '@hicommonwealth/evm-protocols';
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
        interval,
        ended,
        chain_url,
        chain_private_url,
        neynar_webhook_id,
      } = payload;

      await models.sequelize.transaction(async (transaction) => {
        if (interval === 0 && !ended) {
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
          oneOff: interval === 0,
        });

        await models.ContestManager.update(
          { ending: false }, // restart ending flag for future events
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
                recurring: interval > 0,
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
