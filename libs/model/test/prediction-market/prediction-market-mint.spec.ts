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

describe('Prediction Market Mint', () => {
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
    const market = await command(CreatePredictionMarket(), {
      actor: admin,
      payload: {
        thread_id,
        prompt: 'Will this test pass?',
        collateral_address: '0x1234567890123456789012345678901234567890',
        duration: 86400 * 7,
        resolution_threshold: 0.5,
      },
    });
    marketId = market.id!;

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
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('Event Signature', () => {
    it('should have the correct keccak256 hash for TokensMinted', () => {
      expect(EvmEventSignatures.PredictionMarket.TokensMinted).toBe(
        '0xef616469a0b35ce807813d17c53c505b9d4796a93287cd361318dbca99ac9250',
      );
    });
  });

  describe('Mapper', () => {
    it('should decode a TokensMinted raw log into event payload', () => {
      const mapper =
        chainEventMappers[EvmEventSignatures.PredictionMarket.TokensMinted];
      expect(mapper).toBeDefined();

      const traderAddress = '0x1234567890123456789012345678901234567890';
      const amount = 1000000000000000000n; // 1e18

      const evmEvent: EvmEvent = {
        eventSource: {
          ethChainId: 8453,
          eventSignature: EvmEventSignatures.PredictionMarket.TokensMinted,
        },
        rawLog: {
          blockNumber: 100n,
          blockHash: '0xblockhash',
          transactionIndex: 0,
          removed: false,
          address: '0xvault',
          data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
          topics: [
            '0xef616469a0b35ce807813d17c53c505b9d4796a93287cd361318dbca99ac9250',
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
      ) as EventPair<'PredictionMarketTokensMinted'>;

      expect(result.event_name).toBe('PredictionMarketTokensMinted');
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
      '0x1111111100000000000000000000000000000000000000000000000000000001' as `0x${string}`;
    const txHash2 =
      '0x2222222200000000000000000000000000000000000000000000000000000002' as `0x${string}`;
    const amount = 500000000000000000n; // 0.5e18

    it('should create a trade, position, and update market on mint', async () => {
      await projection.body.PredictionMarketTokensMinted({
        id: 10,
        name: 'PredictionMarketTokensMinted',
        payload: {
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash: txHash1,
          trader_address: traderAddress,
          collateral_amount: amount,
          p_token_amount: amount,
          f_token_amount: amount,
          timestamp: 1700000000,
        },
      });

      // Verify trade created
      const trade = await models.PredictionMarketTrade.findOne({
        where: { eth_chain_id, transaction_hash: txHash1 },
      });
      expect(trade).toBeDefined();
      expect(trade!.prediction_market_id).toBe(marketId);
      expect(trade!.trader_address).toBe(traderAddress);
      expect(trade!.action).toBe('mint');
      expect(String(trade!.collateral_amount)).toBe(String(amount));

      // Verify position created
      const position = await models.PredictionMarketPosition.findOne({
        where: { prediction_market_id: marketId, user_address: traderAddress },
      });
      expect(position).toBeDefined();
      expect(String(position!.p_token_balance)).toBe(String(amount));
      expect(String(position!.f_token_balance)).toBe(String(amount));
      expect(String(position!.total_collateral_in)).toBe(String(amount));

      // Verify market total_collateral updated
      const market = await models.PredictionMarket.findByPk(marketId);
      expect(BigInt(market!.total_collateral as bigint)).toBe(amount);
    });

    it('should accumulate position balances on second mint', async () => {
      await projection.body.PredictionMarketTokensMinted({
        id: 11,
        name: 'PredictionMarketTokensMinted',
        payload: {
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash: txHash2,
          trader_address: traderAddress,
          collateral_amount: amount,
          p_token_amount: amount,
          f_token_amount: amount,
          timestamp: 1700000100,
        },
      });

      // Verify second trade created
      const trades = await models.PredictionMarketTrade.findAll({
        where: { prediction_market_id: marketId },
      });
      expect(trades).toHaveLength(2);

      // Verify position accumulated
      const position = await models.PredictionMarketPosition.findOne({
        where: { prediction_market_id: marketId, user_address: traderAddress },
      });
      expect(BigInt(position!.p_token_balance as bigint)).toBe(amount * 2n);
      expect(BigInt(position!.f_token_balance as bigint)).toBe(amount * 2n);
      expect(BigInt(position!.total_collateral_in as bigint)).toBe(amount * 2n);

      // Verify market total_collateral accumulated
      const market = await models.PredictionMarket.findByPk(marketId);
      expect(BigInt(market!.total_collateral as bigint)).toBe(amount * 2n);
    });

    it('should be idempotent - duplicate event does not double count', async () => {
      // Process same event again (same tx hash)
      await projection.body.PredictionMarketTokensMinted({
        id: 12,
        name: 'PredictionMarketTokensMinted',
        payload: {
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash: txHash1, // same as first mint
          trader_address: traderAddress,
          collateral_amount: amount,
          p_token_amount: amount,
          f_token_amount: amount,
          timestamp: 1700000000,
        },
      });

      // Trade count should still be 2
      const trades = await models.PredictionMarketTrade.findAll({
        where: { prediction_market_id: marketId },
      });
      expect(trades).toHaveLength(2);

      // Position should not have changed
      const position = await models.PredictionMarketPosition.findOne({
        where: { prediction_market_id: marketId, user_address: traderAddress },
      });
      expect(BigInt(position!.p_token_balance as bigint)).toBe(amount * 2n);

      // Market total should not have changed
      const market = await models.PredictionMarket.findByPk(marketId);
      expect(BigInt(market!.total_collateral as bigint)).toBe(amount * 2n);
    });

    it('should create separate positions for different traders', async () => {
      const secondTrader = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txHash3 =
        '0x3333333300000000000000000000000000000000000000000000000000000003' as `0x${string}`;

      await projection.body.PredictionMarketTokensMinted({
        id: 13,
        name: 'PredictionMarketTokensMinted',
        payload: {
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash: txHash3,
          trader_address: secondTrader,
          collateral_amount: amount,
          p_token_amount: amount,
          f_token_amount: amount,
          timestamp: 1700000200,
        },
      });

      // Two separate positions
      const positions = await models.PredictionMarketPosition.findAll({
        where: { prediction_market_id: marketId },
      });
      expect(positions).toHaveLength(2);

      const pos1 = positions.find((p) => p.user_address === traderAddress);
      const pos2 = positions.find((p) => p.user_address === secondTrader);
      expect(pos1).toBeDefined();
      expect(pos2).toBeDefined();
      expect(BigInt(pos1!.p_token_balance as bigint)).toBe(amount * 2n);
      expect(BigInt(pos2!.p_token_balance as bigint)).toBe(amount);
    });

    it('should skip gracefully when market not found', async () => {
      const unknownMarketId = '0xdeadbeef' as `0x${string}`;
      // Should not throw
      await projection.body.PredictionMarketTokensMinted({
        id: 14,
        name: 'PredictionMarketTokensMinted',
        payload: {
          market_id: unknownMarketId,
          eth_chain_id,
          transaction_hash:
            '0x4444444400000000000000000000000000000000000000000000000000000004' as `0x${string}`,
          trader_address: traderAddress,
          collateral_amount: amount,
          p_token_amount: amount,
          f_token_amount: amount,
          timestamp: 1700000300,
        },
      });
      // No trade should be created for unknown market
      const trade = await models.PredictionMarketTrade.findOne({
        where: {
          transaction_hash:
            '0x4444444400000000000000000000000000000000000000000000000000000004',
        },
      });
      expect(trade).toBeNull();
    });
  });
});
