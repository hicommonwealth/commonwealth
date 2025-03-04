import { CacheNamespaces, EventHandler, cache } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';

export const handleThreadCreatedStatistic: EventHandler<
  'ThreadCreated',
  ZodUndefined
> = async ({ payload }) => {
  const { community_id } = payload;

  await cache().incrementKey(
    CacheNamespaces.Lifetime_Thread_Count,
    community_id,
  );
};
