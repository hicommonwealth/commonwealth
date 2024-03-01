import { QueryMetadata, threads } from '@hicommonwealth/core';
import { z } from 'zod';
import { models } from '../database';

export const GetBulkThread = (): QueryMetadata<
  z.infer<typeof threads.GetBulkThreads.output>,
  typeof threads.GetBulkThreads.input
> => ({
  schema: threads.GetBulkThreads.input,
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
