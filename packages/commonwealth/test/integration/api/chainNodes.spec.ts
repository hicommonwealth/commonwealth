import { command, dispose } from '@hicommonwealth/core';
import {
  SuperAdmin,
  tester,
  type DB,
  type UserInstance,
} from '@hicommonwealth/model';
import { BalanceType, UserTierMap } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { buildUser } from '../../unit/unitHelpers';

describe('ChainNode Tests', () => {
  let models: DB;

  beforeAll(async () => {
    models = await tester.seedDb();
  });

  afterAll(async () => {
    await dispose()();
  });

  test('Creates new ChainNode when', async () => {
    buildUser({
      userAttributes: {
        email: '',
        id: 1,
        isAdmin: true,
        profile: {},
        tier: UserTierMap.ManuallyVerified,
      },
    }) as UserInstance;
    const actor = { user: { id: 1, email: '', isAdmin: true } };

    const resp = await command(SuperAdmin.CreateChainNode(), {
      actor,
      payload: {
        url: 'wss://abc.com',
        name: 'asd',
        balance_type: BalanceType.Ethereum,
        eth_chain_id: 123,
      },
    });

    const createdNode = await models.ChainNode.findOne({
      where: { id: resp!.node_id },
    });
    expect(createdNode!.url).toBe('wss://abc.com');
    expect(createdNode!.name).toBe('asd');
    expect(createdNode!.balance_type).toBe('ethereum');
    expect(createdNode!.eth_chain_id).toBe(123);
  });

  test('adds eth chain node to db', async () => {
    await models.ChainNode.destroy({ where: { eth_chain_id: 123 } });
    expect(
      await models.ChainNode.count({
        where: { eth_chain_id: 123 },
      }),
    ).toBe(0);

    await models.ChainNode.findOrCreate({
      where: {
        eth_chain_id: 123,
        balance_type: BalanceType.Ethereum,
        name: 'Ethereum',
        url: 'https://eth-mainnet.g.alchemy.com/xyz',
      },
    });
    expect(
      await models.ChainNode.count({
        where: { eth_chain_id: 123 },
      }),
    ).toBe(1);
  });

  test('fails when duplicate eth_chain_id', async () => {
    const ethChainId = 555;
    expect(
      await models.ChainNode.count({
        where: { eth_chain_id: ethChainId },
      }),
    ).toBe(0);

    await models.ChainNode.findOrCreate({
      where: {
        eth_chain_id: ethChainId,
        balance_type: BalanceType.Ethereum,
        name: 'Ethereum1',
        url: 'https://eth-mainnet.g.com/2',
      },
    });

    const addIdAgain = async () =>
      await models.ChainNode.findOrCreate({
        where: {
          eth_chain_id: ethChainId,
          balance_type: BalanceType.Ethereum,
          name: 'Ethereum2',
          url: 'https://eth-mainnet.g.com/3',
        },
      });

    try {
      await addIdAgain();
    } catch (e) {
      expect(e.errors[0].type).toEqual('unique violation');
      expect(e.errors[0].message).toEqual('eth_chain_id must be unique');
    }
  });

  test('adds cosmos chain node to db', async () => {
    const cosmosChainId = 'osmosiz';
    expect(
      await models.ChainNode.count({
        where: { cosmos_chain_id: cosmosChainId },
      }),
    ).toBe(0);

    await models.ChainNode.findOrCreate({
      where: {
        cosmos_chain_id: cosmosChainId,
        balance_type: BalanceType.Cosmos,
        name: 'Osmosis',
        url: 'https://osmosis-mainnet.g.com/2',
        slip44: 118,
      },
    });

    expect(
      await models.ChainNode.count({
        where: { cosmos_chain_id: cosmosChainId },
      }),
    ).toBe(1);
  });

  test('fails when duplicate cosmos_chain_id', async () => {
    const cosmosChainId = 'cosmoz';
    expect(
      await models.ChainNode.count({
        where: { cosmos_chain_id: cosmosChainId },
      }),
    ).toBe(0);

    await models.ChainNode.findOrCreate({
      where: {
        cosmos_chain_id: cosmosChainId,
        balance_type: BalanceType.Cosmos,
        name: 'Cosmos1',
        url: 'https://cosmos-mainnet.g.com/2',
        slip44: 118,
      },
    });

    const addIdAgain = async () =>
      await models.ChainNode.findOrCreate({
        where: {
          cosmos_chain_id: cosmosChainId,
          balance_type: BalanceType.Cosmos,
          name: 'Cosmos2',
          url: 'https://cosmos-mainnet.g.com/3',
          slip44: 118,
        },
      });

    try {
      await addIdAgain();
    } catch (e) {
      expect(e.errors[0].type).toEqual('unique violation');
      expect(e.errors[0].message).toEqual('cosmos_chain_id must be unique');
    }

    expect(
      await models.ChainNode.count({
        where: { cosmos_chain_id: cosmosChainId },
      }),
    ).toBe(1);
  });
});
