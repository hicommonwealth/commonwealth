import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authRoles } from '../middleware';
import { mustExist } from '../middleware/guards';

const Errors = {
  InvalidTopics: 'Invalid topics',
};

export function UpdateContestManagerMetadata(): Command<
  typeof schemas.UpdateContestManagerMetadata
> {
  return {
    ...schemas.UpdateContestManagerMetadata,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const contestManager = await models.ContestManager.findOne({
        where: {
          community_id: payload.community_id,
          contest_address: payload.contest_address,
        },
      });

      mustExist('Contest Manager', contestManager);

      if (typeof payload.image_url !== 'undefined') {
        contestManager.image_url = payload.image_url;
      }

      if (typeof payload.name !== 'undefined') {
        contestManager.name = payload.name;
      }

      if (typeof payload.topic_id !== 'undefined') {
        const topic = await models.Topic.findByPk(payload.topic_id);
        if (!topic) {
          throw new InvalidState(Errors.InvalidTopics);
        }
        contestManager.topic_id = topic.id!;
      }

      await contestManager.save();

      return {
        contest_managers: [
          {
            ...contestManager.get({ plain: true }),
          },
        ],
      };
    },
  };
}
