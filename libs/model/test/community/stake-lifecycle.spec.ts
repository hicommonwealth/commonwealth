import {
  Actor,
  AppError,
  InvalidActor,
  InvalidState,
  command,
  dispose,
  query,
} from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Sinon from 'sinon';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { GetCommunityStake, SetCommunityStake } from '../../src/community';
import { commonProtocol } from '../../src/services';
import { seed } from '../../src/tester';

chai.use(chaiAsPromised);

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
      chain_node_id: node?.id,
      Addresses: [
        {
          role: 'admin',
          user_id: user!.id,
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
      chain_node_id: node?.id,
      Addresses: [
        {
          ...community_with_stake!.Addresses!.at(0)!,
          id: undefined,
        },
      ],
    });
    const [community_without_stake] = await seed('Community', {
      chain_node_id: node?.id,
      Addresses: [
        {
          ...community_with_stake!.Addresses!.at(0)!,
          id: undefined,
        },
      ],
    });

    id_with_stake = community_with_stake!.id!;
    id_without_stake_to_set = community_without_stake_to_set!.id!;
    id_without_stake = community_without_stake!.id!;
    actor = {
      user: { id: user!.id!, email: user!.email! },
      address_id: community_with_stake!.Addresses!.at(0)!.address!,
    };

    Sinon.stub(
      commonProtocol.communityStakeConfigValidator,
      'validateCommunityStakeConfig',
    ).callsFake((c) => {
      if (!c.namespace) throw new AppError('No namespace');
      if (c.id === id_without_stake_to_set) throw new AppError('No stake');
      return Promise.resolve(undefined);
    });
  });

  afterAll(async () => {
    await dispose()();
    Sinon.restore();
  });

  test('should fail set when community namespace not configured', () => {
    expect(
      command(SetCommunityStake(), {
        actor,
        payload: { ...payload, id: id_with_stake },
      }),
    ).to.eventually.be.rejected;
  });

  test('should set and get community stake', async () => {
    const cr = await command(SetCommunityStake(), {
      actor,
      payload: { ...payload, id: id_without_stake_to_set },
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
    expect(qr).to.deep.include({ ...payload });
  });

  test('should fail set when community not found', async () => {
    expect(
      command(SetCommunityStake(), {
        actor,
        payload: { ...payload, id: 'does-not-exist' },
      }),
    ).to.eventually.be.rejectedWith(InvalidActor);
  });

  test('should fail set when community stake has been configured', () => {
    expect(
      command(SetCommunityStake(), {
        actor,
        payload: { ...payload, id: id_with_stake },
      }),
    ).to.eventually.be.rejectedWith(
      InvalidState,
      `Stake 1 already configured in community ${id_with_stake}`,
    );
  });

  test('should get empty result when community stake not configured', async () => {
    const qr = await query(GetCommunityStake(), {
      actor,
      payload: { community_id: id_without_stake },
    });
    expect(qr).to.be.undefined;
  });
});
