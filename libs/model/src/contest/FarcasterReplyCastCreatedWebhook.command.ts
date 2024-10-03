import { EventNames, InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { emitEvent } from '../utils';

// This webhook processes the "cast.created" event
// from a programmatic Neynar webhook for REPLIES to a cast
export function FarcasterReplyCastCreatedWebhook(): Command<
  typeof schemas.FarcasterCastCreatedWebhook
> {
  return {
    ...schemas.FarcasterCastCreatedWebhook,
    auth: [],
    body: async ({ payload }) => {
      if (!payload.data.parent_hash) {
        throw new InvalidInput('parent hash must exist');
      }

      await emitEvent(
        models.Outbox,
        [
          {
            event_name: EventNames.FarcasterReplyCastCreated,
            event_payload: payload.data,
          },
        ],
        null,
      );
    },
  };
}
