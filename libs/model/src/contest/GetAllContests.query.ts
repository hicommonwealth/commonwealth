import { Query, schemas } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';

export const GetAllContests: Query<
  typeof schemas.queries.GetAllContests
> = () => ({
  ...schemas.queries.GetAllContests,
  auth: [],
  body: async ({ payload }) => {
    const result = await models.Contest.findAll({
      where: payload,
      include: {
        model: models.ContestAction,
        attributes: [
          'action',
          'actor_address',
          'voting_power',
          'content_id',
          'content_url',
          'created_at',
        ],
        as: 'actions',
      },
    });
    return result.map((r) => r.toJSON()) as z.infer<
      typeof schemas.queries.GetAllContests.output
    >;
  },
});
