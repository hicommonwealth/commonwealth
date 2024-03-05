import { QueryMetadata, thread } from '@hicommonwealth/core';
import { models } from '../database';

export const GetBulkThread = (): QueryMetadata<
  typeof thread.GetBulkThreads
> => ({
  schemas: thread.GetBulkThreads,
  auth: [],
  body: async ({ payload }) => {
    return (
      await models.Thread.findOne({
        where: payload,
      })
    )?.get({ plain: true }) as any;
  },
});
