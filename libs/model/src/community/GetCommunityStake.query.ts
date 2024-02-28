import { QueryMetadata, schemas } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';

export const GetCommunityStake = (): QueryMetadata<
  z.infer<typeof schemas.community.GetCommunityStake.output>,
  typeof schemas.community.GetCommunityStake.input
> => ({
  schema: schemas.community.GetCommunityStake.input,
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
