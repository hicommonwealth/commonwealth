import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { GlobalActivityCache } from '../globalActivityCache';

export function GetGlobalActivity(): Query<typeof schemas.ActivityFeed> {
  return {
    ...schemas.ActivityFeed,
    auth: [],
    secure: false,
    body: async () =>
      await GlobalActivityCache.getInstance().getGlobalActivity(),
  };
}
