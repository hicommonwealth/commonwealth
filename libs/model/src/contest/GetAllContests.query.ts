import { Query, schemas } from '@hicommonwealth/core';
import { models } from '../database';

export const GetAllContests: Query<
  typeof schemas.queries.GetAllContests
> = () => ({
  ...schemas.queries.GetAllContests,
  auth: [],
  body: ({ payload }) =>
    models.ContestAction.findAll({ where: payload, raw: true }),
});
