import { Query, schemas } from '@hicommonwealth/core';
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
          'actorAddress',
          'votingPower',
          'contentId',
          'contentUrl',
          'createdAt',
        ],
      },
    });
    return result.map((r) => r.toJSON()) as any; // TODO: fix output schema
  },
});
