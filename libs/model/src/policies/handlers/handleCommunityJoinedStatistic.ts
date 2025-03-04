import { CacheNamespaces, EventHandler, cache } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';

export const handleCommunityJoinedStatistic: EventHandler<
  'CommunityJoined',
  ZodUndefined
> = async ({ payload }) => {
  const { community_id } = payload;

  await cache().incrementKey(
    CacheNamespaces.Community_Joined,
    `${community_id}`,
  );
};
