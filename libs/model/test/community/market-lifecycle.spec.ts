import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  GetMarkets,
  SubscribeMarket,
  UnsubscribeMarket,
} from '../../src/aggregates/community';
import { seedCommunity } from '../utils';

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
      },
    });
    expect(markets.length).toBe(1);
    expect(markets[0].slug).toBe('polymarket-usdt-eth');
    expect(markets[0].provider).toBe('polymarket');
    expect(markets[0].question).toBe('What is the price of USDT in ETH?');
    expect(markets[0].category).toBe('cryptocurrency');
    expect(markets[0].start_time).toBeInstanceOf(Date);
    expect(markets[0].end_time).toBeInstanceOf(Date);
    expect(markets[0].status).toBe('open');
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
      },
    });
    expect(markets.length).toBe(0);
  });
});
