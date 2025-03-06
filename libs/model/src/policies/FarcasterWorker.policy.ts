import { command, logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import {
  buildFarcasterContestFrameUrl,
  getBaseUrl,
} from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { config, models } from '..';
import { CreateBotContest } from '../bot/CreateBotContest.command';
import { UpdateContestManagerFrameHashes } from '../contest/UpdateContestManagerFrameHashes.command';
import { systemActor } from '../middleware';
import { mustExist } from '../middleware/guards';
import { DEFAULT_CONTEST_BOT_PARAMS } from '../services/openai/parseBotCommand';
import {
  buildFarcasterContentUrl,
  getChainNodeUrl,
  publishCast,
} from '../utils';
import {
  createOnchainContestContent,
  createOnchainContestVote,
} from './utils/contest-utils';

const log = logger(import.meta);

const inputs = {
  FarcasterCastCreated: events.FarcasterCastCreated,
  FarcasterCastDeleted: events.FarcasterCastDeleted,
  FarcasterReplyCastCreated: events.FarcasterReplyCastCreated,
  FarcasterReplyCastDeleted: events.FarcasterReplyCastDeleted,
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
        mustExist('Contest Address', contest_address);

        await command(UpdateContestManagerFrameHashes(), {
          actor: systemActor({}),
          payload: {
            contest_address,
            frames_to_add: [payload.hash],
          },
        });
      },
      FarcasterCastDeleted: async ({ payload }) => {
        const frame_url = new URL(payload.embeds[0].url).pathname;
        const contest_address = frame_url
          .split('/')
          .find((str) => str.startsWith('0x'));
        mustExist('Contest Address', contest_address);

        await command(UpdateContestManagerFrameHashes(), {
          actor: systemActor({}),
          payload: {
            contest_address,
            frames_to_remove: [payload.hash],
          },
        });
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
                required: true,
              },
            ],
          },
        );
        mustExist('Community with Chain Node', community?.ChainNode);

        log.error(
          `[FarcasterReplyCastCreated] CHAIN NODE: ${community.ChainNode.id}`,
        );

        const content_url = buildFarcasterContentUrl(
          payload.parent_hash!,
          payload.hash,
          payload.author!.fid,
        );

        // create onchain content from reply cast
        const contestManagers = [
          {
            url: getChainNodeUrl(community.ChainNode!),
            contest_address: contestManager.contest_address,
            actions: [],
          },
        ];
        await createOnchainContestContent({
          contestManagers,
          bypass_quota: true,
          author_address: payload.verified_address,
          content_url,
        });
      },
      FarcasterReplyCastDeleted: async ({ payload }) => {
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

        const content_url = buildFarcasterContentUrl(
          payload.parent_hash!,
          payload.hash,
          payload.author!.fid,
        );

        // mark the content as deleted, but keep the record
        // because the onchain content is immutable
        await models.ContestAction.update(
          {
            cast_deleted_at: new Date(),
          },
          {
            where: {
              action: 'added',
              contest_address: contestManager.contest_address,
              content_url,
            },
          },
        );
      },
      FarcasterVoteCreated: async ({ payload }) => {
        const { parent_hash, hash } = payload.cast;
        const contentUrlWithoutFid = buildFarcasterContentUrl(
          parent_hash!,
          hash,
        );

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
            content_url: {
              // check prefix because fid may be attached as query param
              [Op.like]: `${contentUrlWithoutFid}%`,
            },
          },
        });
        mustExist('Contest Actions', contestActions?.[0]);

        const community = await models.Community.findByPk(
          contestManager.community_id,
          {
            include: [
              {
                model: models.ChainNode.scope('withPrivateData'),
                required: true,
              },
            ],
          },
        );
        mustExist('Community with Chain Node', community?.ChainNode);

        const contestManagers = contestActions.map((ca) => ({
          url: getChainNodeUrl(community.ChainNode!),
          contest_address: contestManager.contest_address,
          content_id: ca.content_id,
        }));

        await createOnchainContestVote({
          contestManagers,
          author_address: payload.verified_address,
          content_url: contestActions[0].content_url!,
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
              // eslint-disable-next-line max-len
              return `Hey @${username}, your contest has been created. The prize distribution is ${winner1}% to winner, ${winner2}% to second place, ${winner3}% to third , and ${voterShare}% going to voters. The contest will run for 7 days. Anyone who replies to a cast containing the frame enters the contest.`;
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
