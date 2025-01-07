import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { emitEvent } from '../utils';

// This webhook processes the "cast.created" event from Neynar
export function FarcasterCastCreatedWebhook(): Command<
  typeof schemas.FarcasterCastCreatedWebhook
> {
  return {
    ...schemas.FarcasterCastCreatedWebhook,
    auth: [],
    body: async ({ payload }) => {
      if (payload.data.embeds.length === 0) {
        throw new InvalidInput('embed must exist');
      }
      if (!payload.data.embeds[0].url.includes('/farcaster/contests/0x')) {
        throw new InvalidInput('invalid embed');
      }

      await emitEvent(
        models.Outbox,
        [
          {
            event_name: schemas.EventNames.FarcasterCastCreated,
            event_payload: payload.data,
          },
        ],
        null,
      );
    },
  };
}
