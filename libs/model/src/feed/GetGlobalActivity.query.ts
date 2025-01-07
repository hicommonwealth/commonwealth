import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { getUserActivityFeed } from '../getUserActivityFeed';

export function GetGlobalActivity(): Query<typeof schemas.ActivityFeed> {
  return {
    ...schemas.ActivityFeed,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { comment_limit = 3, limit = 10, cursor = 1 } = payload;
      return await getUserActivityFeed({
        user_id: 0,
        comment_limit,
        limit,
        cursor,
      });
    },
  };
}
