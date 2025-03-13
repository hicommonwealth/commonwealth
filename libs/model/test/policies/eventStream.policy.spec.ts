import { CacheNamespaces, dispose } from '@hicommonwealth/core';
import { models, tester } from '@hicommonwealth/model';
import { ContestManager, events } from '@hicommonwealth/schemas';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { z } from 'zod';
import {
  EVENT_STREAM_FN_CACHE_KEY,
  EVENT_STREAM_WINDOW_SIZE,
  EventStreamPolicy,
  getEventStream,
} from '../../src/policies/EventStream.policy';
import { drainOutbox } from '../utils/outbox-drain';

const inMemoryStore = new Map<string, any>();

const mockCache = {
  getKey: vi.fn().mockImplementation(async (namespace, key) => {
    const cacheKey = `${namespace}:${key}`;
    return inMemoryStore.get(cacheKey) || null;
  }),
  setKey: vi.fn().mockImplementation(async (namespace, key, value) => {
    const cacheKey = `${namespace}:${key}`;
    inMemoryStore.set(cacheKey, value);
    return true;
  }),
};

vi.mock('@hicommonwealth/core', async () => {
  const actual = await vi.importActual('@hicommonwealth/core');
  return {
    ...(actual as object),
    cache: () => mockCache,
  };
});

