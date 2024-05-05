import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { GlobalActivityCache } from '../globalActivityCache';

export function GetGlobalActivity(): Query<typeof schemas.ThreadFeed> {
  return {
    ...schemas.ThreadFeed,
    auth: [],
    body: async () => {
      return await GlobalActivityCache.getInstance(models).getGlobalActivity();
    },
  };
}
