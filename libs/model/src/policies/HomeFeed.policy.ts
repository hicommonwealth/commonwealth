import { cache, CacheNamespaces, logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { Mutex } from 'async-mutex';
import { z, ZodUndefined } from 'zod';

const FEED_WINDOW_SIZE = 50;
const HOME_FEED_KEY = 'HOME_FEED';
const log = logger(import.meta);

const homeFeedInputs = {
  ContestStarted: events.ContestStarted,
  ContestEnding: events.ContestEnding,
  ContestEnded: events.ContestEnded,
  CommunityCreated: events.CommunityCreated,
  ThreadCreated: events.ThreadCreated,
  // TODO: add token/XP/stake events
};

type FeedItem = {
  type: keyof typeof homeFeedInputs;
  data: any;
  url: string;
};

type FeedMappers = {
  [K in keyof typeof homeFeedInputs]: (
    payload: z.infer<(typeof homeFeedInputs)[K]>,
  ) => Promise<FeedItem>;
};

const feedMappers: FeedMappers = {
  ContestStarted: async (payload) => {
    return {
      type: 'ContestStarted',
      data: payload,
      url: '',
    };
  },
  ContestEnding: async (payload) => {
    return {
      type: 'ContestEnding',
      data: payload,
      url: '',
    };
  },
  ContestEnded: async (payload) => {
    return {
      type: 'ContestEnded',
      data: payload,
      url: '',
    };
  },
  CommunityCreated: async (payload) => {
    return {
      type: 'CommunityCreated',
      data: payload,
      url: '',
    };
  },
  ThreadCreated: async (payload) => {
    return {
      type: 'ThreadCreated',
      data: payload,
      url: '',
    };
  },
};

const getFeed = async (): Promise<FeedItem[]> => {
  try {
    const cachedFeed = await cache().getKey(
      CacheNamespaces.Function_Response,
      HOME_FEED_KEY,
    );
    if (cachedFeed) {
      return JSON.parse(cachedFeed);
    }
    return [];
  } catch (err) {
    log.error(`Error getting home feed from cache`, err as Error);
    return [];
  }
};

const setFeed = async (feed: FeedItem[]) => {
  try {
    await cache().setKey(
      CacheNamespaces.Function_Response,
      HOME_FEED_KEY,
      JSON.stringify(feed),
    );
  } catch (err) {
    log.error(`Error getting home feed from cache`, err as Error);
  }
};

const feedMutex = new Mutex();

const addToHomeFeed = async (eventToAdd: FeedItem) => {
  await feedMutex.runExclusive(async () => {
    const oldFeed = await getFeed();
    const newFeed = [...oldFeed, eventToAdd];
    // if the feed exceeds the window size, remove the oldest items
    if (newFeed.length > FEED_WINDOW_SIZE) {
      return newFeed.slice(newFeed.length - FEED_WINDOW_SIZE);
    }
    await setFeed(newFeed);
  });
};

export function HomeFeedPolicy(): Policy<typeof homeFeedInputs, ZodUndefined> {
  return {
    inputs: homeFeedInputs,
    body: {
      ContestStarted: async ({ payload }) => {
        await addToHomeFeed(await feedMappers.ContestStarted(payload));
      },
      ContestEnding: async ({ payload }) => {
        await addToHomeFeed(await feedMappers.ContestEnding(payload));
      },
      ContestEnded: async ({ payload }) => {
        await addToHomeFeed(await feedMappers.ContestEnded(payload));
      },
      CommunityCreated: async ({ payload }) => {
        await addToHomeFeed(await feedMappers.CommunityCreated(payload));
      },
      ThreadCreated: async ({ payload }) => {
        await addToHomeFeed(await feedMappers.ThreadCreated(payload));
      },
    },
  };
}
