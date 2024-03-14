import { Query, schemas } from '@hicommonwealth/core';

export const GetGlobalActivity: Query<
  typeof schemas.queries.ThreadFeed
> = () => ({
  ...schemas.queries.ThreadFeed,
  auth: [],
  body: async () => {
    // todo implement
    // return await globalActivityCache.getGlobalActivity();
    return {} as any;
  },
});
