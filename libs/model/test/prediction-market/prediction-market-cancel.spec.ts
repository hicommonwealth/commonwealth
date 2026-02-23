import { Actor, command, dispose } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CancelPredictionMarket,
  CreatePredictionMarket,
  DeployPredictionMarket,
} from '../../src/aggregates/prediction_market';
import { models } from '../../src/database';
import { seed } from '../../src/tester';
import { seedCommunity } from '../utils/community-seeder';

describe('Prediction Market Cancel', () => {
  let admin: Actor;
  let community_id: string;
  let address_id: number;
  let topic_id: number;
  let thread_id: number;

  beforeAll(async () => {
    const { community, actors } = await seedCommunity({
      roles: ['admin'],
      chain_node: { eth_chain_id: 133800 + Math.floor(Math.random() * 10000) },
    });
    admin = actors.admin;
    community_id = community!.id;
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

  it('should cancel a draft prediction market', async () => {
    const [newThread] = await seed('Thread', {
      community_id,
      address_id,
      topic_id,
      pinned: false,
      read_only: false,
      reaction_weights_sum: '0',
    });

    await command(CreatePredictionMarket(), {
      actor: admin,
      payload: {
        thread_id: newThread!.id!,
        prompt: 'Cancel draft test?',
        collateral_address: '0x1234567890123456789012345678901234567890',
        duration: 86400,
        resolution_threshold: 0.5,
      },
    });

    const market = await models.PredictionMarket.findOne({
      where: { thread_id: newThread!.id! },
    });
    expect(market!.status).toBe(schemas.PredictionMarketStatus.Draft);

    const result = await command(CancelPredictionMarket(), {
      actor: admin,
      payload: {
        thread_id: newThread!.id!,
        prediction_market_id: market!.id!,
      },
    });

    expect(result).toBe(true);

    const cancelled = await models.PredictionMarket.findByPk(market!.id!);
    expect(cancelled!.status).toBe(schemas.PredictionMarketStatus.Cancelled);

    // Verify outbox event
    const cancelEvent = await models.Outbox.findOne({
      where: { event_name: 'PredictionMarketCancelled' },
      order: [['event_id', 'DESC']],
    });
    expect(cancelEvent).toBeDefined();
    expect(
      (cancelEvent!.event_payload as { prediction_market_id: number })
        .prediction_market_id,
    ).toBe(market!.id);
  });

  it('should cancel an active prediction market', async () => {
    const [newThread] = await seed('Thread', {
      community_id,
      address_id,
      topic_id,
      pinned: false,
      read_only: false,
      reaction_weights_sum: '0',
    });

    await command(CreatePredictionMarket(), {
      actor: admin,
      payload: {
        thread_id: newThread!.id!,
        prompt: 'Cancel active test?',
        collateral_address: '0x1234567890123456789012345678901234567890',
        duration: 86400,
        resolution_threshold: 0.5,
      },
    });

    const market = await models.PredictionMarket.findOne({
      where: { thread_id: newThread!.id! },
    });

    await command(DeployPredictionMarket(), {
      actor: admin,
      payload: {
        thread_id: newThread!.id!,
        prediction_market_id: market!.id!,
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

    const result = await command(CancelPredictionMarket(), {
      actor: admin,
      payload: {
        thread_id: newThread!.id!,
        prediction_market_id: market!.id!,
      },
    });

    expect(result).toBe(true);

    const cancelled = await models.PredictionMarket.findByPk(market!.id!);
    expect(cancelled!.status).toBe(schemas.PredictionMarketStatus.Cancelled);
  });

  it('should reject cancelling a resolved market', async () => {
    const [newThread] = await seed('Thread', {
      community_id,
      address_id,
      topic_id,
      pinned: false,
      read_only: false,
      reaction_weights_sum: '0',
    });

    await command(CreatePredictionMarket(), {
      actor: admin,
      payload: {
        thread_id: newThread!.id!,
        prompt: 'Resolved cancel test?',
        collateral_address: '0x1234567890123456789012345678901234567890',
        duration: 86400,
        resolution_threshold: 0.5,
      },
    });

    const market = await models.PredictionMarket.findOne({
      where: { thread_id: newThread!.id! },
    });

    // Manually set to resolved
    await models.PredictionMarket.update(
      {
        status: schemas.PredictionMarketStatus.Resolved,
        winner: 1,
        resolved_at: new Date(),
      },
      { where: { id: market!.id } },
    );

    await expect(
      command(CancelPredictionMarket(), {
        actor: admin,
        payload: {
          thread_id: newThread!.id!,
          prediction_market_id: market!.id!,
        },
      }),
    ).rejects.toThrow(
      'Only draft or active prediction markets can be cancelled',
    );
  });

  it('should reject non-author non-admin', async () => {
    const { actors } = await seedCommunity({ roles: ['nonmember'] });
    const nonmember = actors.nonmember;

    await expect(
      command(CancelPredictionMarket(), {
        actor: nonmember,
        payload: {
          thread_id,
          prediction_market_id: 99999,
        },
      }),
    ).rejects.toThrow();
  });
});
