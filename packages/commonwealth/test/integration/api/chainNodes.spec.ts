import { dispose } from '@hicommonwealth/core';
import { tester, type DB, type UserInstance } from '@hicommonwealth/model';
import { BalanceType } from '@hicommonwealth/shared';
import { assert, expect } from 'chai';
import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';
import { buildUser } from '../../unit/unitHelpers';

describe('ChainNode Tests', () => {
  let models: DB;

  before(async () => {
    models = await tester.seedDb();
  });

  after(async () => {
    await dispose()();
  });

  it('Creates new ChainNode when', async () => {
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
    assert.equal(createdNode.url, 'wss://');
    assert.equal(createdNode.name, 'asd');
    assert.equal(createdNode.balance_type, 'ethereum');
    assert.equal(createdNode.eth_chain_id, 123);
  });

  it('adds eth chain node to db', async () => {
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

  it('fails when duplicate eth_chain_id', async () => {
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

  it('adds cosmos chain node to db', async () => {
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

  it('fails when duplicate cosmos_chain_id', async () => {
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

  it('Updates a ChainNode from community controller', async () => {
    it('EVM', async () => {
      const eth_chain_id = 123;
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
        id: createdNode.id,
        user,
        url: 'https://eth-mainnet.g.com/3',
        name: 'Ethereum3',
        eth_chain_id,
      });

      const updatedNode = await models.ChainNode.findOne({
        where: { eth_chain_id },
      });
      assert.equal(updatedNode.url, 'https://eth-mainnet.g.com/3');
      assert.equal(updatedNode.name, 'Ethereum3');
      assert.equal(updatedNode.balance_type, 'ethereum');
      assert.equal(updatedNode.eth_chain_id, 123);
    });

    it('Cosmos', async () => {
      const cosmos_chain_id = 'osmosiz';
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
      assert.equal(updatedNode.url, 'https://cosmos-mainnet.g.com/4');
      assert.equal(updatedNode.name, 'mmm');
      assert.equal(updatedNode.balance_type, 'cosmos');
      assert.equal(updatedNode.cosmos_chain_id, 'osmosiz');
      assert.equal(updatedNode.slip44, 118);
    });
  });
});
