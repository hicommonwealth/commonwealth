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
          contestManager.neynar_webhook_secret =
            neynarWebhook.webhook?.secrets.at(0)?.value;
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

        const community = await models.Community.findByPk(
          contestManager.community_id,
          {
            include: [
              {
                model: models.ChainNode,
                required: false,
              },
            ],
          },
        );
        mustExist('Community with Chain Node', community?.ChainNode);

        const contestManagers = [
          {
            url: community.ChainNode!.private_url! || community.ChainNode!.url!,
            contest_address: contestManager.contest_address,
            actions: [],
          },
        ];

        // create onchain content from reply cast
        mustExist(
          'Farcaster Author Custody Address',
          payload.author?.custody_address,
        );
        const content_url = buildFarcasterContentUrl(
          payload.parent_hash!,
          payload.hash,
        );
        await createOnchainContestContent({
          contestManagers,
          bypass_quota: true,
          author_address: payload.author.custody_address,
          content_url,
        });
      },
      FarcasterVoteCreated: async ({ payload }) => {
        const client = new NeynarAPIClient(config.CONTESTS.NEYNAR_API_KEY!);
        const castsResponse = await client.fetchBulkCasts([
          payload.untrustedData.castId.hash,
        ]);
        const { parent_hash, hash } = castsResponse.result.casts.at(0)!;
        const content_url = buildFarcasterContentUrl(parent_hash!, hash);

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

        // find content by url
        const contestActions = await models.ContestAction.findAll({
          where: {
            contest_address: contestManager.contest_address,
            action: 'added',
            content_url,
          },
        });

        const { users } = await client.fetchBulkUsers([
          payload.untrustedData.fid,
        ]);
        mustExist('Farcaster User', users[0]);

        const community = await models.Community.findByPk(
          contestManager.community_id,
          {
            include: [
              {
                model: models.ChainNode,
                required: false,
              },
            ],
          },
        );
        mustExist('Community with Chain Node', community?.ChainNode);

        const contestManagers = contestActions.map((ca) => ({
          url: community.ChainNode!.url! || community.ChainNode!.private_url!,
          contest_address: contestManager.contest_address,
          content_id: ca.content_id,
        }));

        await createOnchainContestVote({
          contestManagers,
          author_address: users[0].custody_address,
          content_url,
        });
      },
    },
  };
}
