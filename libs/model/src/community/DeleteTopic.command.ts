import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';
import { mustBeAuthorized, mustExist } from '../middleware/guards';

export function DeleteTopic(): Command<
  typeof schemas.DeleteTopic,
  AuthContext
> {
  return {
    ...schemas.DeleteTopic,
    auth: [isAuthorized({ roles: ['admin', 'moderator'] })],
    body: async ({ actor, auth }) => {
      const { community_id, topic_id } = mustBeAuthorized(actor, auth);

      const topicToDelete = await models.Topic.findOne({
        where: { community_id, id: topic_id! },
      });
      mustExist('Topic', topicToDelete);
      if (topicToDelete.is_default) {
        throw new InvalidState('Cannot delete the default topic');
      }

      const defaultTopic = await models.Topic.findOne({
        where: { community_id, is_default: true },
      });
      mustExist('Default Topic', defaultTopic);

      await models.sequelize.transaction(async (transaction) => {
        await models.Thread.update(
          { topic_id: defaultTopic.id!, archived_at: new Date() },
          {
            where: {
              community_id: topicToDelete.community_id,
              topic_id,
            },
            transaction,
          },
        );
        await topicToDelete.destroy({ transaction });
      });

      return { community_id, topic_id: topicToDelete.id! };
    },
  };
}
