import { Query, schemas } from '@hicommonwealth/core';
import { models } from '../database';
import { GlobalActivityCache } from '../globalActivityCache';

export const GetGlobalActivity: Query<
  typeof schemas.queries.ThreadFeed
> = () => ({
  ...schemas.queries.ThreadFeed,
  auth: [],
  body: async () => {
    return await GlobalActivityCache.getInstance(models).getGlobalActivity();
  },
});
