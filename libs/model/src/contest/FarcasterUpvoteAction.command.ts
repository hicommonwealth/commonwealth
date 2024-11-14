import { EventNames, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { buildFarcasterContentUrl, emitEvent } from '../utils';

// This webhook processes the cast action event
export function FarcasterUpvoteAction(): Command<
  typeof schemas.FarcasterUpvoteAction
> {
  return {
    ...schemas.FarcasterUpvoteAction,
    auth: [],
    body: async ({ payload }) => {
      // find contest manager from parent cast hash
      const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
      const castsResponse = await client.fetchBulkCasts([
        payload.untrustedData.castId.hash,
      ]);
      const { parent_hash, hash } = castsResponse.result.casts.at(0)!;
      const content_url = buildFarcasterContentUrl(parent_hash!, hash);
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
            event_name: EventNames.FarcasterVoteCreated,
            event_payload: {
              ...payload,
              contest_address: addAction.contest_address,
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
