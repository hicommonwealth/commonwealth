import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { getUserActivityFeed } from '../globalActivityCache';

export function GetUserActivity(): Query<typeof schemas.ActivityFeed> {
  return {
    ...schemas.ActivityFeed,
    auth: [],
    secure: false,
    body: async ({ actor }) => await getUserActivityFeed(actor.user.id),
  };
}
