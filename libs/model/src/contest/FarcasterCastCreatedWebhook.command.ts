import { EventNames, InvalidInput, type Command } from '@hicommonwealth/core';
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

      await emitEvent(
        models.Outbox,
        [
          {
            event_name: EventNames.FarcasterCastCreated,
            event_payload: payload.data,
          },
        ],
        null,
      );
    },
  };
}
