import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  NotificationCategories,
  dispose,
  schemas,
  type DeepPartial,
} from '@hicommonwealth/core';
import { expect } from 'chai';
import { step } from 'mocha-steps';
import { Model, ModelStatic } from 'sequelize';
import z from 'zod';
import { models } from '../../src/database';
import { SeedOptions, checkDb, seed } from '../../src/test';

// testSeed creates an entity using the `seed` function
// then attempts to find the entity and validate it
async function testSeed<T extends schemas.Aggregates>(
  name: T,
  values?: DeepPartial<z.infer<typeof schemas.entities[T]>>,
  options: SeedOptions = { mock: true },
): Promise<z.infer<typeof schemas.entities[T]>> {
  const [record, records] = await seed(name, values, options);
  expect(records.length, 'failed to create entity').to.be.gt(0);

  // perform schema validation on created entity (throws)
  const schema = schemas.entities[name];
  const model = models[name];
  const data = await schema.parse(record);

  // attempt to find entity that was created
  const existingEntity = await (model as ModelStatic<Model>).findOne({
    where: {
      [model.primaryKeyAttribute]: data[model.primaryKeyAttribute],
    },
  });
  expect(existingEntity, 'failed to find created entity after creation').not.to
    .be.null;

  // perform schema validation on found entity (throws)
  return data;
}

describe('Seed functions', () => {
  before(async () => {
    await checkDb();
    const { models } = await import('../..');
    await models.sequelize.sync({ force: true });
  });

  after(async () => {
    await dispose()();
  });

  describe('User', () => {
    step('Should seed with defaults', async () => {
      await testSeed('User');
      await testSeed('User');
    });

    step('Should not mock data', async () => {
      let seedErr = null;
      try {
        await testSeed('User', {}, { mock: false });
      } catch (err) {
        seedErr = err;
      }
      expect(seedErr).to.be.an('error');
      expect(seedErr).to.have.property('name', 'ZodError');
    });

    step('Should seed with overrides', async () => {
      const values = {
        email: 'temp@gmail.com',
        emailVerified: true,
        isAdmin: true,
      };
      // NOTE: some props like emailVerified and isAdmin
      // are explicitly excluded via sequelize model config
      const result = await testSeed('User', values);
      expect(result).contains(values);
    });
  });

  describe('ChainNode', () => {
    step('Should seed with defaults', async () => {
      await testSeed('ChainNode', { contracts: undefined });
      await testSeed('ChainNode', { contracts: undefined });
    });

    step('Should seed with overrides', async () => {
      await testSeed('ChainNode', {
        url: 'mainnet1.edgewa.re',
        name: 'Edgeware Mainnet',
        balance_type: BalanceType.Substrate,
        contracts: [
          {
            address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
            token_name: 'sushi',
            symbol: 'SUSHI',
            type: ChainNetwork.ERC20,
            chain_node_id: 1,
            abi_id: undefined,
          },
        ],
      });
    });
  });

  describe('Community', () => {
    step('Should seed with overrides', async () => {
      const node = await testSeed('ChainNode', { contracts: undefined });
      const user = await testSeed('User');
      await testSeed('Community', {
        id: 'ethereum',
        network: ChainNetwork.Ethereum,
        default_symbol: 'ETH',
        name: 'Ethereum',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.Ethereum,
        has_chain_events_listener: false,
        chain_node_id: node!.id,
        Addresses: [
          {
            user_id: user.id,
            profile_id: undefined,
            address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
            community_id: 'ethereum',
            verification_token: 'PLACEHOLDER',
            verification_token_expires: undefined,
            verified: new Date(),
            role: 'admin',
            is_user_default: false,
          },
        ],
        CommunityStakes: [],
      });

      const community = await testSeed('Community', {
        id: 'superEth',
        network: ChainNetwork.Ethereum,
        default_symbol: 'SETH',
        name: 'Super Eth',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.Ethereum,
        has_chain_events_listener: false,
        chain_node_id: node!.id,
        Addresses: [
          {
            user_id: user.id,
            profile_id: undefined,
            address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
            community_id: 'ethereum',
            verification_token: 'PLACEHOLDER',
            verification_token_expires: undefined,
            verified: new Date(),
            role: 'admin',
            is_user_default: false,
          },
        ],
        CommunityStakes: [],
        groups: [
          {
            metadata: {
              name: 'hello',
              description: 'blah',
            },
          },
        ],
        topics: [{}, {}],
      });

      await testSeed('NotificationCategory', {
        name: NotificationCategories.NewThread,
        description: 'someone makes a new thread',
      });

      await testSeed('Subscription', {
        subscriber_id: 1,
        category_id: NotificationCategories.NewThread,
        is_active: true,
        community_id: community!.id,
        thread_id: undefined,
        comment_id: undefined,
      });
    });
  });

  describe('SnapshotSpace', () => {
    step('Should seed with overrides', async () => {
      await testSeed('SnapshotSpace', {
        snapshot_space: 'test space',
      });
    });
  });

  describe('SnapshotProposal', () => {
    step('Should seed with defaults', async () => {
      await testSeed('SnapshotProposal', {
        space: 'test space',
      });
      await testSeed('SnapshotProposal', {
        space: 'test space',
      });
    });

    step('Should seed with overrides', async () => {
      await testSeed('SnapshotProposal', {
        id: '1',
        title: 'Test Snapshot Proposal',
        body: 'This is a test proposal',
        // TODO: fix equivalence assertion in test
        // choices: ['Yes', 'No'],
        space: 'test space',
        event: 'proposal/created',
        start: new Date().toString(),
        expire: new Date(
          new Date().getTime() + 100 * 24 * 60 * 60 * 1000,
        ).toString(),
      });
    });
  });
});
