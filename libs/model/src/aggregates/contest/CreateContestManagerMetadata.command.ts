import type { Command } from '@hicommonwealth/core';
import { config, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  buildFarcasterContestFrameUrl,
  getDefaultContestImage,
} from '@hicommonwealth/shared';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';
import { TopicInstance } from '../../models';

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
    body: async ({ payload, actor }) => {
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
              creator_address: actor.address,
              community_id,
              created_at: new Date(),
              cancelled: false,
              farcaster_frame_url: is_farcaster_contest
                ? buildFarcasterContestFrameUrl(payload.contest_address)
                : null,
              topic_id: topic?.id || null,
              is_farcaster_contest: !!is_farcaster_contest,
              image_url: rest.image_url || getDefaultContestImage(),
              environment: config.APP_ENV,
              farcaster_author_cast_hash: undefined,
              // if judged contest, add creator as judge
              namespace_judges: payload.namespace_judge_token_id
                ? [actor.address!]
                : [],
            },
            { transaction },
          );

          // Clear the pending judge token ID from the community since it's now used by the contest
          if (payload.namespace_judge_token_id) {
            await models.Community.update(
              { pending_namespace_judge_token_id: null },
              { where: { id: community_id }, transaction },
            );
          }

          return manager;
        },
      );

      mustExist('Contest Manager', contestManager);
      const contestManagerData = contestManager.get({ plain: true });

      return {
        contest_managers: [
          {
            ...contestManagerData,
            farcaster_author_cast_hash:
              contestManagerData.farcaster_author_cast_hash || '',
            topic: topic?.get({ plain: true }),
          },
        ],
      };
    },
  };
}
