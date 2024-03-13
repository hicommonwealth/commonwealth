import { QueryMetadata, schemas } from '@hicommonwealth/core';
import { models } from '../database';

export const GetCommunityStake = (): QueryMetadata<
  typeof schemas.queries.GetCommunityStake
> => ({
  schemas: schemas.queries.GetCommunityStake,
  auth: [],
  body: async ({ payload }) => {
    return (
      await models.CommunityStake.findOne({
        where: payload,
        include: [
          {
            model: models.Community,
            required: true,
            attributes: ['namespace'],
          },
        ],
      })
    )?.get({ plain: true });
  },
});
