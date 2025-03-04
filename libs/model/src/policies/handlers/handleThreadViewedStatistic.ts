import { CacheNamespaces, EventHandler, cache } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';

export const handleThreadViewedStatistic: EventHandler<
  'ThreadViewed',
  ZodUndefined
> = async ({ payload }) => {
  const { thread_id } = payload;

  await cache().incrementKey(CacheNamespaces.Thread_View_Count, thread_id);
};
