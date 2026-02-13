import { Actor, command, dispose } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CreatePredictionMarket,
  DeployPredictionMarket,
} from '../../src/aggregates/prediction_market';
import { PredictionMarketProjection } from '../../src/aggregates/prediction_market/PredictionMarket.projection';
import { models } from '../../src/database';
import { seed } from '../../src/tester';
import { seedCommunity } from '../utils/community-seeder';

describe('Prediction Market Lifecycle', () => {
  let admin: Actor;
  let community_id: string;
  let thread_id: number;
  let eth_chain_id: number;

  beforeAll(async () => {
    const { community, node, actors } = await seedCommunity({
      roles: ['admin'],
      chain_node: { eth_chain_id: 1337 },
    });
    admin = actors.admin;
    community_id = community!.id;
    eth_chain_id = node!.eth_chain_id!;

    const [thread] = await seed('Thread', {
      community_id,
      address_id: community!.Addresses!.find(
        (a) => a.address === admin.address,
      )!.id!,
      topic_id: community!.topics!.at(0)!.id,
      pinned: false,
      read_only: false,
      reaction_weights_sum: '0',
    });
    thread_id = thread!.id!;
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should go through the prediction market lifecycle', async () => {
    // 1. Create Prediction Market (Draft)
    const createPayload = {
      thread_id,
      prompt: 'Will this test pass?',
      collateral_address: '0x1234567890123456789012345678901234567890',
      duration: 86400 * 7,
      resolution_threshold: 0.5,
    };

    const market = await command(CreatePredictionMarket(), {
      actor: admin,
      payload: createPayload,
    });

    expect(market.id).toBeDefined();
    expect(market.status).toBe(schemas.PredictionMarketStatus.Draft);
    expect(market.eth_chain_id).toBe(eth_chain_id);
    expect(market.thread_id).toBe(thread_id);

    // Verify outbox
    const createEvent = await models.Outbox.findOne({
      where: { event_name: 'PredictionMarketCreated' },
      order: [['event_id', 'DESC']],
    });
    expect(createEvent).toBeDefined();
    expect((createEvent!.event_payload as { id: number }).id).toBe(market.id);

    // 2. Deploy Prediction Market (Active)
    const deployPayload = {
      thread_id,
      prediction_market_id: market.id!,
      vault_address: '0x0000000000000000000000000000000000000001',
      governor_address: '0x0000000000000000000000000000000000000002',
      router_address: '0x0000000000000000000000000000000000000003',
      strategy_address: '0x0000000000000000000000000000000000000004',
      p_token_address: '0x0000000000000000000000000000000000000005',
      f_token_address: '0x0000000000000000000000000000000000000006',
      start_time: new Date(),
      end_time: new Date(Date.now() + 86400 * 7 * 1000),
    };

    const deployedMarket = await command(DeployPredictionMarket(), {
      actor: admin,
      payload: deployPayload,
    });

    expect(deployedMarket.status).toBe(schemas.PredictionMarketStatus.Active);
    expect(deployedMarket.vault_address).toBe(deployPayload.vault_address);

    // Verify outbox
    const deployEvent = await models.Outbox.findOne({
      where: { event_name: 'PredictionMarketDeployed' },
      order: [['event_id', 'DESC']],
    });
    expect(deployEvent).toBeDefined();
    expect(
      (deployEvent!.event_payload as { prediction_market_id: number })
        .prediction_market_id,
    ).toBe(market.id);

    // 3. Reconcile ProposalCreated event via Projection
    const projection = PredictionMarketProjection();
    const proposalId = '0xabc123';
    await projection.body.PredictionMarketProposalCreated({
      id: 1,
      name: 'PredictionMarketProposalCreated',
      payload: {
        prediction_market_id: market.id!,
        proposal_id: proposalId,
        eth_chain_id,
        transaction_hash: '0xhash1',
        timestamp: Math.floor(Date.now() / 1000),
      },
    });

    const reconciledMarket1 = await models.PredictionMarket.findByPk(
      market.id!,
    );
    expect(reconciledMarket1!.proposal_id).toBe(proposalId);

    // 4. Reconcile MarketCreated event via Projection
    const marketId = '0xdef456';
    await projection.body.PredictionMarketMarketCreated({
      id: 2,
      name: 'PredictionMarketMarketCreated',
      payload: {
        prediction_market_id: market.id!,
        market_id: marketId,
        eth_chain_id,
        transaction_hash: '0xhash2',
        timestamp: Math.floor(Date.now() / 1000),
      },
    });

    const reconciledMarket2 = await models.PredictionMarket.findByPk(
      market.id!,
    );
    expect(reconciledMarket2!.market_id).toBe(marketId);
  });

  it('should enforce auth for creation', async () => {
    const { actors } = await seedCommunity({ roles: ['nonmember'] });
    const nonmember = actors.nonmember;

    await expect(
      command(CreatePredictionMarket(), {
        actor: nonmember,
        payload: {
          thread_id,
          prompt: 'Should fail',
          collateral_address: '0x123',
          duration: 100,
          resolution_threshold: 0.5,
        },
      }),
    ).rejects.toThrow();
  });
});
