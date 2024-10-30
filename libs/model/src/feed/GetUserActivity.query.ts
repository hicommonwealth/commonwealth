import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { getUserActivityFeed } from '../getUserActivityFeed';

export function GetUserActivity(): Query<typeof schemas.ActivityFeed> {
  return {
    ...schemas.ActivityFeed,
    auth: [],
    secure: true,
    body: async ({ actor, payload }) =>
      await getUserActivityFeed({
        user_id: actor.user.id,
        thread_limit: Math.min(payload.thread_limit ?? 50, 50),
        comment_limit: Math.min(payload.comment_limit ?? 3, 5),
      }),
  };
}
