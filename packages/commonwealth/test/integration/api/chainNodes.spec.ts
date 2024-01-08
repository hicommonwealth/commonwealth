import { BalanceType } from '@hicommonwealth/core';
import { assert, expect } from 'chai';
import { resetDatabase } from 'server-test';
import models from 'server/database';
import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';
import { UserInstance } from '../../../server/models/user';
import { buildUser } from '../../unit/unitHelpers';

describe('ChainNode Tests', () => {
  beforeEach(async () => {
    await resetDatabase();
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
      },
    });

    const addIdAgain = async () =>
      await models.ChainNode.findOrCreate({
        where: {
          cosmos_chain_id: cosmosChainId,
          balance_type: BalanceType.Cosmos,
          name: 'Cosmos2',
          url: 'https://cosmos-mainnet.g.com/3',
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
