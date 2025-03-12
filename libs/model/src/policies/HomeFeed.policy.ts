import {
  cache,
  CacheNamespaces,
  config,
  logger,
  Policy,
} from '@hicommonwealth/core';
import {
  Community,
  ContestManager,
  events,
  Thread,
} from '@hicommonwealth/schemas';
import {
  buildCommunityUrl,
  buildContestLeaderboardUrl,
  getBaseUrl,
} from '@hicommonwealth/shared';
import { Mutex } from 'async-mutex';
import { z, ZodUndefined } from 'zod';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { buildThreadContentUrl } from '../utils';

const log = logger(import.meta);

const FEED_WINDOW_SIZE = 50;
const HOME_FEED_KEY = 'HOME_FEED';

const FeedSchemas = {
  ContestStarted: {
    input: events.ContestStarted,
    output: ContestManager.extend({}),
  },
  ContestEnding: {
    input: events.ContestEnding,
    output: ContestManager.extend({}),
  },
  ContestEnded: {
    input: events.ContestEnded,
    output: ContestManager.extend({}),
  },
  CommunityCreated: {
    input: events.CommunityCreated,
    output: Community.extend({}),
  },
  ThreadCreated: {
    input: events.ThreadCreated,
    output: Thread.extend({}),
  },
} as const;

type FeedItem<T extends keyof typeof FeedSchemas> = {
  type: T;
  data: z.infer<(typeof FeedSchemas)[T]['output']>;
  url: string;
};

type FeedMappers = {
  [K in keyof typeof FeedSchemas]: (
    payload: z.infer<(typeof FeedSchemas)[K]['input']>,
  ) => Promise<FeedItem<K>>;
};

// maps events to feed items
const feedMappers: FeedMappers = {
  ContestStarted: async (payload) => {
    const contestManager = await models.ContestManager.findByPk(
      payload.contest_address,
    );
    mustExist('ContestManager', contestManager);
    const leaderboardUrl = buildContestLeaderboardUrl(
      getBaseUrl(config.APP_ENV),
      contestManager.community_id,
      contestManager.contest_address,
    );
    return {
      type: 'ContestStarted',
      data: contestManager.get({ plain: true }),
      url: leaderboardUrl,
    };
  },
  ContestEnding: async (payload) => {
    const contestManager = await models.ContestManager.findByPk(
      payload.contest_address,
    );
    mustExist('ContestManager', contestManager);
    const leaderboardUrl = buildContestLeaderboardUrl(
      getBaseUrl(config.APP_ENV),
      contestManager.community_id,
      contestManager.contest_address,
    );
    return {
      type: 'ContestEnding',
      data: contestManager.get({ plain: true }),
      url: leaderboardUrl,
    };
  },
  ContestEnded: async (payload) => {
    const contestManager = await models.ContestManager.findByPk(
      payload.contest_address,
    );
    mustExist('ContestManager', contestManager);
    const leaderboardUrl = buildContestLeaderboardUrl(
      getBaseUrl(config.APP_ENV),
      contestManager.community_id,
      contestManager.contest_address,
    );
    return {
      type: 'ContestEnded',
      data: contestManager.get({ plain: true }),
      url: leaderboardUrl,
    };
  },
  CommunityCreated: async (payload) => {
    const community = await models.Community.findByPk(payload.community_id);
    mustExist('Community', community);
    const communityUrl = buildCommunityUrl(
      getBaseUrl(config.APP_ENV),
      community.id,
    );
    return {
      type: 'CommunityCreated',
      data: community.get({ plain: true }),
      url: communityUrl,
    };
  },
  ThreadCreated: async (payload) => {
    const thread = await models.Thread.findByPk(payload.id);
    mustExist('Thread', thread);
    const threadUrl = buildThreadContentUrl(thread.community_id, thread.id!);
    return {
      type: 'ThreadCreated',
      data: thread.get({ plain: true }),
      url: threadUrl,
    };
  },
};

const getFeed = async (): Promise<FeedItem<keyof typeof FeedSchemas>[]> => {
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

export function HomeFeedPolicy(): Policy<
  { [K in keyof typeof FeedSchemas]: (typeof FeedSchemas)[K]['input'] },
  ZodUndefined
> {
  return {
    inputs: {
      ContestStarted: FeedSchemas.ContestStarted.input,
      ContestEnding: FeedSchemas.ContestEnding.input,
      ContestEnded: FeedSchemas.ContestEnded.input,
      CommunityCreated: FeedSchemas.CommunityCreated.input,
      ThreadCreated: FeedSchemas.ThreadCreated.input,
    },
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
