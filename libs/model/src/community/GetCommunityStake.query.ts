import { QueryMetadata, community } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';

export const GetCommunityStake = (): QueryMetadata<
  z.infer<typeof community.GetCommunityStake.output>,
  typeof community.GetCommunityStake.input
> => ({
  schema: community.GetCommunityStake.input,
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
