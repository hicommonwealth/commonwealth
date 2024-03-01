import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  dispose,
} from '@hicommonwealth/core';
import { expect } from 'chai';
import { step } from 'mocha-steps';
import z from 'zod';
import {
  ChainNodeSchema,
  CommunitySchema,
  CommunityStakeSchema,
  ContractSchema,
  SchemaWithModel,
  TopicSchema,
  UserSchema,
  checkDb,
  seed,
} from '../../src/test';

async function testSeed<T extends SchemaWithModel<any>>(
  schemaModel: T,
  overrides: Partial<z.infer<T['schema']>> = {},
  options?: {
    exclude?: (keyof typeof overrides)[];
  },
) {
  const createdEntity = await seed(schemaModel, overrides);
  expect(createdEntity, 'failed to create entity').not.to.be.null;

  const data = await schemaModel.schema.parse(createdEntity.toJSON());

  // build query that will find the entity, or default to using `id`
  const findQuery: Partial<z.infer<T['schema']>> = (() => {
    if (schemaModel.buildFindQuery) {
      // not all entities have a single primary key
      const q = schemaModel.buildFindQuery(data);
      const attributes = Object.keys(q.where);
      for (const attribute of attributes) {
        expect(data, 'created entity is missing id').to.have.property(
          attribute,
        );
      }
      return q;
    } else {
      expect(data, 'created entity is missing id').to.have.property('id');
      return {
        where: {
          id: data.id,
        },
      };
    }
  })();

  const existingEntity = await schemaModel.model.findOne(findQuery);
  expect(existingEntity, 'failed to find created entity after creation').not.to
    .be.null;

  const overridesToCheck = Object.keys(overrides).reduce((acc, k) => {
    if (options?.exclude?.includes(k)) {
      return acc;
    }
    return {
      ...acc,
      [k]: overrides[k],
    };
  }, {});

  const result = schemaModel.schema.parse(existingEntity?.toJSON());
  expect(
    result,
    `overrides do not match found entity: ${JSON.stringify(
      overrides,
      null,
      2,
    )} !== ${JSON.stringify(existingEntity?.toJSON(), null, 2)}`,
  ).to.contain(overridesToCheck);
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
      await testSeed(UserSchema);
      await testSeed(UserSchema);
    });

    step('Should seed with overrides', async () => {
      // NOTE: some props like emailVerified and isAdmin
      // are explicitly excluded via sequelize model config
      await testSeed(
        UserSchema,
        {
          email: 'temp@gmail.com',
          emailVerified: true,
          isAdmin: true,
        },
        {
          exclude: ['emailVerified', 'isAdmin'],
        },
      );
    });
  });

  describe('ChainNode', () => {
    step('Should seed with defaults', async () => {
      await testSeed(ChainNodeSchema);
      await testSeed(ChainNodeSchema);
    });

    step('Should seed with overrides', async () => {
      await testSeed(ChainNodeSchema, {
        url: 'mainnet1.edgewa.re',
        name: 'Edgeware Mainnet',
        balance_type: BalanceType.Substrate,
      });
    });
  });

  describe('Contract', () => {
    step('Should seed with defaults', async () => {
      await testSeed(ContractSchema);
      await testSeed(ContractSchema);
    });

    step('Should seed with overrides', async () => {
      await testSeed(ContractSchema, {
        address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
        token_name: 'sushi',
        symbol: 'SUSHI',
        type: ChainNetwork.ERC20,
        chain_node_id: 1,
      });
    });
  });

  describe('Community', () => {
    step('Should seed with defaults', async () => {
      await testSeed(CommunitySchema);
      await testSeed(CommunitySchema);
    });

    step('Should seed with overrides', async () => {
      await testSeed(CommunitySchema, {
        id: 'ethereum',
        network: ChainNetwork.Ethereum,
        default_symbol: 'ETH',
        name: 'Ethereum',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.Ethereum,
        has_chain_events_listener: false,
        chain_node_id: 1,
      });
    });
  });

  describe('Topic', () => {
    step('Should seed with defaults', async () => {
      await testSeed(TopicSchema);
      await testSeed(TopicSchema);
    });

    step('Should seed with overrides', async () => {
      await testSeed(TopicSchema, {
        community_id: 'ethereum',
        name: 'General',
      });
    });
  });

  describe('CommunityStake', () => {
    step('Should seed with defaults', async () => {
      await testSeed(CommunityStakeSchema);
      await testSeed(CommunityStakeSchema);
    });

    step('Should seed with overrides', async () => {
      await testSeed(CommunityStakeSchema, {
        community_id: 'ethereum',
        stake_id: 1,
        stake_token: '',
        vote_weight: 1,
        stake_enabled: true,
      });
    });
  });
});
