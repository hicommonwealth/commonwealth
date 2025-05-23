import { command, dispose } from '@hicommonwealth/core';
import {
  SuperAdmin,
  tester,
  type DB,
  type UserInstance,
} from '@hicommonwealth/model';
import { BalanceType, UserTierMap } from '@hicommonwealth/shared';
import { assert, expect } from 'chai';
import { afterAll, beforeAll, describe, test } from 'vitest';
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
    assert.equal(createdNode!.url, 'wss://abc.com');
    assert.equal(createdNode!.name, 'asd');
    assert.equal(createdNode!.balance_type, 'ethereum');
    assert.equal(createdNode!.eth_chain_id, 123);
  });

  test('adds eth chain node to db', async () => {
    await models.ChainNode.destroy({ where: { eth_chain_id: 123 } });
    assert.equal(
      await models.ChainNode.count({
        where: { eth_chain_id: 123 },
      }),
      0,
    );

    await models.ChainNode.findOrCreate({
      where: {
        eth_chain_id: 123,
        balance_type: BalanceType.Ethereum,
        name: 'Ethereum',
        url: 'https://eth-mainnet.g.alchemy.com/xyz',
      },
    });
    assert.equal(
      await models.ChainNode.count({
        where: { eth_chain_id: 123 },
      }),
      1,
    );
  });

  test('fails when duplicate eth_chain_id', async () => {
    const ethChainId = 555;
    assert.equal(
      await models.ChainNode.count({
        where: { eth_chain_id: ethChainId },
      }),
      0,
    );

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
      expect(e.errors[0].type).to.eql('unique violation');
      expect(e.errors[0].message).to.eql('eth_chain_id must be unique');
    }
  });

  test('adds cosmos chain node to db', async () => {
    const cosmosChainId = 'osmosiz';
    assert.equal(
      await models.ChainNode.count({
        where: { cosmos_chain_id: cosmosChainId },
      }),
      0,
    );

    await models.ChainNode.findOrCreate({
      where: {
        cosmos_chain_id: cosmosChainId,
        balance_type: BalanceType.Cosmos,
        name: 'Osmosis',
        url: 'https://osmosis-mainnet.g.com/2',
        slip44: 118,
      },
    });

    assert.equal(
      await models.ChainNode.count({
        where: { cosmos_chain_id: cosmosChainId },
      }),
      1,
    );
  });

  test('fails when duplicate cosmos_chain_id', async () => {
    const cosmosChainId = 'cosmoz';
    assert.equal(
      await models.ChainNode.count({
        where: { cosmos_chain_id: cosmosChainId },
      }),
      0,
    );

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
      expect(e.errors[0].type).to.eql('unique violation');
      expect(e.errors[0].message).to.eql('cosmos_chain_id must be unique');
    }

    assert.equal(
      await models.ChainNode.count({
        where: { cosmos_chain_id: cosmosChainId },
      }),
      1,
    );
  });
});
