import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';
import { mustBeAuthorized, mustExist } from '../middleware/guards';

export function ArchiveTopic(): Command<
  typeof schemas.ArchiveTopic,
  AuthContext
> {
  return {
    ...schemas.ArchiveTopic,
    auth: [isAuthorized({ roles: ['admin', 'moderator'] })],
    body: async ({ actor, auth }) => {
      const { community_id, topic_id } = mustBeAuthorized(actor, auth);

      const topic = await models.Topic.findOne({
        where: { community_id, id: topic_id! },
      });
      mustExist('Topic', topic);

      await models.sequelize.transaction(async (transaction) => {
        await models.Thread.update(
          { archived_at: new Date() },
          {
            where: {
              community_id: topic.community_id,
              topic_id,
            },
            transaction,
          },
        );
        topic.archived_at = new Date();
        await topic.save({ transaction });
      });

      return { community_id, topic_id: topic.id! };
    },
  };
}
