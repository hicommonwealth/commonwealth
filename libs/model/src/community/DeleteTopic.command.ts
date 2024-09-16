import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';
import { mustExist } from '../middleware/guards';

export function DeleteTopic(): Command<
  typeof schemas.DeleteTopic,
  AuthContext
> {
  return {
    ...schemas.DeleteTopic,
    auth: [isAuthorized({})],
    body: async ({ payload }) => {
      const { topic_id } = payload;

      // TODO: get from auth
      const topic = await models.Topic.findByPk(topic_id);
      mustExist('Topic', topic);

      await models.sequelize.transaction(async (transaction) => {
        await models.Thread.update(
          { topic_id: null },
          {
            where: {
              community_id: topic.community_id,
              topic_id,
            },
            transaction,
          },
        );
        await topic.destroy({ transaction });
      });

      return {
        community_id: topic.community_id,
        topic_id,
      };
    },
  };
}
