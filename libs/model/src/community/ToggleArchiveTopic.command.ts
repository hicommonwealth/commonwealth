import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';
import { mustBeAuthorized, mustExist } from '../middleware/guards';

export function ToggleArchiveTopic(): Command<
  typeof schemas.ToggleArchiveTopic,
  AuthContext
> {
  return {
    ...schemas.ToggleArchiveTopic,
    auth: [isAuthorized({ roles: ['admin', 'moderator'] })],
    body: async ({ actor, payload, auth }) => {
      const { community_id, topic_id } = mustBeAuthorized(actor, auth);
      const { archive } = payload;

      const topic = await models.Topic.findOne({
        where: { community_id, id: topic_id! },
      });
      mustExist('Topic', topic);

      if ((archive && topic.archived_at) || (!archive && !topic.archived_at)) {
        return { community_id, topic_id: topic.id! };
      }

      // WARN: threads and topic must have the same archival date
      // so that unarchival can avoid unarchiving threads that were manually
      // archived separately
      const archivalDate = archive ? new Date() : null;
      await models.sequelize.transaction(async (transaction) => {
        await models.Thread.update(
          { archived_at: archivalDate },
          {
            where: {
              community_id: topic.community_id,
              topic_id: topic_id!,
              // don't update archival date for already archived threads
              // see warning above
              archived_at: null,
            },
            transaction,
          },
        );
        topic.archived_at = archivalDate;
        await topic.save({ transaction });
      });

      return { community_id, topic_id: topic.id! };
    },
  };
}
