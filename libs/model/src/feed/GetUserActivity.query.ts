import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { getActivityFeed } from '../globalActivityCache';

export function GetUserActivity(): Query<typeof schemas.ThreadFeed> {
  return {
    ...schemas.ThreadFeed,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      return await getActivityFeed(models, actor.user.id);
    },
  };
}
