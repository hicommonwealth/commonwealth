import { cache, CacheNamespaces, logger, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { EVENT_STREAM_FN_CACHE_KEY } from '../../policies/EventStream.policy';

const log = logger(import.meta);

export function GetEventStream(): Query<typeof schemas.EventStream> {
  return {
    ...schemas.EventStream,
    auth: [],
    secure: false,
    body: async () => {
      try {
        const cachedFeed = await cache().getKey(
          CacheNamespaces.Function_Response,
          EVENT_STREAM_FN_CACHE_KEY,
        );

        if (cachedFeed) {
          return { items: JSON.parse(cachedFeed) };
        }

        return { items: [] };
      } catch (err) {
        log.error(`Error getting event stream from cache`, err as Error);
        return { items: [] };
      }
    },
  };
}
