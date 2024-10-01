import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { buildFarcasterWebhookName } from '../utils/buildFarcasterWebhookName';

const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);

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
        return;
      }

      // get frame URL from embed
      const url = new URL(payload.data.embeds[0].url).pathname;
      console.log('URL: ', url);
      const castHash = payload.data.hash;

      // append frame hash to Contest Manager
      const [results] = await models.sequelize.query(
        `
          UPDATE "ContestManagers"
          SET "farcaster_frame_hashes" = COALESCE(
            array_append("farcaster_frame_hashes", :cast_hash),
            ARRAY[:cast_hash]
          )
          WHERE
            "farcaster_frame_url" = :farcaster_frame_url
          RETURNING "contest_address"
        `,
        {
          replacements: {
            cast_hash: castHash,
            farcaster_frame_url: url,
          },
        },
      );

      const contestAddress = (results as Array<{ contest_address?: string }>)[0]
        ?.contest_address;
      mustExist('Contest Manager', contestAddress);

      // create webhook to listen for replies on this cast
      const webhookName = buildFarcasterWebhookName(contestAddress, castHash);
      const webhook = await client.publishWebhook(
        webhookName,
        config.CONTESTS.NEYNAR_REPLY_WEBHOOK_URL!,
        {
          subscription: {
            'cast.created': {
              parent_hashes: [payload.data.hash],
            },
          },
        },
      );

      console.log(webhook);

      return { status: 'ok' };
    },
  };
}
