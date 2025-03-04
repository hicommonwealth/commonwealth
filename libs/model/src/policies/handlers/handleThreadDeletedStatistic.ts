import { CacheNamespaces, EventHandler, cache } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';

export const handleThreadDeletedStatistic: EventHandler<
  'ThreadDeleted',
  ZodUndefined
> = async ({ payload }) => {
  const { community_id } = payload;

  await cache().decrementKey(
    CacheNamespaces.Lifetime_Thread_Count,
    community_id!,
  );
};
