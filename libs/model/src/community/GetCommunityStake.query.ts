import { QueryMetadata, schemas } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';

export const GetCommunityStake = (): QueryMetadata<
  z.infer<typeof schemas.GetCommunityStake.output>,
  typeof schemas.GetCommunityStake.input
> => ({
  schema: schemas.GetCommunityStake.input,
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
