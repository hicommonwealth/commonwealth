import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  GlobalActivityCache,
  getUserActivityFeed,
} from '../globalActivityCache';

export function GetUserActivity(): Query<typeof schemas.ActivityFeed> {
  return {
    ...schemas.ActivityFeed,
    auth: [],
    secure: false,
    body: async ({ actor, payload }) =>
      payload.is_global
        ? await GlobalActivityCache.getInstance().getGlobalActivity()
        : await getUserActivityFeed({
            user_id: actor.user?.id ?? 0,
            thread_limit: Math.min(payload.thread_limit ?? 50, 50),
            comment_limit: Math.min(payload.comment_limit ?? 3, 5),
          }),
  };
}
