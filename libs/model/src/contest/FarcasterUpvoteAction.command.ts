import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { buildFarcasterContentUrl, emitEvent } from '../utils';

const log = logger(import.meta);

// This webhook processes the cast action event
export function FarcasterUpvoteAction(): Command<
  typeof schemas.FarcasterUpvoteAction
> {
  return {
    ...schemas.FarcasterUpvoteAction,
    auth: [],
    body: async ({ payload }) => {
      const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
      // get user verified address
      const { users } = await client.fetchBulkUsers([
        payload.untrustedData.fid,
      ]);
      const verified_address = users[0].verified_addresses.eth_addresses.at(0);
      if (!verified_address) {
        log.warn(
          'Farcaster verified address not found for upvote action- upvote will be ignored.',
        );
        return;
      }

      const castsResponse = await client.fetchBulkCasts([
        payload.untrustedData.castId.hash,
      ]);
      const { parent_hash, hash } = castsResponse.result.casts.at(0)!;
      const content_url = buildFarcasterContentUrl(parent_hash!, hash);

      // find content from farcaster hash
      const addAction = await models.ContestAction.findOne({
        where: {
          action: 'added',
          content_url,
        },
      });
      mustExist(`Contest Action (${content_url})`, addAction);

      await emitEvent(
        models.Outbox,
        [
          {
            event_name: schemas.EventNames.FarcasterVoteCreated,
            event_payload: {
              ...payload,
              contest_address: addAction.contest_address,
              verified_address,
            },
          },
        ],
        null,
      );

      return {
        message: 'Vote Added',
      };
    },
  };
}
