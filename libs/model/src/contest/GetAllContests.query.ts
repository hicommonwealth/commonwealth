import { Query, schemas } from '@hicommonwealth/core';

export const GetAllContests: Query<
  typeof schemas.queries.GetAllContests
> = () => ({
  ...schemas.queries.GetAllContests,
  auth: [],
  body: async () => undefined,
});
