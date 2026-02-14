import { Actor, command, dispose } from '@hicommonwealth/core';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import type { EventPair } from '@hicommonwealth/schemas';
import * as schemas from '@hicommonwealth/schemas';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CreatePredictionMarket,
  DeployPredictionMarket,
  ResolvePredictionMarket,
} from '../../src/aggregates/prediction_market';
import { PredictionMarketProjection } from '../../src/aggregates/prediction_market/PredictionMarket.projection';
import { models } from '../../src/database';
import { chainEventMappers } from '../../src/services/evmChainEvents/chain-event-utils';
import { EvmEvent } from '../../src/services/evmChainEvents/types';
import { seed } from '../../src/tester';
import { seedCommunity } from '../utils/community-seeder';

describe('Prediction Market Resolution', () => {
  let admin: Actor;
  let community_id: string;
  let address_id: number;
  let topic_id: number;
  let thread_id: number;
  let eth_chain_id: number;
  const onChainMarketId =
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const onChainProposalId =
    '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

  beforeAll(async () => {
    const { community, node, actors } = await seedCommunity({
      roles: ['admin'],
      chain_node: { eth_chain_id: 133800 + Math.floor(Math.random() * 10000) },
    });
    admin = actors.admin;
    community_id = community!.id;
    eth_chain_id = node!.eth_chain_id!;
    address_id = community!.Addresses!.find(
      (a) => a.address === admin.address,
    )!.id!;
    topic_id = community!.topics!.at(0)!.id!;

    const [thread] = await seed('Thread', {
      community_id,
      address_id,
      topic_id,
      pinned: false,
      read_only: false,
      reaction_weights_sum: '0',
    });
    thread_id = thread!.id!;
  });

  afterAll(async () => {
    await dispose()();
  });

  async function createActiveMarket(tid?: number) {
    const tId = tid ?? thread_id;
    const market = await command(CreatePredictionMarket(), {
      actor: admin,
      payload: {
        thread_id: tId,
        prompt: 'Resolution test market?',
        collateral_address: '0x1234567890123456789012345678901234567890',
        duration: 86400 * 7,
        resolution_threshold: 0.5,
      },
    });

    await command(DeployPredictionMarket(), {
      actor: admin,
      payload: {
        thread_id: tId,
        prediction_market_id: market.id!,
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

    const projection = PredictionMarketProjection();
    await projection.body.PredictionMarketMarketCreated({
      id: Math.floor(Math.random() * 100000),
      name: 'PredictionMarketMarketCreated',
      payload: {
        prediction_market_id: market.id!,
        market_id: onChainMarketId,
        eth_chain_id,
        transaction_hash:
          '0xdeploy000000000000000000000000000000000000000000000000000000hash',
        timestamp: Math.floor(Date.now() / 1000),
      },
    });
    await projection.body.PredictionMarketProposalCreated({
      id: Math.floor(Math.random() * 100000),
      name: 'PredictionMarketProposalCreated',
      payload: {
        prediction_market_id: market.id!,
        proposal_id: onChainProposalId,
        eth_chain_id,
        transaction_hash:
          '0xprop0000000000000000000000000000000000000000000000000000000hash',
        timestamp: Math.floor(Date.now() / 1000),
      },
    });

    return { marketId: market.id!, threadId: tId };
  }

  describe('Event Signatures', () => {
    it('should have the correct keccak256 hash for ProposalResolved', () => {
      expect(EvmEventSignatures.PredictionMarket.ProposalResolved).toBe(
        '0xa57dd01540a3fffc26f05f994ad25d6f8af2e1c9343c994e5f61be3bd5b9bff3',
      );
    });

    it('should have the correct keccak256 hash for MarketResolved', () => {
      expect(EvmEventSignatures.PredictionMarket.MarketResolved).toBe(
        '0xf34984473148051bc1bdf1be6ecc462d7b228d591058a8a27977b84770b738b9',
      );
    });
  });

  describe('Mappers', () => {
    it('should decode a ProposalResolved raw log into event payload', () => {
      const mapper =
        chainEventMappers[EvmEventSignatures.PredictionMarket.ProposalResolved];
      expect(mapper).toBeDefined();

      // data: winner(uint8) = 1 (PASS)
      const data =
        '0x0000000000000000000000000000000000000000000000000000000000000001';

      const evmEvent: EvmEvent = {
        eventSource: {
          ethChainId: 8453,
          eventSignature: EvmEventSignatures.PredictionMarket.ProposalResolved,
        },
        rawLog: {
          blockNumber: 300n,
          blockHash: '0xblockhash',
          transactionIndex: 0,
          removed: false,
          address: '0xgovernor',
          data,
          topics: [
            '0xa57dd01540a3fffc26f05f994ad25d6f8af2e1c9343c994e5f61be3bd5b9bff3',
            onChainProposalId,
            onChainMarketId,
          ],
          transactionHash:
            '0xresolve0000000000000000000000000000000000000000000000000000hash1',
          logIndex: 0,
        },
        block: {
          number: 300n,
          hash: '0xblockhash',
          logsBloom: '0x',
          parentHash: '0x',
          timestamp: 1700003000n,
          miner: '0x',
          gasLimit: 30000000n,
        },
        meta: { events_migrated: true },
      };

      const result = mapper(
        evmEvent,
      ) as EventPair<'PredictionMarketProposalResolved'>;

      expect(result.event_name).toBe('PredictionMarketProposalResolved');
      expect(result.event_payload.proposal_id).toBe(onChainProposalId);
      expect(result.event_payload.market_id).toBe(onChainMarketId);
      expect(result.event_payload.winner).toBe(1);
      expect(result.event_payload.eth_chain_id).toBe(8453);
      expect(result.event_payload.timestamp).toBe(1700003000);
    });

    it('should decode a MarketResolved raw log into event payload', () => {
      const mapper =
        chainEventMappers[EvmEventSignatures.PredictionMarket.MarketResolved];
      expect(mapper).toBeDefined();

      // data: winner(uint8) = 2 (FAIL)
      const data =
        '0x0000000000000000000000000000000000000000000000000000000000000002';

      const evmEvent: EvmEvent = {
        eventSource: {
          ethChainId: 8453,
          eventSignature: EvmEventSignatures.PredictionMarket.MarketResolved,
        },
        rawLog: {
          blockNumber: 300n,
          blockHash: '0xblockhash',
          transactionIndex: 0,
          removed: false,
          address: '0xvault',
          data,
          topics: [
            '0xf34984473148051bc1bdf1be6ecc462d7b228d591058a8a27977b84770b738b9',
            onChainMarketId,
          ],
          transactionHash:
            '0xresolve0000000000000000000000000000000000000000000000000000hash2',
          logIndex: 0,
        },
        block: {
          number: 300n,
          hash: '0xblockhash',
          logsBloom: '0x',
          parentHash: '0x',
          timestamp: 1700003100n,
          miner: '0x',
          gasLimit: 30000000n,
        },
        meta: { events_migrated: true },
      };

      const result = mapper(
        evmEvent,
      ) as EventPair<'PredictionMarketMarketResolved'>;

      expect(result.event_name).toBe('PredictionMarketMarketResolved');
      expect(result.event_payload.market_id).toBe(onChainMarketId);
      expect(result.event_payload.winner).toBe(2);
      expect(result.event_payload.eth_chain_id).toBe(8453);
      expect(result.event_payload.timestamp).toBe(1700003100);
    });
  });

  describe('Projection Handlers', () => {
    const projection = PredictionMarketProjection();

    it('should set status=resolved and winner=1 (PASS) via ProposalResolved', async () => {
      const { marketId } = await createActiveMarket();

      await projection.body.PredictionMarketProposalResolved({
        id: 40,
        name: 'PredictionMarketProposalResolved',
        payload: {
          proposal_id: onChainProposalId,
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash:
            '0xresolve0000000000000000000000000000000000000000000000000000hash3',
          winner: 1,
          timestamp: 1700003000,
        },
      });

      const market = await models.PredictionMarket.findByPk(marketId);
      expect(market!.status).toBe(schemas.PredictionMarketStatus.Resolved);
      expect(market!.winner).toBe(1);
      expect(market!.resolved_at).toBeDefined();
    });

    it('should be idempotent - already-resolved market not modified', async () => {
      // The market from previous test is already resolved
      // Find it by market_id
      const marketBefore = await models.PredictionMarket.findOne({
        where: { market_id: onChainMarketId },
      });
      const resolvedAtBefore = marketBefore!.resolved_at;

      await projection.body.PredictionMarketProposalResolved({
        id: 41,
        name: 'PredictionMarketProposalResolved',
        payload: {
          proposal_id: onChainProposalId,
          market_id: onChainMarketId,
          eth_chain_id,
          transaction_hash:
            '0xresolve0000000000000000000000000000000000000000000000000000hash4',
          winner: 2, // different winner - should be ignored
          timestamp: 1700003100,
        },
      });

      const marketAfter = await models.PredictionMarket.findOne({
        where: { market_id: onChainMarketId },
      });
      expect(marketAfter!.winner).toBe(1); // still 1, not 2
      expect(String(marketAfter!.resolved_at)).toBe(String(resolvedAtBefore));
    });

    it('should set status=resolved via MarketResolved with winner=2 (FAIL)', async () => {
      // Create a fresh market with a different thread
      const [newThread] = await seed('Thread', {
        community_id,
        address_id,
        topic_id,
        pinned: false,
        read_only: false,
        reaction_weights_sum: '0',
      });
      const freshMarketId2 =
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const { marketId: freshId } = await createActiveMarket(newThread!.id!);

      // Update the on-chain market_id to something unique for this test
      await models.PredictionMarket.update(
        { market_id: freshMarketId2 },
        { where: { id: freshId } },
      );

      await projection.body.PredictionMarketMarketResolved({
        id: 42,
        name: 'PredictionMarketMarketResolved',
        payload: {
          market_id: freshMarketId2,
          eth_chain_id,
          transaction_hash:
            '0xresolve0000000000000000000000000000000000000000000000000000hash5',
          winner: 2,
          timestamp: 1700003200,
        },
      });

      const market = await models.PredictionMarket.findByPk(freshId);
      expect(market!.status).toBe(schemas.PredictionMarketStatus.Resolved);
      expect(market!.winner).toBe(2);
      expect(market!.resolved_at).toBeDefined();
    });
  });

  describe('ResolvePredictionMarket Command', () => {
    it('should resolve an active market for the thread author', async () => {
      const [newThread] = await seed('Thread', {
        community_id,
        address_id,
        topic_id,
        pinned: false,
        read_only: false,
        reaction_weights_sum: '0',
      });

      const market = await command(CreatePredictionMarket(), {
        actor: admin,
        payload: {
          thread_id: newThread!.id!,
          prompt: 'Resolve test?',
          collateral_address: '0x1234567890123456789012345678901234567890',
          duration: 86400,
          resolution_threshold: 0.5,
        },
      });

      await command(DeployPredictionMarket(), {
        actor: admin,
        payload: {
          thread_id: newThread!.id!,
          prediction_market_id: market.id!,
          vault_address: '0x0000000000000000000000000000000000000001',
          governor_address: '0x0000000000000000000000000000000000000002',
          router_address: '0x0000000000000000000000000000000000000003',
          strategy_address: '0x0000000000000000000000000000000000000004',
          p_token_address: '0x0000000000000000000000000000000000000005',
          f_token_address: '0x0000000000000000000000000000000000000006',
          start_time: new Date(),
          end_time: new Date(Date.now() + 86400 * 1000),
        },
      });

      const resolved = await command(ResolvePredictionMarket(), {
        actor: admin,
        payload: {
          thread_id: newThread!.id!,
          prediction_market_id: market.id!,
          winner: 1,
        },
      });

      expect(resolved.status).toBe(schemas.PredictionMarketStatus.Resolved);
      expect(resolved.winner).toBe(1);
      expect(resolved.resolved_at).toBeDefined();

      // Verify outbox event
      const resolveEvent = await models.Outbox.findOne({
        where: { event_name: 'PredictionMarketResolved' },
        order: [['event_id', 'DESC']],
      });
      expect(resolveEvent).toBeDefined();
    });

    it('should reject resolving a draft market', async () => {
      const [newThread] = await seed('Thread', {
        community_id,
        address_id,
        topic_id,
        pinned: false,
        read_only: false,
        reaction_weights_sum: '0',
      });

      const market = await command(CreatePredictionMarket(), {
        actor: admin,
        payload: {
          thread_id: newThread!.id!,
          prompt: 'Draft resolve test?',
          collateral_address: '0x1234567890123456789012345678901234567890',
          duration: 86400,
          resolution_threshold: 0.5,
        },
      });

      await expect(
        command(ResolvePredictionMarket(), {
          actor: admin,
          payload: {
            thread_id: newThread!.id!,
            prediction_market_id: market.id!,
            winner: 1,
          },
        }),
      ).rejects.toThrow('Only active prediction markets can be resolved');
    });

    it('should reject non-author', async () => {
      const { actors } = await seedCommunity({ roles: ['nonmember'] });
      const nonmember = actors.nonmember;

      await expect(
        command(ResolvePredictionMarket(), {
          actor: nonmember,
          payload: {
            thread_id,
            prediction_market_id: 99999,
            winner: 1,
          },
        }),
      ).rejects.toThrow();
    });
  });
});
