import {
  Actor,
  AppError,
  InvalidActor,
  InvalidState,
  command,
  dispose,
  query,
} from '@hicommonwealth/core';
import { CommunityTierMap } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import {
  GetCommunities,
  GetCommunityStake,
  SetCommunityStake,
} from '../../src/aggregates/community';
import { communityStakeConfigValidator } from '../../src/services/commonProtocol';
import { seed } from '../../src/tester';

describe('Stake lifecycle', () => {
  let id_with_stake: string;
  let id_without_stake_to_set: string;
  let id_without_stake: string;
  let actor: Actor;

  const payload = {
    stake_id: 1,
    stake_token: '',
    vote_weight: 1,
    stake_enabled: true,
  };

  beforeAll(async () => {
    const [node] = await seed('ChainNode', {});
    const [user] = await seed('User', { isAdmin: true });
    const [community_with_stake] = await seed('Community', {
      tier: CommunityTierMap.ManuallyVerified,
      active: true,
      chain_node_id: node!.id!,
      namespace: 'test1',
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'admin',
          user_id: user!.id,
          is_banned: false,
          verified: new Date(),
        },
      ],
      CommunityStakes: [
        {
          stake_id: 1,
          stake_token: 'token',
          vote_weight: 1,
          stake_enabled: true,
        },
      ],
    });
    const [community_without_stake_to_set] = await seed('Community', {
      tier: CommunityTierMap.ChainVerified,
      active: true,
      chain_node_id: node!.id!,
      namespace: 'test2',
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          ...community_with_stake!.Addresses!.at(0)!,
          id: undefined,
          is_banned: false,
          verified: new Date(),
        },
      ],
    });
    const [community_without_stake] = await seed('Community', {
      tier: CommunityTierMap.ChainVerified,
      active: true,
      chain_node_id: node!.id!,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          ...community_with_stake!.Addresses!.at(0)!,
          id: undefined,
          is_banned: false,
          verified: new Date(),
        },
      ],
    });

    id_with_stake = community_with_stake!.id!;
    id_without_stake_to_set = community_without_stake_to_set!.id!;
    id_without_stake = community_without_stake!.id!;
    actor = {
      user: { id: user!.id!, email: user!.email! },
      address: community_with_stake!.Addresses!.at(0)!.address!,
    };

    vi.spyOn(
      communityStakeConfigValidator,
      'validateCommunityStakeConfig',
    ).mockImplementation((c) => {
      if (!c.namespace) throw new AppError('No namespace');
      // if (c.id === id_without_stake_to_set) throw new AppError('No stake');
      return Promise.resolve(undefined);
    });
  });

  afterAll(async () => {
    await dispose()();
    vi.restoreAllMocks();
  });

  test('should query community that has stake enabled', async () => {
    const results = await query(GetCommunities(), {
      actor,
      payload: { stake_enabled: true } as any,
    });
    expect(results?.totalResults).to.eq(1);
    expect(results?.results?.at(0)?.id).to.eq(id_with_stake);
  });

  test('should fail set when community namespace not configured', async () => {
    await expect(
      command(SetCommunityStake(), {
        actor,
        payload: { ...payload, community_id: id_with_stake },
      }),
    ).rejects.toThrow();
  });

  test('should set and get community stake', async () => {
    const cr = await command(SetCommunityStake(), {
      actor,
      payload: { ...payload, community_id: id_without_stake_to_set },
    });
    expect(cr).to.deep.contains({
      CommunityStakes: [
        {
          community_id: id_without_stake_to_set,
          ...payload,
          created_at: cr?.CommunityStakes?.at(0)?.created_at,
          updated_at: cr?.CommunityStakes?.at(0)?.updated_at,
        },
      ],
    });

    const qr = await query(GetCommunityStake(), {
      actor,
      payload: { community_id: id_without_stake_to_set },
    });
    expect(qr?.stake).to.deep.include({ ...payload });

    const commr = await query(GetCommunities(), {
      actor,
      payload: { stake_enabled: true } as any,
    });
    expect(commr?.totalResults).to.eq(2);
  });

  test('should fail set when community not found', async () => {
    await expect(
      command(SetCommunityStake(), {
        actor,
        payload: { ...payload, community_id: 'does-not-exist' },
      }),
    ).rejects.toThrow(InvalidActor);
  });

  test('should fail set when community stake has been configured', async () => {
    try {
      await command(SetCommunityStake(), {
        actor,
        payload: { ...payload, community_id: id_with_stake },
      });
      throw new Error('Expected to throw');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      expect(err).toBeInstanceOf(InvalidState);
      expect(err.message).toBe(`Community stake already configured`);
    }
  });

  test('should get empty result when community stake not configured', async () => {
    const qr = await query(GetCommunityStake(), {
      actor,
      payload: { community_id: id_without_stake },
    });
    expect(qr?.stake).to.be.undefined;
  });
});
