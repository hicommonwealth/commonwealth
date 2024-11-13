import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authTopic } from '../middleware';
import { mustExist } from '../middleware/guards';

export function DeleteTopic(): Command<typeof schemas.DeleteTopic> {
  return {
    ...schemas.DeleteTopic,
    auth: [authTopic({ roles: ['admin', 'moderator'] })],
    body: async ({ payload }) => {
      const { community_id, topic_id } = payload;

      const topic = await models.Topic.findOne({
        where: { community_id, id: topic_id! },
      });
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

      return { community_id, topic_id: topic.id! };
    },
  };
}
