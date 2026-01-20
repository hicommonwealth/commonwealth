import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  GetMarkets,
  SubscribeMarket,
  UnsubscribeMarket,
} from '../../src/aggregates/community';
import { config } from '../../src/config';
import { seedCommunity } from '../utils';

// Mock the config.MARKETS.ENABLED to be true for these tests
vi.spyOn(config.MARKETS, 'ENABLED', 'get').mockReturnValue(true);

describe('Market lifecycle', () => {
  let community_id: string | undefined;
  let adminActor: Actor;

  beforeAll(async () => {
    const { community, actors } = await seedCommunity({ roles: ['admin'] });
    community_id = community.id;
    adminActor = actors.admin;
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should subscribe to a market', async () => {
    await command(SubscribeMarket(), {
      actor: adminActor,
      payload: {
        community_id: community_id!,
        provider: 'polymarket',
        slug: 'polymarket-usdt-eth',
        question: 'What is the price of USDT in ETH?',
        category: 'cryptocurrency',
        start_time: new Date(),
        end_time: new Date(),
        status: 'open',
      },
    });

    const markets = await query(GetMarkets(), {
      actor: adminActor,
      payload: {
        community_id: community_id!,
        limit: 20,
        cursor: 1,
      },
    });
    expect(markets).toBeDefined();
    expect(markets.results).toBeDefined();
    expect(markets.results.length).toBe(1);
    expect(markets.results[0].slug).toBe('polymarket-usdt-eth');
    expect(markets.results[0].provider).toBe('polymarket');
    expect(markets.results[0].question).toBe('What is the price of USDT in ETH?');
    expect(markets.results[0].category).toBe('cryptocurrency');
    expect(markets.results[0].start_time).toBeInstanceOf(Date);
    expect(markets.results[0].end_time).toBeInstanceOf(Date);
    expect(markets.results[0].status).toBe('open');
  });

  it('should unsubscribe from a market', async () => {
    await command(UnsubscribeMarket(), {
      actor: adminActor,
      payload: {
        community_id: community_id!,
        slug: 'polymarket-usdt-eth',
      },
    });
    const markets = await query(GetMarkets(), {
      actor: adminActor,
      payload: {
        community_id: community_id!,
        limit: 20,
        cursor: 1,
      },
    });
    expect(markets).toBeDefined();
    expect(markets.results).toBeDefined();
    expect(markets.results.length).toBe(0);
  });
});
