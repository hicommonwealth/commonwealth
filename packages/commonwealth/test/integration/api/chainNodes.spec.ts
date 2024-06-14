import { dispose } from '@hicommonwealth/core';
import { tester, type DB, type UserInstance } from '@hicommonwealth/model';
import { BalanceType } from '@hicommonwealth/shared';
import { assert, expect } from 'chai';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';
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
    // @ts-expect-error StrictNullChecks
    const controller = new ServerCommunitiesController(models, null);
    const user: UserInstance = buildUser({
      models,
      userAttributes: { email: '', id: 1, isAdmin: true },
    }) as UserInstance;
    const resp = await controller.createChainNode({
      user,
      url: 'wss://',
      name: 'asd',
      balanceType: 'ethereum',
      eth_chain_id: 123,
    });

    const createdNode = await models.ChainNode.findOne({
      where: { id: resp.node_id },
    });
    // @ts-expect-error StrictNullChecks
    assert.equal(createdNode.url, 'wss://');
    // @ts-expect-error StrictNullChecks
    assert.equal(createdNode.name, 'asd');
    // @ts-expect-error StrictNullChecks
    assert.equal(createdNode.balance_type, 'ethereum');
    // @ts-expect-error StrictNullChecks
    assert.equal(createdNode.eth_chain_id, 123);
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

  describe('Updates a ChainNode from community controller', () => {
    beforeAll(async () => {
      await tester.bootstrap_testing(true);
    });

    test('EVM', async () => {
      const eth_chain_id = 123;
      // @ts-expect-error StrictNullChecks
      const controller = new ServerCommunitiesController(models, null);

      const [createdNode] = await models.ChainNode.findOrCreate({
        where: {
          eth_chain_id,
          balance_type: BalanceType.Ethereum,
          name: 'Ethereum1',
          url: 'https://eth-mainnet.g.com/2',
        },
      });

      const user: UserInstance = buildUser({
        models,
        userAttributes: { email: '', id: 1, isAdmin: true },
      }) as UserInstance;

      await controller.updateChainNode({
        // @ts-expect-error StrictNullChecks
        id: createdNode.id,
        user,
        url: 'https://eth-mainnet.g.com/3',
        name: 'Ethereum3',
        eth_chain_id,
      });

      const updatedNode = await models.ChainNode.findOne({
        where: { eth_chain_id },
      });
      // @ts-expect-error StrictNullChecks
      assert.equal(updatedNode.url, 'https://eth-mainnet.g.com/3');
      // @ts-expect-error StrictNullChecks
      assert.equal(updatedNode.name, 'Ethereum3');
      // @ts-expect-error StrictNullChecks
      assert.equal(updatedNode.balance_type, 'ethereum');
      // @ts-expect-error StrictNullChecks
      assert.equal(updatedNode.eth_chain_id, 123);
    });

    test('Cosmos', async () => {
      const cosmos_chain_id = 'osmosiz';
      // @ts-expect-error StrictNullChecks
      const controller = new ServerCommunitiesController(models, null);
      const user: UserInstance = buildUser({
        models,
        userAttributes: { email: '', id: 1, isAdmin: true },
      }) as UserInstance;

      assert.equal(
        await models.ChainNode.count({
          where: { cosmos_chain_id },
        }),
        0,
      );

      const [createdNode] = await models.ChainNode.findOrCreate({
        where: {
          cosmos_chain_id,
          balance_type: BalanceType.Cosmos,
          name: 'Osmosis',
          url: 'https://osmosis-mainnet.g.com/2',
          slip44: 118,
        },
      });

      await controller.updateChainNode({
        // @ts-expect-error StrictNullChecks
        id: createdNode.id,
        user,
        url: 'https://cosmos-mainnet.g.com/4',
        name: 'mmm',
        cosmos_chain_id,
        slip44: 118,
      });

      const updatedNode = await models.ChainNode.findOne({
        where: { cosmos_chain_id },
      });
      // @ts-expect-error StrictNullChecks
      assert.equal(updatedNode.url, 'https://cosmos-mainnet.g.com/4');
      // @ts-expect-error StrictNullChecks
      assert.equal(updatedNode.name, 'mmm');
      // @ts-expect-error StrictNullChecks
      assert.equal(updatedNode.balance_type, 'cosmos');
      // @ts-expect-error StrictNullChecks
      assert.equal(updatedNode.cosmos_chain_id, 'osmosiz');
      // @ts-expect-error StrictNullChecks
      assert.equal(updatedNode.slip44, 118);
    });
  });
});
