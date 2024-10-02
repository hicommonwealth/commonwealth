import { EventNames, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { emitEvent } from '../utils';

// This webhook processes the "cast.created" event from Neynar:
// https://docs.neynar.com/docs/how-to-setup-webhooks-from-the-dashboard
export function FarcasterCastCreatedWebhook(): Command<
  typeof schemas.FarcasterCastCreatedWebhook
> {
  return {
    ...schemas.FarcasterCastCreatedWebhook,
    auth: [],
    body: async ({ payload }) => {
      // console.log('PAYLOAD: ', payload);
      if (payload.data.embeds.length === 0) {
        // ignore if no embed
        return;
      }
      // get frame URL from embed
      const frame_url = new URL(payload.data.embeds[0].url).pathname;
      const cast_hash = payload.data.hash;

      await emitEvent(
        models.Outbox,
        [
          {
            event_name: EventNames.FarcasterCastCreated,
            event_payload: {
              frame_url,
              cast_hash,
            },
          },
        ],
        null,
      );
    },
  };
}
