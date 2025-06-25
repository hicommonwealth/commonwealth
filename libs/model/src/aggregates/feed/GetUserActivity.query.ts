import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { getUserActivityFeed } from '../../utils/getUserActivityFeed';

export function GetUserActivity(): Query<typeof schemas.ActivityFeed> {
  return {
    ...schemas.ActivityFeed,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const { comment_limit = 3, limit = 10, cursor = 1 } = payload;
      return await getUserActivityFeed({
        user_id: actor.user.id,
        is_admin: actor.user.isAdmin || false,
        comment_limit,
        limit,
        cursor,
      });
    },
  };
}
