import { CacheNamespaces, EventHandler, cache } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';

export const handleThreadReactedStatistic: EventHandler<
  'ThreadReacted',
  ZodUndefined
> = async ({ payload }) => {
  const { thread_id } = payload;

  await cache().incrementKey(CacheNamespaces.Thread_Reacted, `${thread_id}`);
};
