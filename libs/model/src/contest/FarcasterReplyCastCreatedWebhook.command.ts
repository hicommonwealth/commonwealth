import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { emitEvent, publishCast } from '../utils';

const log = logger(import.meta);

// This webhook processes the "cast.created" event
// from a programmatic Neynar webhook for REPLIES to a cast
export function FarcasterReplyCastCreatedWebhook(): Command<
  typeof schemas.FarcasterCastCreatedWebhook
> {
  return {
    ...schemas.FarcasterCastCreatedWebhook,
    auth: [],
    body: async ({ payload }) => {
      mustExist('Farcaster Cast Parent Hash', payload.data.parent_hash);
      mustExist('Farcaster Cast Author FID', payload.data.author?.fid);

      const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);

      // get user verified address
      const { users } = await client.fetchBulkUsers([payload.data.author.fid]);
      const verified_address = users[0].verified_addresses.eth_addresses.at(0);
      if (!verified_address) {
        log.warn(
          'Farcaster verified address not found for reply cast created event- content will be ignored.',
        );
        await publishCast(
          payload.data.hash,
          ({ username }) =>
            `Hey @${username}, you need a verified address to participate in the contest.`,
        );
        return;
      }

      await emitEvent(
        models.Outbox,
        [
          {
            event_name: schemas.EventNames.FarcasterReplyCastCreated,
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
