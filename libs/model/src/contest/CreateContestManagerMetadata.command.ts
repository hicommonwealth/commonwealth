import type { Command } from '@hicommonwealth/core';
import { InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { mustExist } from '../middleware/guards';
import { TopicInstance } from '../models';
import { buildFarcasterContestFrameUrl } from '../utils';

const Errors = {
  InvalidTopics: 'Invalid topic',
  StakeNotEnabled: 'Stake must be enabled to create a recurring contest',
};

export function CreateContestManagerMetadata(): Command<
  typeof schemas.CreateContestManagerMetadata,
  AuthContext
> {
  return {
    ...schemas.CreateContestManagerMetadata,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ payload }) => {
      const { id, topic_id, is_farcaster_contest, ...rest } = payload;

      // if stake is not enabled, only allow one-off contests
      const stake = await models.CommunityStake.findOne({
        where: {
          community_id: id,
        },
      });
      if (!stake && payload.interval > 0) {
        throw new InvalidState(Errors.StakeNotEnabled);
      }

      // verify topic exists
      let topic: TopicInstance | null = null;
      if (typeof topic_id !== 'undefined') {
        topic = await models.Topic.findByPk(topic_id);
        if (!topic) {
          throw new InvalidState(Errors.InvalidTopics);
        }
      }

      const contestManager = await models.sequelize.transaction(
        async (transaction) => {
          const manager = await models.ContestManager.create(
            {
              ...rest,
              community_id: id.toString(),
              created_at: new Date(),
              cancelled: false,
              farcaster_frame_url: is_farcaster_contest
                ? buildFarcasterContestFrameUrl(payload.contest_address)
                : null,
              topic_id: topic?.id || null,
              is_farcaster_contest: !!is_farcaster_contest,
            },
            { transaction },
          );
          return manager;
        },
      );

      mustExist('Contest Manager', contestManager);
      return {
        contest_managers: [
          {
            ...contestManager.get({ plain: true }),
            topic: topic?.get({ plain: true }),
          },
        ],
      };
    },
  };
}
