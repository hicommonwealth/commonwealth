import { events, logger, Policy } from '@hicommonwealth/core';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { Op } from 'sequelize';
import { config, models } from '..';
import { mustExist } from '../middleware/guards';
import { buildFarcasterWebhookName } from '../utils/buildFarcasterWebhookName';
import { createOnchainContestContent } from './utils';

const log = logger(import.meta);

const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);

const inputs = {
  FarcasterCastCreated: events.FarcasterCastCreated,
  FarcasterReplyCastCreated: events.FarcasterReplyCastCreated,
};

export function FarcasterWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      FarcasterCastCreated: async ({ payload }) => {
        const frame_url = new URL(payload.embeds[0].url).pathname;

        const contestManager = await models.ContestManager.findOne({
          where: {
            farcaster_frame_url: frame_url,
          },
        });
        mustExist('Contest Manager', contestManager);

        // append frame hash to Contest Manager
        // NOTE: this will never execute concurrently
        contestManager.farcaster_frame_hashes =
          contestManager.farcaster_frame_hashes || [];
        if (!contestManager.farcaster_frame_hashes.includes(payload.hash)) {
          contestManager.farcaster_frame_hashes.push(payload.hash);
        }
        await contestManager.save();

        // create webhook to listen for replies on this cast
        const webhookName = buildFarcasterWebhookName(
          contestManager.contest_address,
          payload.hash,
        );
        await client.publishWebhook(
          webhookName,
          config.CONTESTS.NEYNAR_REPLY_WEBHOOK_URL!,
          {
            subscription: {
              'cast.created': {
                parent_hashes: [payload.hash],
              },
            },
          },
        );
      },
      FarcasterReplyCastCreated: async ({ payload }) => {
        // find associated contest manager by parent cast hash
        const contestManager = await models.ContestManager.findOne({
          where: {
            cancelled: false,
            ended: {
              [Op.not]: true,
            },
            farcaster_frame_hashes: {
              [Op.contains]: [payload.parent_hash!],
            },
          },
        });
        mustExist('Contest Manager', contestManager);

        const contestTopic = await models.ContestTopic.findOne({
          where: {
            contest_address: contestManager.contest_address,
          },
        });
        mustExist('Contest Topic', contestTopic);

        // create onchain content from reply cast
        const content_url = `/farcaster/${payload.hash}`;
        await createOnchainContestContent({
          community_id: contestManager.community_id,
          topic_id: contestTopic.topic_id,
          author_address: payload.author.custody_address,
          content_url,
        });
      },
    },
  };
}
