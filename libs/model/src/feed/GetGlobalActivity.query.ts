import { Query } from '@hicommonwealth/core';
import { queries } from '@hicommonwealth/schemas';
import { models } from '../database';
import { GlobalActivityCache } from '../globalActivityCache';

export const GetGlobalActivity: Query<typeof queries.ThreadFeed> = () => ({
  ...queries.ThreadFeed,
  auth: [],
  body: async () => {
    return await GlobalActivityCache.getInstance(models).getGlobalActivity();
  },
});
