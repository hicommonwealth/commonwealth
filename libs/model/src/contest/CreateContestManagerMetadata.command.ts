import type { Command } from '@hicommonwealth/core';
import { InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { buildFarcasterContestFrameUrl } from '@hicommonwealth/shared';
import { models } from '../database';
import { authRoles } from '../middleware';
import { mustExist } from '../middleware/guards';
import { TopicInstance } from '../models';
import { getDefaultContestImage } from '../utils';

const Errors = {
  InvalidTopics: 'Invalid topic',
  StakeNotEnabled: 'Stake must be enabled to create a recurring contest',
};

export function CreateContestManagerMetadata(): Command<
  typeof schemas.CreateContestManagerMetadata
> {
  return {
    ...schemas.CreateContestManagerMetadata,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, topic_id, is_farcaster_contest, ...rest } = payload;

      // if stake is not enabled, only allow one-off contests
      const stake = await models.CommunityStake.findOne({
        where: {
          community_id,
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
              community_id,
              created_at: new Date(),
              cancelled: false,
              farcaster_frame_url: is_farcaster_contest
                ? buildFarcasterContestFrameUrl(payload.contest_address)
                : null,
              topic_id: topic?.id || null,
              is_farcaster_contest: !!is_farcaster_contest,
              image_url: rest.image_url || getDefaultContestImage(),
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
