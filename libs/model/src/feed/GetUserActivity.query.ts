import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import {
  GlobalActivityCache,
  getUserActivityFeed,
} from '../globalActivityCache';

export function GetUserActivity(): Query<typeof schemas.ActivityFeed> {
  return {
    ...schemas.ActivityFeed,
    auth: [],
    secure: false,
    body: async ({ actor, payload }) => {
      // ensure we have a user id when not global
      const user_id = payload.is_global
        ? 0
        : (actor.user?.id ??
          (
            await models.Address.findOne({
              where: { address: actor.address },
              attributes: ['user_id'],
            })
          )?.user_id ??
          0);
      return payload.is_global
        ? await GlobalActivityCache.getInstance().getGlobalActivity()
        : await getUserActivityFeed({
            user_id,
            thread_limit: Math.min(payload.thread_limit ?? 50, 50),
            comment_limit: Math.min(payload.comment_limit ?? 3, 5),
          });
    },
  };
}
