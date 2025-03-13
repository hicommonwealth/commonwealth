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
import { z } from 'zod';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { buildThreadContentUrl } from '../utils';

const log = logger(import.meta);

export const EVENT_STREAM_WINDOW_SIZE = 50;

// lists all the events that can be added to the event stream
const EventStreamSchemas = {
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

const getContestManagerUrl = (
  contestManager: z.infer<typeof ContestManager>,
) => {
  if (contestManager.is_farcaster_contest) {
    return buildContestLeaderboardUrl(
      getBaseUrl(config.APP_ENV),
      contestManager.community_id,
      contestManager.contest_address,
    );
  }
  return (
    getBaseUrl(config.APP_ENV) +
    `/common/discussions?featured=mostLikes&contest=${contestManager.contest_address}`
  );
};

// maps events to event stream items
const eventStreamMappers: EventStreamMappers = {
  ContestStarted: async (payload) => {
    const contestManager = await models.ContestManager.findOne({
      where: {
        contest_address: payload.contest_address,
        environment: config.APP_ENV,
      },
    });
    mustExist('ContestManager', contestManager);
    return {
      type: 'ContestStarted',
      data: contestManager.get({ plain: true }),
      url: getContestManagerUrl(contestManager),
    };
  },
  ContestEnding: async (payload) => {
    const contestManager = await models.ContestManager.findOne({
      where: {
        contest_address: payload.contest_address,
        environment: config.APP_ENV,
      },
    });
    mustExist('ContestManager', contestManager);
    return {
      type: 'ContestEnding',
      data: contestManager.get({ plain: true }),
      url: getContestManagerUrl(contestManager),
    };
  },
  ContestEnded: async (payload) => {
    const contestManager = await models.ContestManager.findOne({
      where: {
        contest_address: payload.contest_address,
        environment: config.APP_ENV,
      },
    });
    mustExist('ContestManager', contestManager);
    return {
      type: 'ContestEnded',
      data: contestManager.get({ plain: true }),
      url: getContestManagerUrl(contestManager),
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
    const threadUrl =
      getBaseUrl(config.APP_ENV) +
      buildThreadContentUrl(thread.community_id, thread.id!);
    return {
      type: 'ThreadCreated',
      data: thread.get({ plain: true }),
      url: threadUrl,
    };
  },
};

export function EventStreamPolicy(): Policy<{
  [K in keyof typeof EventStreamSchemas]: (typeof EventStreamSchemas)[K]['input'];
}> {
  return {
    inputs: {
      ContestStarted: EventStreamSchemas.ContestStarted.input,
      ContestEnding: EventStreamSchemas.ContestEnding.input,
      ContestEnded: EventStreamSchemas.ContestEnded.input,
      CommunityCreated: EventStreamSchemas.CommunityCreated.input,
      ThreadCreated: EventStreamSchemas.ThreadCreated.input,
    },
    body: {
      ContestStarted: async ({ payload }) => {
        await addToEventStream(
          await eventStreamMappers.ContestStarted(payload),
        );
      },
      ContestEnding: async ({ payload }) => {
        await addToEventStream(await eventStreamMappers.ContestEnding(payload));
      },
      ContestEnded: async ({ payload }) => {
        await addToEventStream(await eventStreamMappers.ContestEnded(payload));
      },
      CommunityCreated: async ({ payload }) => {
        await addToEventStream(
          await eventStreamMappers.CommunityCreated(payload),
        );
      },
      ThreadCreated: async ({ payload }) => {
        await addToEventStream(await eventStreamMappers.ThreadCreated(payload));
      },
    },
  };
}

// ---

export type EventStreamItem<T extends keyof typeof EventStreamSchemas> = {
  type: T;
  data: z.infer<(typeof EventStreamSchemas)[T]['output']>;
  url: string;
};

export type EventStreamMappers = {
  [K in keyof typeof EventStreamSchemas]: (
    payload: z.infer<(typeof EventStreamSchemas)[K]['input']>,
  ) => Promise<EventStreamItem<K>>;
};

const eventStreamMutex = new Mutex();

const addToEventStream = async (
  eventToAdd: EventStreamItem<keyof typeof EventStreamSchemas>,
) => {
  await eventStreamMutex.runExclusive(async () => {
    const oldEventStream = await getEventStream();
    const newEventStream = [...oldEventStream, eventToAdd];
    if (newEventStream.length > EVENT_STREAM_WINDOW_SIZE) {
      newEventStream.shift();
    }
    await setEventStream(newEventStream);
  });
};

export const EVENT_STREAM_FN_CACHE_KEY = 'EVENT_STREAM';

export const getEventStream = async (): Promise<
  EventStreamItem<keyof typeof EventStreamSchemas>[]
> => {
  try {
    const cachedEventStream = await cache().getKey(
      CacheNamespaces.Function_Response,
      EVENT_STREAM_FN_CACHE_KEY,
    );
    if (cachedEventStream) {
      return JSON.parse(cachedEventStream);
    }
    return [];
  } catch (err) {
    log.error(`Error getting event stream from cache`, err as Error);
    return [];
  }
};

const setEventStream = async (
  eventStream: EventStreamItem<keyof typeof EventStreamSchemas>[],
) => {
  try {
    await cache().setKey(
      CacheNamespaces.Function_Response,
      EVENT_STREAM_FN_CACHE_KEY,
      JSON.stringify(eventStream),
    );
  } catch (err) {
    log.error(`Error setting event stream in cache`, err as Error);
  }
};
