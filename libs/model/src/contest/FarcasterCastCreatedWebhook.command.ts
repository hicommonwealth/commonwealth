import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

// This webhook processes the "cast.created" event from Neynar:
// https://docs.neynar.com/docs/how-to-setup-webhooks-from-the-dashboard
export function FarcasterCastCreatedWebhook(): Command<
  typeof schemas.FarcasterCastCreatedWebhook
> {
  return {
    ...schemas.FarcasterCastCreatedWebhook,
    auth: [],
    body: async ({ payload }) => {
      console.log('PAYLOAD: ', payload);

      if (payload.data.embeds.length === 0) {
        // not const embed
        return;
      }

      const url = new URL(payload.data.embeds[0].url);
      console.log('url pathname: ', url.pathname);

      // append frame hash to Contest Manager
      await models.sequelize.query(
        `
          UPDATE "ContestManagers"
          SET "farcaster_frame_hashes" = COALESCE(
            array_append("farcaster_frame_hashes", :newHash),
            ARRAY[:newHash]
          )
          WHERE "farcaster_frame_url" = :farcasterFrameUrl
          `,
        {
          replacements: {
            newHash: payload.data.hash,
            farcasterFrameUrl: url.pathname,
          },
        },
      );

      return { status: 'ok' };
    },
  };
}