describe('EventStream Policy Integration Tests', () => {
  const communityId = 'test-community';
  const threadId = 123;
  let contestManagers: z.infer<typeof ContestManager>[];

  beforeAll(async () => {
    const [community] = await tester.seed('Community', {
      id: communityId,
      name: 'Test Community',
      icon_url: 'https://example.com/icon.png',
      profile_count: 0,
      // seed enough contest managers to fill the event stream window
      contest_managers: [
        ...Array.from({ length: EVENT_STREAM_WINDOW_SIZE }, (_, i) => ({
          contest_address: `0x${(i + 1).toString()}`,
          community_id: communityId,
          name: `Test Contest #${i + 1}`,
          cancelled: false,
          ended: false,
          interval: 0,
        })),
      ],
      topics: [
        {
          name: 'Test Topic',
          description: 'Test Description',
          community_id: communityId,
        },
      ],
    });
    contestManagers = community!.contest_managers!;

    const [userAddress] = await tester.seed('Address', {
      address: '0x123',
      community_id: communityId,
    });

    await tester.seed('Thread', {
      id: threadId,
      community_id: communityId,
      title: 'Test Thread',
      pinned: false,
      read_only: false,
      reaction_weights_sum: '0',
      address_id: userAddress!.id,
      topic_id: community!.topics![0].id,
    });

    inMemoryStore.clear();

    mockCache.getKey.mockClear();
    mockCache.setKey.mockClear();
  });

  afterEach(async () => {
    await models.Outbox.truncate();
    inMemoryStore.clear();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should add CommunityCreated event to the event stream', async () => {
    const communityCreatedEvent: z.infer<typeof events.CommunityCreated> = {
      community_id: communityId,
      created_at: new Date(),
      user_id: 1,
    };

    await models.Outbox.create({
      event_name: 'CommunityCreated',
      event_payload: communityCreatedEvent,
    });

    await drainOutbox(['CommunityCreated'], EventStreamPolicy);

    const eventStreamItems = await getEventStream();

    expect(eventStreamItems).toHaveLength(1);
    expect(eventStreamItems[0].type).toBe('CommunityCreated');

    const communityData = eventStreamItems[0].data as any;
    expect(communityData.id).toBe(communityCreatedEvent.community_id);
    expect(eventStreamItems[0].url).toContain(
      communityCreatedEvent.community_id,
    );
  });

  test('should add ThreadCreated event to the event stream', async () => {
    const threadCreatedEvent: z.infer<typeof events.ThreadCreated> = {
      id: threadId,
      community_id: communityId,
      address_id: 1,
      title: 'Test Thread',
      kind: 'thread',
      body: 'Test Body',
      topic_id: 1,
    };

    await models.Outbox.create({
      event_name: 'ThreadCreated',
      event_payload: threadCreatedEvent,
    });

    await drainOutbox(['ThreadCreated'], EventStreamPolicy);

    const eventStreamItems = await getEventStream();

    expect(eventStreamItems).toHaveLength(1);
    expect(eventStreamItems[0].type).toBe('ThreadCreated');

    const threadData = eventStreamItems[0].data as any;
    expect(threadData.id).toBe(threadCreatedEvent.id!);
    expect(eventStreamItems[0].url).toContain(
      threadCreatedEvent.id!.toString(),
    );
  });

  test('should add ContestStarted event to the event stream', async () => {
    const contestStartedEvent: z.infer<typeof events.ContestStarted> = {
      contest_address: contestManagers[0].contest_address,
      contest_id: 1,
      start_time: new Date(),
      end_time: new Date(),
      is_one_off: false,
      created_at: new Date(),
    };

    await models.Outbox.create({
      event_name: 'ContestStarted',
      event_payload: contestStartedEvent,
    });

    await drainOutbox(['ContestStarted'], EventStreamPolicy);

    const eventStreamItems = await getEventStream();

    expect(eventStreamItems).toHaveLength(1);
    expect(eventStreamItems[0].type).toBe('ContestStarted');

    const contestData = eventStreamItems[0].data as any;
    expect(contestData.contest_address).toBe(
      contestStartedEvent.contest_address,
    );
    expect(eventStreamItems[0].url).toContain(
      contestStartedEvent.contest_address,
    );
  });

  test('should append events to an existing event stream', async () => {
    const existingEvent = {
      type: 'CommunityCreated',
      data: { id: communityId, name: 'Test Community' },
      url: `https://development.commonwealth.gg/community/${communityId}`,
    };

    inMemoryStore.set(
      `${CacheNamespaces.Function_Response}:${EVENT_STREAM_FN_CACHE_KEY}`,
      JSON.stringify([existingEvent]),
    );

    const threadCreatedEvent: z.infer<typeof events.ThreadCreated> = {
      id: threadId,
      community_id: communityId,
      address_id: 1,
      title: 'Test Thread',
      kind: 'thread',
      body: 'Test Body',
      topic_id: 1,
    };

    await models.Outbox.create({
      event_name: 'ThreadCreated',
      event_payload: threadCreatedEvent,
    });

    await drainOutbox(['ThreadCreated'], EventStreamPolicy);

    const eventStreamItems = await getEventStream();

    expect(eventStreamItems).toHaveLength(2);
    expect(eventStreamItems[0].type).toBe(existingEvent.type);

    const firstItemData = eventStreamItems[0].data as any;
    expect(firstItemData.id).toBe(existingEvent.data.id);

    expect(eventStreamItems[1].type).toBe('ThreadCreated');

    const secondItemData = eventStreamItems[1].data as any;
    expect(secondItemData.id).toBe(threadCreatedEvent.id!);
  });

  test('should process multiple events of different types through the outbox', async () => {
    mockCache.getKey.mockImplementationOnce(() => null);

    const outboxEvents = [
      {
        event_name: 'CommunityCreated',
        event_payload: {
          created_at: new Date(),
          community_id: communityId,
          user_id: 1,
        } satisfies z.infer<typeof events.CommunityCreated>,
      },
      {
        event_name: 'ThreadCreated',
        event_payload: {
          id: threadId,
          community_id: communityId,
          address_id: 1,
          title: 'Test Thread',
          kind: 'thread',
          body: 'Test Body',
          topic_id: 1,
        } satisfies z.infer<typeof events.ThreadCreated>,
      },
      {
        event_name: 'ContestStarted',
        event_payload: {
          contest_address: contestManagers[0].contest_address,
          contest_id: 1,
          start_time: new Date(),
          end_time: new Date(),
          is_one_off: true,
        } satisfies z.infer<typeof events.ContestStarted>,
      },
    ];

    await models.Outbox.bulkCreate(outboxEvents);

    await drainOutbox(
      ['CommunityCreated', 'ThreadCreated', 'ContestStarted'],
      EventStreamPolicy,
    );

    const eventStreamItems = await getEventStream();

    expect(eventStreamItems).toHaveLength(3);
    expect(eventStreamItems[0].type).toBe(outboxEvents[0].event_name);
    expect(eventStreamItems[1].type).toBe(outboxEvents[1].event_name);
    expect(eventStreamItems[2].type).toBe(outboxEvents[2].event_name);
  });

  test('should only keep the most recent events when exceeding the window size', async () => {
    // fill the event stream with the initial events
    const initialEvents = contestManagers.map((contestManager) => ({
      event_name: 'ContestStarted',
      event_payload: {
        contest_address: contestManager.contest_address,
        contest_id: 0,
        start_time: new Date(),
        end_time: new Date(),
        is_one_off: true,
      } satisfies z.infer<typeof events.ContestStarted>,
    }));

    await models.Outbox.bulkCreate(initialEvents);

    await drainOutbox(['ContestStarted'], EventStreamPolicy);

    const eventStreamItems = await getEventStream();

    // event stream length should be max
    expect(eventStreamItems).toHaveLength(EVENT_STREAM_WINDOW_SIZE);

    // add 1 more event to the stream
    await models.Outbox.create({
      event_name: 'ContestStarted',
      event_payload: {
        contest_address: contestManagers[0].contest_address,
        contest_id: 1,
        start_time: new Date(),
        end_time: new Date(),
        is_one_off: true,
      } satisfies z.infer<typeof events.ContestStarted>,
    });

    await drainOutbox(['ContestStarted'], EventStreamPolicy);

    const eventStreamItemsAfter = await getEventStream();

    // event stream length should still be max
    expect(eventStreamItemsAfter).toHaveLength(EVENT_STREAM_WINDOW_SIZE);

    // oldest event should be removed
    const oldestEvent = eventStreamItemsAfter[0].data as z.infer<
      typeof ContestManager
    >;
    expect(oldestEvent.name).toEqual('Test Contest #2');
  });
});
