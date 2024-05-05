import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { GlobalActivityCache } from '../globalActivityCache';

export const GetGlobalActivity: Query<typeof schemas.ThreadFeed> = () => ({
  ...schemas.ThreadFeed,
  auth: [],
  body: async () => {
    return await GlobalActivityCache.getInstance(models).getGlobalActivity();
  },
});
