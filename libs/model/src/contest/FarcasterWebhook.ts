import { EventNames, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { emitEvent } from '../utils';

// This webhook processes the "cast.created" event from Neynar:
// https://docs.neynar.com/docs/how-to-setup-webhooks-from-the-dashboard
export function FarcasterWebhook(): Command<typeof schemas.FarcasterWebhook> {
  return {
    ...schemas.FarcasterWebhook,
    secure: false,
    // TODO: add middleware to validate webhook payload:
    // https://docs.neynar.com/docs/how-to-verify-the-incoming-webhooks-using-signatures
    auth: [],
    body: async ({ payload }) => {
      const { id, ...rest } = payload; // omit id from outbox payload
      return emitEvent(models.Outbox, [
        {
          event_name: EventNames.FarcasterCastCreated,
          event_payload: rest,
        },
      ]);
    },
  };
}
