import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { updateTags } from '../../utils/updateTags';
import { emitEvent } from '../../utils/utils';

export function UpdateCommunityTags(): Command<
  typeof schemas.UpdateCommunityTags
> {
  return {
    ...schemas.UpdateCommunityTags,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, tag_ids } = payload;

      await models.sequelize.transaction(async (transaction) => {
        await updateTags(tag_ids, community_id, 'community_id', transaction);
        if (tag_ids.length > 0)
          await emitEvent(
            models.Outbox,
            [
              {
                event_name: 'CommunityTagsUpdated',
                event_payload: {
                  community_id,
                  tag_ids,
                  created_at: new Date(),
                },
              },
            ],
            transaction,
          );
      });

      const tags = await models.Tags.findAll({
        where: { id: { [Op.in]: tag_ids } },
      });
      return { community_id, tags: tags.map((t) => t.toJSON()) };
    },
  };
}
