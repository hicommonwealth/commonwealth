import { RedisCache } from '@hicommonwealth/adapters';
import { cache, CacheNamespaces, config, dispose } from '@hicommonwealth/core';
import * as evm from '@hicommonwealth/evm-protocols';
import { models, tester } from '@hicommonwealth/model';
import { ContestManager, Events, events } from '@hicommonwealth/schemas';
import { serializeBigIntObj } from '@hicommonwealth/shared';
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
  EVENT_STREAM_WINDOW_SIZE,
  EventStreamPolicy,
  getEventStream,
  getEventStreamCacheKey,
} from '../../src/policies/EventStream.policy';
import { drainOutbox } from '../utils/outbox-drain';

const isValidUrl = (urlString: string): boolean => {
  try {
    // Check if URL starts with http or https
    if (!urlString.startsWith('http')) {
      return false;
    }
    // Check if it's a valid URL
    new URL(urlString);
    return true;
  } catch (err) {
    return false;
  }
};

describe('EventStream Policy Integration Tests', () => {
  const communityId = 'test-community';
  const threadId = 123;
  let contestManagers: z.infer<typeof ContestManager>[];

  beforeAll(async () => {
    cache({
      adapter: new RedisCache('redis://localhost:6379'),
    });
    await cache().ready();
    await cache().deleteKey(
      CacheNamespaces.Function_Response,
      getEventStreamCacheKey(),
    );

    await tester.seed('ChainNode', {
      eth_chain_id: 1,
      url: 'https://example.com',
      private_url: 'https://example.com',
    });

    const [community] = await tester.seed('Community', {
      id: communityId,
      name: 'Test Community',
      icon_url: 'https://example.com/icon.png',
      profile_count: 0,
      namespace: 'test',
      // seed enough contest managers to fill the event stream window
      contest_managers: [
        ...Array.from({ length: EVENT_STREAM_WINDOW_SIZE }, (_, i) => ({
          contest_address: `0x${(i + 1).toString()}`,
          community_id: communityId,
          name: `Test Contest #${i + 1}`,
          cancelled: false,
          ended: false,
          interval: 0,
          environment: config.APP_ENV,
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

    const [launchpadToken] = await tester.seed('LaunchpadToken', {
      token_address: '0x7777777777777777777777777777777777777777',
      namespace: community!.namespace!,
      name: 'Test Token',
      symbol: 'TEST',
      initial_supply: 1000,
      liquidity_transferred: false,
      launchpad_liquidity: 1n,
      eth_market_cap_target: 1000,
    });

    vi.spyOn(evm, 'getLaunchpadTokenCreatedTransaction').mockResolvedValue({
      txReceipt: {} as any,
      block: {} as any,
      parsedArgs: {
        namespace: community!.namespace!,
        tokenAddress: launchpadToken!.token_address!,
        curveId: 1n,
        totalSupply: 1n,
        launchpadLiquidity: 1n,
        reserveRation: 1n,
        initialPurchaseEthAmount: 1n,
      },
    });
  });

  afterEach(async () => {
    await models.Outbox.truncate();
    await cache().deleteKey(
      CacheNamespaces.Function_Response,
      getEventStreamCacheKey(),
    );
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
    expect(isValidUrl(eventStreamItems[0].url)).toBe(true);
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
    expect(isValidUrl(eventStreamItems[0].url)).toBe(true);
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
    expect(isValidUrl(eventStreamItems[0].url)).toBe(true);
  });

  test('should append events to an existing event stream', async () => {
    const existingEvent = {
      type: 'CommunityCreated',
      data: { id: communityId, name: 'Test Community' },
      url: `https://development.commonwealth.gg/community/${communityId}`,
    };

    await cache().lpushAndTrim(
      CacheNamespaces.Function_Response,
      getEventStreamCacheKey(),
      JSON.stringify(existingEvent),
      EVENT_STREAM_WINDOW_SIZE,
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
    expect(eventStreamItems[0].type).toBe('ThreadCreated');

    const threadData = eventStreamItems[0].data as any;
    expect(threadData.id).toBe(threadCreatedEvent.id!);
    expect(eventStreamItems[0].url).toContain(
      threadCreatedEvent.id!.toString(),
    );
    expect(isValidUrl(eventStreamItems[0].url)).toBe(true);

    expect(eventStreamItems[1].type).toBe(existingEvent.type);
    const communityData = eventStreamItems[1].data as any;
    expect(communityData.id).toBe(existingEvent.data.id);
    expect(eventStreamItems[1].url).toContain(existingEvent.data.id);
    expect(isValidUrl(eventStreamItems[1].url)).toBe(true);
  });

  test('should process multiple events of different types through the outbox', async () => {
    const outboxEvents = [
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
      {
        event_name: 'ContestEnded',
        event_payload: {
          contest_address: contestManagers[0].contest_address,
          contest_id: 1,
          is_one_off: true,
          winners: [],
          created_at: new Date(),
        } satisfies z.infer<typeof events.ContestEnded>,
      },
      {
        event_name: 'ContestEnding',
        event_payload: {
          contest_address: contestManagers[0].contest_address,
          contest_id: 1,
          is_one_off: true,
          created_at: new Date(),
        } satisfies z.infer<typeof events.ContestEnding>,
      },
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
        event_name: 'LaunchpadTokenCreated',
        event_payload: serializeBigIntObj({
          transaction_hash: '0x7777777777777777777777777777777777777777',
          eth_chain_id: 1,
          block_timestamp: 1n,
        } satisfies z.infer<typeof events.LaunchpadTokenCreated>),
      },
      {
        event_name: 'LaunchpadTokenTraded',
        event_payload: serializeBigIntObj({
          block_timestamp: 1n,
          transaction_hash: '0x1111111111111111111111111111111111111111',
          trader_address: '0x1111111111111111111111111111111111111111',
          token_address: '0x7777777777777777777777777777777777777777',
          is_buy: true,
          eth_chain_id: 1,
          eth_amount: 1n,
          community_token_amount: 1n,
          floating_supply: 1n,
        } satisfies z.infer<typeof events.LaunchpadTokenTraded>),
      },
      {
        event_name: 'LaunchpadTokenGraduated',
        event_payload: serializeBigIntObj({
          token: {
            token_address: '0x7777777777777777777777777777777777777777',
            symbol: 'TEST',
            name: 'Test Token',
            namespace: 'test',
            initial_supply: 1000,
            liquidity_transferred: true,
            launchpad_liquidity: 1n,
            eth_market_cap_target: 1000,
          },
          launchpadLiquidity: 1n,
          poolLiquidity: 1n,
          curveId: 1n,
          scalar: 1n,
          reserveRation: 1n,
          LPhook: '0x123',
          funded: true,
        } satisfies z.infer<typeof events.LaunchpadTokenGraduated>),
      },
    ];

    await models.Outbox.bulkCreate(outboxEvents);

    const eventNames = [
      'ContestStarted',
      'ContestEnded',
      'ContestEnding',
      'CommunityCreated',
      'ThreadCreated',
      'LaunchpadTokenCreated',
      'LaunchpadTokenTraded',
      'LaunchpadTokenGraduated',
    ] satisfies Events[];

    await drainOutbox(eventNames, EventStreamPolicy);

    const eventStreamItems = await getEventStream();

    expect(eventStreamItems).toHaveLength(eventNames.length);
    for (let i = 0; i < eventNames.length; i++) {
      // events are drained from the outbox in reverse order
      expect(eventStreamItems[i].type).toBe(
        outboxEvents[eventNames.length - i - 1].event_name,
      );
      expect(isValidUrl(eventStreamItems[i].url)).toBe(true);
    }
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

    // verify all URLs are valid with http prefix
    eventStreamItems.forEach((item) => {
      expect(isValidUrl(item.url)).toBe(true);
    });

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
    // verify all URLs are valid with http prefix
    eventStreamItemsAfter.forEach((item) => {
      expect(isValidUrl(item.url)).toBe(true);
    });

    // oldest event should be removed
    const oldestEvent = eventStreamItemsAfter[EVENT_STREAM_WINDOW_SIZE - 1]
      .data as z.infer<typeof ContestManager>;
    expect(oldestEvent.name).toEqual('Test Contest #2');
  });
});
