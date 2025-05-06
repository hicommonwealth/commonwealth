import { InvalidState, logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';

const log = logger(import.meta);

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

      if (typeof payload.description !== 'undefined') {
        contestManager.description = payload.description;
      }

      if (typeof payload.topic_id !== 'undefined') {
        const topic = await models.Topic.findByPk(payload.topic_id);
        if (!topic) {
          throw new InvalidState(Errors.InvalidTopics);
        }
        contestManager.topic_id = topic.id!;
      }

      // only set judge token ID once
      if (typeof payload.namespace_judge_token_id !== 'undefined') {
        if (contestManager.namespace_judge_token_id) {
          log.warn(
            `Judge token ID already set for contest manager ${contestManager.contest_address}`,
          );
        } else {
          // TODO: check namespace contract to ensure token ID is valid?
          contestManager.namespace_judge_token_id =
            payload.namespace_judge_token_id;
        }
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
