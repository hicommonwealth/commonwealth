import { Actor, command, dispose } from '@hicommonwealth/core';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import type { EventPair } from '@hicommonwealth/schemas';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CreatePredictionMarket,
  DeployPredictionMarket,
} from '../../src/aggregates/prediction_market';
import { PredictionMarketProjection } from '../../src/aggregates/prediction_market/PredictionMarket.projection';
import { models } from '../../src/database';
import { chainEventMappers } from '../../src/services/evmChainEvents/chain-event-utils';
import { EvmEvent } from '../../src/services/evmChainEvents/types';
import { seed } from '../../src/tester';
import { seedCommunity } from '../utils/community-seeder';

describe('Prediction Market Merge', () => {
  let admin: Actor;
  let thread_id: number;
  let eth_chain_id: number;
  let marketId: number;
  const onChainMarketId =
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  beforeAll(async () => {
    const { community, node, actors } = await seedCommunity({
      roles: ['admin'],
      chain_node: { eth_chain_id: 133800 + Math.floor(Math.random() * 10000) },
    });
    admin = actors.admin;
    eth_chain_id = node!.eth_chain_id!;

    const [thread] = await seed('Thread', {
      community_id: community!.id,
      address_id: community!.Addresses!.find(
        (a) => a.address === admin.address,
      )!.id!,
      topic_id: community!.topics!.at(0)!.id,
      pinned: false,
      read_only: false,
      reaction_weights_sum: '0',
    });
    thread_id = thread!.id!;

    // Create and deploy a prediction market
    await command(CreatePredictionMarket(), {
      actor: admin,
      payload: {
        thread_id,
        prompt: 'Will this test pass?',
        collateral_address: '0x1234567890123456789012345678901234567890',
        duration: 86400 * 7,
        resolution_threshold: 0.5,
      },
    });
    const market = await models.PredictionMarket.findOne({
      where: { thread_id },
    });
    marketId = market!.id!;

    await command(DeployPredictionMarket(), {
      actor: admin,
      payload: {
        thread_id,
        prediction_market_id: marketId,
        vault_address: '0x0000000000000000000000000000000000000001',
        governor_address: '0x0000000000000000000000000000000000000002',
        router_address: '0x0000000000000000000000000000000000000003',
        strategy_address: '0x0000000000000000000000000000000000000004',
        p_token_address: '0x0000000000000000000000000000000000000005',
        f_token_address: '0x0000000000000000000000000000000000000006',
        start_time: new Date(),
        end_time: new Date(Date.now() + 86400 * 7 * 1000),
      },
    });

    // Set on-chain market_id via projection
    const projection = PredictionMarketProjection();
    await projection.body.PredictionMarketMarketCreated({
      id: 1,
      name: 'PredictionMarketMarketCreated',
      payload: {
        prediction_market_id: marketId,
        market_id: onChainMarketId,
        eth_chain_id,
        transaction_hash:
          '0xdeploy000000000000000000000000000000000000000000000000000000hash',
        timestamp: Math.floor(Date.now() / 1000),
      },
    });

    // Seed initial position via mint so merge has tokens to burn
    await projection.body.PredictionMarketTokensMinted({
      id: 2,
      name: 'PredictionMarketTokensMinted',
      payload: {
        market_id: onChainMarketId,
        eth_chain_id,
        transaction_hash:
          '0xmint0000000000000000000000000000000000000000000000000000000hash',
        trader_address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        collateral_amount: 2000000000000000000n,
        p_token_amount: 2000000000000000000n,
        f_token_amount: 2000000000000000000n,
        timestamp: 1700000000,
      },
    });
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('Event Signature', () => {
    it('should have the correct keccak256 hash for TokensMerged', () => {
      expect(EvmEventSignatures.PredictionMarket.TokensMerged).toBe(
        '0x5c89c1323725653974345a374ee77b42caf5137589586f5ecd2643b4f5595284',
      );
    });
  });

  describe('Mapper', () => {
    it('should decode a TokensMerged raw log into event payload', () => {
      const mapper =
        chainEventMappers[EvmEventSignatures.PredictionMarket.TokensMerged];
      expect(mapper).toBeDefined();

      const amount = 1000000000000000000n; // 1e18

      const evmEvent: EvmEvent = {
        eventSource: {
          ethChainId: 8453,
          eventSignature: EvmEventSignatures.PredictionMarket.TokensMerged,
        },
        rawLog: {
          blockNumber: 100n,
          blockHash: '0xblockhash',
          transactionIndex: 0,
          removed: false,
          address: '0xvault',
          data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
          topics: [
            '0x5c89c1323725653974345a374ee77b42caf5137589586f5ecd2643b4f5595284',
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            '0x0000000000000000000000001234567890123456789012345678901234567890',
          ],
          transactionHash:
            '0xabcdef0000000000000000000000000000000000000000000000000000000001',
          logIndex: 0,
        },
        block: {
          number: 100n,
          hash: '0xblockhash',
          logsBloom: '0x',
          parentHash: '0x',
          timestamp: 1700000000n,
          miner: '0x',
          gasLimit: 30000000n,
        },
        meta: { events_migrated: true },
      };

      const result = mapper(
        evmEvent,
      ) as EventPair<'PredictionMarketTokensMerged'>;

      expect(result.event_name).toBe('PredictionMarketTokensMerged');
      expect(result.event_payload.market_id).toBe(onChainMarketId);
      expect(result.event_payload.eth_chain_id).toBe(8453);
      expect(result.event_payload.transaction_hash).toBe(
        '0xabcdef0000000000000000000000000000000000000000000000000000000001',
      );
      expect(result.event_payload.trader_address).toBe(
        '0x1234567890123456789012345678901234567890',
      );
      expect(result.event_payload.collateral_amount).toBe(amount);
      expect(result.event_payload.p_token_amount).toBe(amount);
      expect(result.event_payload.f_token_amount).toBe(amount);
      expect(result.event_payload.timestamp).toBe(1700000000);
    });
  });

  describe('Projection Handler', () => {
    const projection = PredictionMarketProjection();
    const traderAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const txHash1 =
      '0xmerge11100000000000000000000000000000000000000000000000000000001' as `0x${string}`;
    const txHash2 =
      '0xmerge22200000000000000000000000000000000000000000000000000000002' as `0x${string}`;
    const amount = 500000000000000000n; // 0.5e18

    it('should create a trade, decrement position, and decrement total_collateral on merge', async () => {
      await projection.body.PredictionMarketTokensMerged({
        id: 30,
        name: 'PredictionMarketTokensMerged',
        payload: {
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash: txHash1,
          trader_address: traderAddress,
          collateral_amount: amount,
          p_token_amount: amount,
          f_token_amount: amount,
          timestamp: 1700002000,
        },
      });

      // Verify trade created
      const trade = await models.PredictionMarketTrade.findOne({
        where: { eth_chain_id, transaction_hash: txHash1 },
      });
      expect(trade).toBeDefined();
      expect(trade!.prediction_market_id).toBe(marketId);
      expect(trade!.trader_address).toBe(traderAddress);
      expect(trade!.action).toBe('merge');
      expect(String(trade!.collateral_amount)).toBe(String(amount));

      // Verify position decremented: was 2e18, now 2e18 - 0.5e18 = 1.5e18
      const position = await models.PredictionMarketPosition.findOne({
        where: { prediction_market_id: marketId, user_address: traderAddress },
      });
      expect(position).toBeDefined();
      expect(BigInt(position!.p_token_balance as bigint)).toBe(
        2000000000000000000n - amount,
      );
      expect(BigInt(position!.f_token_balance as bigint)).toBe(
        2000000000000000000n - amount,
      );

      // Verify market total_collateral decremented: was 2e18, now 2e18 - 0.5e18 = 1.5e18
      const market = await models.PredictionMarket.findByPk(marketId);
      expect(BigInt(market!.total_collateral as bigint)).toBe(
        2000000000000000000n - amount,
      );
    });

    it('should accumulate merge decrements on second merge', async () => {
      await projection.body.PredictionMarketTokensMerged({
        id: 31,
        name: 'PredictionMarketTokensMerged',
        payload: {
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash: txHash2,
          trader_address: traderAddress,
          collateral_amount: amount,
          p_token_amount: amount,
          f_token_amount: amount,
          timestamp: 1700002100,
        },
      });

      // Verify second trade created
      const trades = await models.PredictionMarketTrade.findAll({
        where: { prediction_market_id: marketId, action: 'merge' },
      });
      expect(trades).toHaveLength(2);

      // Verify position decremented further: 2e18 - 0.5e18 - 0.5e18 = 1e18
      const position = await models.PredictionMarketPosition.findOne({
        where: { prediction_market_id: marketId, user_address: traderAddress },
      });
      expect(BigInt(position!.p_token_balance as bigint)).toBe(
        2000000000000000000n - amount * 2n,
      );
      expect(BigInt(position!.f_token_balance as bigint)).toBe(
        2000000000000000000n - amount * 2n,
      );

      // Verify market total_collateral: 2e18 - 0.5e18 - 0.5e18 = 1e18
      const market = await models.PredictionMarket.findByPk(marketId);
      expect(BigInt(market!.total_collateral as bigint)).toBe(
        2000000000000000000n - amount * 2n,
      );
    });

    it('should be idempotent - duplicate event does not double count', async () => {
      await projection.body.PredictionMarketTokensMerged({
        id: 32,
        name: 'PredictionMarketTokensMerged',
        payload: {
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash: txHash1, // same as first merge
          trader_address: traderAddress,
          collateral_amount: amount,
          p_token_amount: amount,
          f_token_amount: amount,
          timestamp: 1700002000,
        },
      });

      // Merge trade count should still be 2
      const trades = await models.PredictionMarketTrade.findAll({
        where: { prediction_market_id: marketId, action: 'merge' },
      });
      expect(trades).toHaveLength(2);

      // Position should not have changed
      const position = await models.PredictionMarketPosition.findOne({
        where: { prediction_market_id: marketId, user_address: traderAddress },
      });
      expect(BigInt(position!.p_token_balance as bigint)).toBe(
        2000000000000000000n - amount * 2n,
      );

      // Market total should not have changed
      const market = await models.PredictionMarket.findByPk(marketId);
      expect(BigInt(market!.total_collateral as bigint)).toBe(
        2000000000000000000n - amount * 2n,
      );
    });

    it('should create separate positions for different traders', async () => {
      const secondTrader = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txHash3 =
        '0xmerge33300000000000000000000000000000000000000000000000000000003' as `0x${string}`;

      // Seed mint for second trader first
      await projection.body.PredictionMarketTokensMinted({
        id: 33,
        name: 'PredictionMarketTokensMinted',
        payload: {
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash:
            '0xmint2000000000000000000000000000000000000000000000000000000hash',
          trader_address: secondTrader,
          collateral_amount: 1000000000000000000n,
          p_token_amount: 1000000000000000000n,
          f_token_amount: 1000000000000000000n,
          timestamp: 1700002200,
        },
      });

      await projection.body.PredictionMarketTokensMerged({
        id: 34,
        name: 'PredictionMarketTokensMerged',
        payload: {
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash: txHash3,
          trader_address: secondTrader,
          collateral_amount: amount,
          p_token_amount: amount,
          f_token_amount: amount,
          timestamp: 1700002300,
        },
      });

      const positions = await models.PredictionMarketPosition.findAll({
        where: { prediction_market_id: marketId },
      });
      expect(positions).toHaveLength(2);

      const pos2 = positions.find((p) => p.user_address === secondTrader);
      expect(pos2).toBeDefined();
      // Second trader: minted 1e18, merged 0.5e18 = 0.5e18
      expect(BigInt(pos2!.p_token_balance as bigint)).toBe(
        1000000000000000000n - amount,
      );
    });

    it('should skip gracefully when market not found', async () => {
      const unknownMarketId = '0xdeadbeef' as `0x${string}`;
      await projection.body.PredictionMarketTokensMerged({
        id: 35,
        name: 'PredictionMarketTokensMerged',
        payload: {
          market_id: unknownMarketId,
          eth_chain_id,
          transaction_hash:
            '0xmerge44400000000000000000000000000000000000000000000000000000004' as `0x${string}`,
          trader_address: traderAddress,
          collateral_amount: amount,
          p_token_amount: amount,
          f_token_amount: amount,
          timestamp: 1700002400,
        },
      });
      const trade = await models.PredictionMarketTrade.findOne({
        where: {
          transaction_hash:
            '0xmerge44400000000000000000000000000000000000000000000000000000004',
        },
      });
      expect(trade).toBeNull();
    });
  });
});
