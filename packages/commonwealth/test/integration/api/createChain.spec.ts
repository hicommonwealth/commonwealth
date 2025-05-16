import { command } from '@hicommonwealth/core';
import { models, SuperAdmin, UserInstance } from '@hicommonwealth/model';
import { BalanceType, UserTierMap } from '@hicommonwealth/shared';
import { assert } from 'chai';
import { describe, test } from 'vitest';
import { buildUser } from '../../unit/unitHelpers';

describe('create chain tests', () => {
  test('fails when no eth_chain_id is provided when chain is ethereum', async () => {
    buildUser({
      models,
      userAttributes: {
        email: '',
        id: 1,
        isAdmin: true,
        profile: {},
        tier: UserTierMap.ManuallyVerified,
      },
    }) as UserInstance;
    try {
      await command(SuperAdmin.CreateChainNode(), {
        actor: { user: { id: 1, email: '' } },
        // @ts-expect-error
        payload: {
          url: 'wss://',
          name: 'test',
          balance_type: BalanceType.Ethereum,
        },
      });
    } catch (e) {
      return;
    }

    assert.fail(0, 1, 'Exception not thrown');
  });

  test('fails when eth_chain_id is not a number', async () => {
    buildUser({
      models,
      userAttributes: {
        email: '',
        id: 1,
        isAdmin: true,
        profile: {},
        tier: UserTierMap.ManuallyVerified,
      },
    }) as UserInstance;
    try {
      await command(SuperAdmin.CreateChainNode(), {
        actor: { user: { id: 1, email: '' } },
        payload: {
          url: 'wss://',
          name: 'test',
          balance_type: BalanceType.Ethereum,
          eth_chain_id: 'test' as unknown as number,
        },
      });
    } catch (e) {
      return;
    }

    assert.fail(0, 1, 'Exception not thrown');
  });
});
