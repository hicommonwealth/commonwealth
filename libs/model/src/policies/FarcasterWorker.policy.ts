import { events, logger, Policy } from '@hicommonwealth/core';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { Op } from 'sequelize';
import { config, models } from '..';
import { mustExist } from '../middleware/guards';
import { buildFarcasterContentUrl, buildFarcasterWebhookName } from '../utils';
import {
  createOnchainContestContent,
  createOnchainContestVote,
} from './contest-utils';

const log = logger(import.meta);

const inputs = {
  FarcasterCastCreated: events.FarcasterCastCreated,
  FarcasterReplyCastCreated: events.FarcasterReplyCastCreated,
  FarcasterVoteCreated: events.FarcasterVoteCreated,
};

export function FarcasterWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      FarcasterCastCreated: async ({ payload }) => {
        const frame_url = new URL(payload.embeds[0].url).pathname;
        const contest_address = frame_url
          .split('/')
          .find((str) => str.startsWith('0x'));

        const contestManager = await models.ContestManager.findOne({
          where: {
            cancelled: {
              [Op.not]: true,
            },
            ended: {
              [Op.not]: true,
            },
            contest_address,
          },
        });
        mustExist('Contest Manager', contestManager);

        if (contestManager.farcaster_frame_hashes?.includes(payload.hash)) {
          log.warn(
            `farcaster frame hash already added to contest manager: ${payload.hash}`,
          );
          return;
        }

        // create/update webhook to listen for replies on this cast
        const webhookName = buildFarcasterWebhookName(
          contestManager.contest_address,
        );

        // if webhook exists, update target hashes, otherwise create new webhook
        const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
        if (contestManager.neynar_webhook_id) {
          await client.updateWebhook(
            contestManager.neynar_webhook_id,
            webhookName,
            config.CONTESTS.NEYNAR_REPLY_WEBHOOK_URL!,
            {
              subscription: {
                'cast.created': {
                  parent_hashes: [
                    ...(contestManager.farcaster_frame_hashes || []),
                    payload.hash,
                  ],
                },
              },
            },
          );
        } else {
          const neynarWebhook = await client.publishWebhook(
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
          contestManager.neynar_webhook_id = neynarWebhook.webhook!.webhook_id;
        }

        // append frame hash to Contest Manager
        contestManager.farcaster_frame_hashes = [
          ...(contestManager.farcaster_frame_hashes || []),
          payload.hash,
        ];

        await contestManager.save();
      },
      FarcasterReplyCastCreated: async ({ payload }) => {
        // find associated contest manager by parent cast hash
        const contestManager = await models.ContestManager.findOne({
          where: {
            cancelled: {
              [Op.not]: true,
            },
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
        const content_url = buildFarcasterContentUrl(payload.hash);
        await createOnchainContestContent({
          community_id: contestManager.community_id,
          topic_id: contestTopic.topic_id,
          author_address: payload.author.custody_address,
          content_url,
        });
      },
      FarcasterVoteCreated: async ({ payload }) => {
        const contestManager = await models.ContestManager.findOne({
          where: {
            cancelled: {
              [Op.not]: true,
            },
            ended: {
              [Op.not]: true,
            },
            contest_address: payload.contest_address,
          },
        });
        mustExist('Contest Manager', contestManager);

        const contestTopic = await models.ContestTopic.findOne({
          where: {
            contest_address: contestManager.contest_address,
          },
        });
        mustExist('Contest Topic', contestTopic);

        const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);

        const { users } = await client.fetchBulkUsers([
          payload.untrustedData.fid,
        ]);
        mustExist('Farcaster User', users[0]);

        const content_url = buildFarcasterContentUrl(
          payload.untrustedData.castId.hash,
        );
        await createOnchainContestVote({
          community_id: contestManager.community_id,
          topic_id: contestTopic.topic_id,
          author_address: users[0].custody_address,
          content_url,
        });
      },
    },
  };
}
