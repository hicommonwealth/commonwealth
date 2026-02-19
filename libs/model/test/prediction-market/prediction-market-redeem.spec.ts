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

describe('Prediction Market Redeem', () => {
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
        prompt: 'Redemption test?',
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

    // Seed initial position via mint
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
    it('should have the correct keccak256 hash for TokensRedeemed', () => {
      expect(EvmEventSignatures.PredictionMarket.TokensRedeemed).toBe(
        '0x9a3541a9607a3b384f06a6f84bfe21fa1717a369e4c28574c6e784d586789c74',
      );
    });
  });

  describe('Mapper', () => {
    it('should decode a TokensRedeemed raw log into event payload (outcome=1, PASS wins)', () => {
      const mapper =
        chainEventMappers[EvmEventSignatures.PredictionMarket.TokensRedeemed];
      expect(mapper).toBeDefined();

      const amount = 1000000000000000000n; // 1e18

      // data: amount(uint256) + outcome(uint8)
      const data =
        '0x' +
        '0000000000000000000000000000000000000000000000000de0b6b3a7640000' + // amount=1e18
        '0000000000000000000000000000000000000000000000000000000000000001'; // outcome=1 (PASS)

      const evmEvent: EvmEvent = {
        eventSource: {
          ethChainId: 8453,
          eventSignature: EvmEventSignatures.PredictionMarket.TokensRedeemed,
        },
        rawLog: {
          blockNumber: 400n,
          blockHash: '0xblockhash',
          transactionIndex: 0,
          removed: false,
          address: '0xvault',
          data,
          topics: [
            '0x9a3541a9607a3b384f06a6f84bfe21fa1717a369e4c28574c6e784d586789c74',
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            '0x0000000000000000000000001234567890123456789012345678901234567890',
          ],
          transactionHash:
            '0xredeem00000000000000000000000000000000000000000000000000000hash1',
          logIndex: 0,
        },
        block: {
          number: 400n,
          hash: '0xblockhash',
          logsBloom: '0x',
          parentHash: '0x',
          timestamp: 1700004000n,
          miner: '0x',
          gasLimit: 30000000n,
        },
        meta: { events_migrated: true },
      };

      const result = mapper(
        evmEvent,
      ) as EventPair<'PredictionMarketTokensRedeemed'>;

      expect(result.event_name).toBe('PredictionMarketTokensRedeemed');
      expect(result.event_payload.market_id).toBe(onChainMarketId);
      expect(result.event_payload.eth_chain_id).toBe(8453);
      expect(result.event_payload.trader_address).toBe(
        '0x1234567890123456789012345678901234567890',
      );
      expect(result.event_payload.collateral_amount).toBe(amount);
      // outcome=1 (PASS) → p_token_amount=amount, f_token_amount=0
      expect(result.event_payload.p_token_amount).toBe(amount);
      expect(result.event_payload.f_token_amount).toBe(0n);
      expect(result.event_payload.timestamp).toBe(1700004000);
    });
  });

  describe('Projection Handler', () => {
    const projection = PredictionMarketProjection();
    const traderAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const txHash1 =
      '0xredeem11100000000000000000000000000000000000000000000000000000001' as `0x${string}`;
    const txHash2 =
      '0xredeem22200000000000000000000000000000000000000000000000000000002' as `0x${string}`;
    const amount = 500000000000000000n; // 0.5e18

    it('should create trade and decrement PASS token on redemption (outcome=1)', async () => {
      await projection.body.PredictionMarketTokensRedeemed({
        id: 50,
        name: 'PredictionMarketTokensRedeemed',
        payload: {
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash: txHash1,
          trader_address: traderAddress,
          collateral_amount: amount,
          p_token_amount: amount, // PASS wins, so p_token is redeemed
          f_token_amount: 0n,
          timestamp: 1700004000,
        },
      });

      // Verify trade created
      const trade = await models.PredictionMarketTrade.findOne({
        where: { eth_chain_id, transaction_hash: txHash1 },
      });
      expect(trade).toBeDefined();
      expect(trade!.prediction_market_id).toBe(marketId);
      expect(trade!.action).toBe('redeem');
      expect(String(trade!.collateral_amount)).toBe(String(amount));

      // Verify position: p_token decremented, f_token unchanged
      // Initial: p=2e18, f=2e18
      // After redeem: p -= 0.5e18 = 1.5e18, f unchanged = 2e18
      const position = await models.PredictionMarketPosition.findOne({
        where: { prediction_market_id: marketId, user_address: traderAddress },
      });
      expect(position).toBeDefined();
      expect(BigInt(position!.p_token_balance as bigint)).toBe(
        2000000000000000000n - amount,
      );
      expect(BigInt(position!.f_token_balance as bigint)).toBe(
        2000000000000000000n,
      ); // unchanged
    });

    it('should create trade and decrement FAIL token on redemption (outcome=2)', async () => {
      await projection.body.PredictionMarketTokensRedeemed({
        id: 51,
        name: 'PredictionMarketTokensRedeemed',
        payload: {
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash: txHash2,
          trader_address: traderAddress,
          collateral_amount: amount,
          p_token_amount: 0n,
          f_token_amount: amount, // FAIL wins, so f_token is redeemed
          timestamp: 1700004100,
        },
      });

      // Verify trade created
      const trade = await models.PredictionMarketTrade.findOne({
        where: { eth_chain_id, transaction_hash: txHash2 },
      });
      expect(trade).toBeDefined();
      expect(trade!.action).toBe('redeem');

      // Verify position: f_token decremented
      // After first redeem: p=1.5e18, f=2e18
      // After second redeem: p=1.5e18, f -= 0.5e18 = 1.5e18
      const position = await models.PredictionMarketPosition.findOne({
        where: { prediction_market_id: marketId, user_address: traderAddress },
      });
      expect(BigInt(position!.p_token_balance as bigint)).toBe(
        2000000000000000000n - amount,
      );
      expect(BigInt(position!.f_token_balance as bigint)).toBe(
        2000000000000000000n - amount,
      );
    });

    it('should be idempotent - duplicate event does not double count', async () => {
      await projection.body.PredictionMarketTokensRedeemed({
        id: 52,
        name: 'PredictionMarketTokensRedeemed',
        payload: {
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash: txHash1, // same as first redeem
          trader_address: traderAddress,
          collateral_amount: amount,
          p_token_amount: amount,
          f_token_amount: 0n,
          timestamp: 1700004000,
        },
      });

      const trades = await models.PredictionMarketTrade.findAll({
        where: { prediction_market_id: marketId, action: 'redeem' },
      });
      expect(trades).toHaveLength(2);

      // Position should not have changed
      const position = await models.PredictionMarketPosition.findOne({
        where: { prediction_market_id: marketId, user_address: traderAddress },
      });
      expect(BigInt(position!.p_token_balance as bigint)).toBe(
        2000000000000000000n - amount,
      );
    });

    it('should skip gracefully when market not found', async () => {
      const unknownMarketId = '0xdeadbeef' as `0x${string}`;
      await projection.body.PredictionMarketTokensRedeemed({
        id: 53,
        name: 'PredictionMarketTokensRedeemed',
        payload: {
          market_id: unknownMarketId,
          eth_chain_id,
          transaction_hash:
            '0xredeem33300000000000000000000000000000000000000000000000000000003' as `0x${string}`,
          trader_address: traderAddress,
          collateral_amount: amount,
          p_token_amount: amount,
          f_token_amount: 0n,
          timestamp: 1700004200,
        },
      });
      const trade = await models.PredictionMarketTrade.findOne({
        where: {
          transaction_hash:
            '0xredeem33300000000000000000000000000000000000000000000000000000003',
        },
      });
      expect(trade).toBeNull();
    });
  });
});
