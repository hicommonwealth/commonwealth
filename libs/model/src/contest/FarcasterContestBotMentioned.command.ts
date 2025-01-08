import { logger, type Command } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { emitEvent } from '../utils';

const log = logger(import.meta);

// This webhook processes the "cast.created" event
// triggered when the contest bot is mentioned on farcaster
export function FarcasterContestBotMentionedWebhook(): Command<
  typeof schemas.FarcasterContestBotMentionedWebhook
> {
  return {
    ...schemas.FarcasterContestBotMentionedWebhook,
    auth: [],
    body: async ({ payload }) => {
      mustExist('Farcaster Cast Author FID', payload.data.author?.fid);

      const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
      // get user verified address
      const { users } = await client.fetchBulkUsers([payload.data.author.fid]);
      const verified_address = users[0].verified_addresses.eth_addresses.at(0);
      if (!verified_address) {
        log.warn(
          'Farcaster verified address not found for contest bot mentioned event- will be ignored.',
        );
        // await publishCast(
        //   payload.data.hash,
        //   ({ username }) =>
        //     `Hey @${username}, you need a verified address to participate in the contest.`,
        // );
        return;
      }

      await emitEvent(
        models.Outbox,
        [
          {
            event_name: schemas.EventNames.FarcasterContestBotMentioned,
            event_payload: {
              ...payload.data,
              verified_address,
            },
          },
        ],
        null,
      );
    },
  };
}
