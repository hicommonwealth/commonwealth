import { command, logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import {
  buildFarcasterContestFrameUrl,
  getBaseUrl,
} from '@hicommonwealth/shared';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { Op } from 'sequelize';
import { config, models } from '..';
import { CreateBotContest } from '../bot/CreateBotContest.command';
import { systemActor } from '../middleware';
import { mustExist } from '../middleware/guards';
import { DEFAULT_CONTEST_BOT_PARAMS } from '../services/openai/parseBotCommand';
import {
  buildFarcasterContentUrl,
  buildFarcasterWebhookName,
  publishCast,
} from '../utils';
import {
  createOnchainContestContent,
  createOnchainContestVote,
} from './utils/contest-utils';

const log = logger(import.meta);

const inputs = {
  FarcasterCastCreated: events.FarcasterCastCreated,
  FarcasterReplyCastCreated: events.FarcasterReplyCastCreated,
  FarcasterVoteCreated: events.FarcasterVoteCreated,
  FarcasterContestBotMentioned: events.FarcasterContestBotMentioned,
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
                model: models.ChainNode.scope('withPrivateData'),
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
        const content_url = buildFarcasterContentUrl(
          payload.parent_hash!,
          payload.hash,
        );
        await createOnchainContestContent({
          contestManagers,
          bypass_quota: true,
          author_address: payload.verified_address,
          content_url,
        });
      },
      FarcasterVoteCreated: async ({ payload }) => {
        const { parent_hash, hash } = payload.cast;
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

        const community = await models.Community.findByPk(
          contestManager.community_id,
          {
            include: [
              {
                model: models.ChainNode.scope('withPrivateData'),
                required: false,
              },
            ],
          },
        );
        mustExist('Community with Chain Node', community?.ChainNode);

        const contestManagers = contestActions.map((ca) => ({
          url: community.ChainNode!.private_url! || community.ChainNode!.url!,
          contest_address: contestManager.contest_address,
          content_id: ca.content_id,
        }));

        await createOnchainContestVote({
          contestManagers,
          author_address: payload.verified_address,
          content_url,
        });
      },
      FarcasterContestBotMentioned: async ({ payload }) => {
        const contestAddress = await command(CreateBotContest(), {
          actor: systemActor({}),
          payload: {
            castHash: payload.hash!,
            prompt: payload.text,
          },
        });
        if (contestAddress) {
          await publishCast(
            payload.hash,
            ({ username }) => {
              const {
                payoutStructure: [winner1, winner2, winner3],
                voterShare,
              } = DEFAULT_CONTEST_BOT_PARAMS;
              return `Hey @${username}, your contest has been created. The prize distribution is ${winner1}% to winner, ${winner2}% to second place, ${winner3}% to third , and ${voterShare}% going to voters. Anyone who replies to a cast containing the frame enters the contest.`;
            },
            {
              // eslint-disable-next-line max-len
              embed: `${getBaseUrl(config.APP_ENV, config.CONTESTS.FARCASTER_NGROK_DOMAIN!)}${buildFarcasterContestFrameUrl(contestAddress)}`,
            },
          );
        }
      },
    },
  };
}
