import type { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ForumActionsEnum } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';

export function CheckGroupPermissions(): Query<
  typeof schemas.CheckGroupPermissions
> {
  return {
    ...schemas.CheckGroupPermissions,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, address, action } = payload;

      const groups = await this.models.sequelize.query(
        `
          SELECT GP.group_id, GP.topic_id, GP.allowed_actions FROM "Groups" G
          LEFT JOIN "GroupPermissions" GP ON G.id = GP.group_id 
          WHERE G.community_id = :communityId
        `,
        {
          type: QueryTypes.SELECT,
          raw: true,
          replacements: {
            communityId: community_id,
          },
        },
      );

      if (groups.length === 0) {
        return { allowed_actions: Object.values(ForumActionsEnum) };
      }

      return groups.filter((g) => g.allowed_actions.includes(action));
    },
  };
}
