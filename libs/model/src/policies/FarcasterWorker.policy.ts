import { events, logger, Policy } from '@hicommonwealth/core';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { config, models } from '..';
import { mustExist } from '../middleware/guards';
import { buildFarcasterWebhookName } from '../utils/buildFarcasterWebhookName';

const log = logger(import.meta);

const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);

const inputs = {
  CastCreated: events.FarcasterCastCreated,
  // ReplyCastCreated: events.FarcasterReplyCastCreated,
};

export function FarcasterWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      CastCreated: async ({ payload }) => {
        // append frame hash to Contest Manager
        const [results] = await models.sequelize.query(
          `
          UPDATE "ContestManagers"
          SET "farcaster_frame_hashes" = COALESCE(
            array_append("farcaster_frame_hashes", :cast_hash),
            ARRAY[:cast_hash]
          )
          WHERE
            "farcaster_frame_url" = :frame_url
          RETURNING "contest_address"
        `,
          {
            replacements: {
              cast_hash: payload.cast_hash,
              frame_url: payload.frame_url,
            },
          },
        );

        const contestAddress = (
          results as Array<{ contest_address?: string }>
        )[0]?.contest_address;
        mustExist('Contest Manager', contestAddress);

        // create webhook to listen for replies on this cast
        const webhookName = buildFarcasterWebhookName(
          contestAddress,
          payload.cast_hash,
        );
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

        log.debug(`created webhook: ${JSON.stringify(webhook, null, 2)}`);
      },
      // ReplyCastCreated: async ({ payload }) => {},
    },
  };
}
