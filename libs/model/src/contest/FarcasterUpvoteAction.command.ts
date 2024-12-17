import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
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
      const verified_address =
        payload.interactor.verified_addresses?.eth_addresses.at(0);

      if (!verified_address) {
        log.warn(
          'Farcaster verified address not found for upvote action- upvote will be ignored.',
        );
        return;
      }
      const { parent_hash, hash } = payload.cast;
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
