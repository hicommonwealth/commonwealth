import { dispose } from '@hicommonwealth/core';
import { PredictionMarketTradeAction } from '@hicommonwealth/schemas';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { models } from '../../src/database';
import { seed } from '../../src/tester';
import { seedCommunity } from '../utils/community-seeder';

const ADDRESS_ONE = '0x1111111111111111111111111111111111111111';
const ADDRESS_TWO = '0x2222222222222222222222222222222222222222';
const ADDRESS_THREE = '0x3333333333333333333333333333333333333333';

async function createPredictionMarket(threadId: number) {
  return models.PredictionMarket.create({
    thread_id: threadId,
    eth_chain_id: 8453,
    collateral_address: ADDRESS_TWO,
    creator_address: ADDRESS_ONE,
    prompt: 'Will the proposal pass?',
    status: 'draft',
    duration: 86400,
    resolution_threshold: 0.55,
    total_collateral: '0',
  });
}

describe('Prediction market models', () => {
  let threadId: number;

  beforeAll(async () => {
    const { community } = await seedCommunity({ roles: ['admin'] });

    const [thread] = await seed('Thread', {
      community_id: community!.id!,
      address_id: community!.Addresses!.at(0)!.id!,
      topic_id: community!.topics!.at(0)!.id!,
      pinned: false,
      read_only: false,
      reaction_weights_sum: '0',
    });

    threadId = thread!.id!;
  });

  afterAll(async () => {
    await dispose()();
  });

  it('creates a prediction market with required fields', async () => {
    const market = await createPredictionMarket(threadId);
    expect(market.id).toBeTruthy();
  });

  it('enforces composite primary key on trades', async () => {
    const market = await createPredictionMarket(threadId);

    const tradePayload = {
      prediction_market_id: market.id,
      eth_chain_id: 8453,
      transaction_hash: `0x${'a'.repeat(64)}`,
      trader_address: ADDRESS_ONE,
      action: PredictionMarketTradeAction.Mint,
      collateral_amount: '100',
      p_token_amount: '100',
      f_token_amount: '100',
      timestamp: 1_700_000_000,
    };

    await models.PredictionMarketTrade.create(tradePayload);

    await expect(
      models.PredictionMarketTrade.create(tradePayload),
    ).rejects.toThrow();
  });

  it('enforces unique constraint on prediction market positions', async () => {
    const market = await createPredictionMarket(threadId);

    const positionPayload = {
      prediction_market_id: market.id,
      user_address: ADDRESS_THREE,
      user_id: null,
      p_token_balance: '50',
      f_token_balance: '25',
      total_collateral_in: '75',
    };

    await models.PredictionMarketPosition.create(positionPayload);

    await expect(
      models.PredictionMarketPosition.create(positionPayload),
    ).rejects.toThrow();
  });

  it('links prediction markets to threads', async () => {
    const market = await createPredictionMarket(threadId);

    const thread = await market.getThread();

    expect(thread?.id).toBe(threadId);
  });

  it('cascades deletes to trades and positions', async () => {
    const market = await createPredictionMarket(threadId);

    await models.PredictionMarketTrade.create({
      prediction_market_id: market.id,
      eth_chain_id: 8453,
      transaction_hash: `0x${'b'.repeat(64)}`,
      trader_address: ADDRESS_ONE,
      action: PredictionMarketTradeAction.Mint,
      collateral_amount: '10',
      p_token_amount: '10',
      f_token_amount: '10',
      timestamp: 1_700_000_001,
    });

    await models.PredictionMarketPosition.create({
      prediction_market_id: market.id,
      user_address: ADDRESS_THREE,
      user_id: null,
      p_token_balance: '10',
      f_token_balance: '5',
      total_collateral_in: '15',
    });

    await market.destroy();

    const trades = await models.PredictionMarketTrade.count({
      where: { prediction_market_id: market.id },
    });
    const positions = await models.PredictionMarketPosition.count({
      where: { prediction_market_id: market.id },
    });

    expect(trades).toBe(0);
    expect(positions).toBe(0);
  });
});
