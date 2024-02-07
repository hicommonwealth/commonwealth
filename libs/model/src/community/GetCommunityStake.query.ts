import { QueryMetadata } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';
import { CommunityStakeAttributes } from '../models/community_stake';

const schema = z.object({
  community_id: z.string(),
  stake_id: z.coerce.number().int().optional(),
});

export const GetCommunityStake: QueryMetadata<
  CommunityStakeAttributes,
  typeof schema
> = {
  schema,
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
};
