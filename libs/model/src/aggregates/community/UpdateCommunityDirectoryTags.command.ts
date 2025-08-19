import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { emitEvent } from '../../utils/outbox';
import { updateCommunityDirectoryTags } from '../../utils/updateCommunityDirectoryTags';

export function UpdateCommunityDirectoryTags(): Command<
  typeof schemas.UpdateCommunityDirectoryTags
> {
  return {
    ...schemas.UpdateCommunityDirectoryTags,
    auth: [authRoles('admin')],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, tag_names, selected_community_ids } = payload;

      await models.sequelize.transaction(async (transaction) => {
        await updateCommunityDirectoryTags(
          tag_names,
          community_id,
          selected_community_ids,
          transaction,
        );

        if (tag_names.length > 0) {
          await emitEvent(
            models.Outbox,
            [
              {
                event_name: 'CommunityDirectoryTagsUpdated',
                event_payload: {
                  community_id,
                  tag_names,
                  selected_community_ids,
                  created_at: new Date(),
                },
              },
            ],
            transaction,
          );
        }
      });

      return { community_id };
    },
  };
}
