import { EventNames, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { emitEvent } from '../utils';
import { buildFarcasterContentUrl } from '../utils/buildFarcasterContentUrl';

// This webhook processes the cast action event
export function FarcasterUpvoteAction(): Command<
  typeof schemas.FarcasterUpvoteAction
> {
  return {
    ...schemas.FarcasterUpvoteAction,
    auth: [],
    body: async ({ payload }) => {
      // find content from cast hash
      const content_url = buildFarcasterContentUrl(
        payload.untrustedData.castId.hash,
      );
      const addAction = await models.ContestAction.findOne({
        where: {
          action: 'added',
          content_url,
        },
      });
      mustExist('Contest Action', addAction);

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
