import { QueryMetadata, schemas } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';

const schema = z.object({
  community_id: z.string().describe('The community id'),
  stake_id: z.coerce
    .number()
    .int()
    .optional()
    .describe('The stake id or all stakes when undefined'),
});

export const GetCommunityStake = (): QueryMetadata<
  z.infer<typeof schemas.GetCommunityStakeSchema.output>,
  typeof schemas.GetCommunityStakeSchema.input
> => ({
  schema: schemas.GetCommunityStakeSchema.input,
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
