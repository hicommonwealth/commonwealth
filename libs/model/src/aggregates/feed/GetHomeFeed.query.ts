import { cache, CacheNamespaces, logger, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { HOME_FEED_KEY } from 'model/src/policies/HomeFeed.policy';

const log = logger(import.meta);

export function GetHomeFeed(): Query<typeof schemas.HomeFeed> {
  return {
    ...schemas.HomeFeed,
    auth: [],
    secure: false,
    body: async () => {
      try {
        const cachedFeed = await cache().getKey(
          CacheNamespaces.Function_Response,
          HOME_FEED_KEY,
        );

        if (cachedFeed) {
          return { items: JSON.parse(cachedFeed) };
        }

        return { items: [] };
      } catch (err) {
        log.error(`Error getting home feed from cache`, err as Error);
        return { items: [] };
      }
    },
  };
}
