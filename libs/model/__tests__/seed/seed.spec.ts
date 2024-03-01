import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  NotificationCategories,
  dispose,
} from '@hicommonwealth/core';
import { expect } from 'chai';
import { step } from 'mocha-steps';
import z from 'zod';
import {
  AddressSchema,
  ChainNodeSchema,
  CommunityContractSchema,
  CommunitySchema,
  CommunityStakeSchema,
  ContractSchema,
  NotificationCategorySchema,
  ProfileSchema,
  SchemaWithModel,
  SnapshotProposalSchema,
  SnapshotSpaceSchema,
  SubscriptionSchema,
  TopicSchema,
  UserSchema,
  checkDb,
  seed,
} from '../../src/test';

// testSeed creates an entity using the `seed` function
// then attempts to find the entity and validate it
async function testSeed<T extends SchemaWithModel<any>>(
  schemaModel: T, // zod schema
  overrides: Partial<z.infer<T['schema']>> = {}, // override attributes
  options?: {
    seedOptions?: {
      // options for seeding
      noMock: boolean;
    };
    testOptions?: {
      // options for test
      excludeOverrideChecks?: (keyof typeof overrides)[];
    };
  },
) {
  // create entity
  const createdEntity = await seed(
    schemaModel,
    overrides,
    options?.seedOptions,
  );
  expect(createdEntity, 'failed to create entity').not.to.be.null;

  // perform schema validation on created entity (throws)
  const data = await schemaModel.schema.parse(createdEntity.toJSON());

  // build query that will find the entity, or default to using `id`
  const findQuery: Partial<z.infer<T['schema']>> = (() => {
    if (schemaModel.buildQuery) {
      // not all entities have a single primary key,
      // so build a query for it
      const q = schemaModel.buildQuery(data);
      const attributes = Object.keys(q.where);
      for (const attribute of attributes) {
        expect(data, 'created entity is missing id').to.have.property(
          attribute,
        );
      }
      return q;
    } else {
      // use `id` as default primary key
      expect(data, 'created entity is missing id').to.have.property('id');
      return {
        where: {
          id: data.id,
        },
      };
    }
  })();

  // attempt to find entity that was created
  const existingEntity = await schemaModel.model.findOne(findQuery);
  expect(existingEntity, 'failed to find created entity after creation').not.to
    .be.null;

  // perform schema validation on found entity (throws)
  const result = schemaModel.schema.parse(existingEntity?.toJSON());

  // check that the final entity matches the specified overrides,
  // except for explicitly excluded attributes
  const overridesToCheck = Object.keys(overrides).reduce((acc, k) => {
    if (options?.testOptions?.excludeOverrideChecks?.includes(k)) {
      return acc;
    }
    return {
      ...acc,
      [k]: overrides[k],
    };
  }, {});
  expect(
    result,
    `final entity does not match specified overrides:${JSON.stringify(
      existingEntity?.toJSON(),
      null,
      2,
    )} !== ${JSON.stringify(overrides, null, 2)}`,
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

    step('Should not mock data if noMock option is provided', async () => {
      let seedErr = null;
      try {
        await testSeed(
          UserSchema,
          {},
          {
            seedOptions: {
              noMock: true,
            },
          },
        );
      } catch (err) {
        seedErr = err;
      }
      expect(seedErr).to.be.an('error');
      expect(seedErr).to.have.property('name', 'ZodError');
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
          testOptions: {
            excludeOverrideChecks: ['emailVerified', 'isAdmin'],
          },
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
      await testSeed(CommunitySchema, {
        id: 'superEth',
        network: ChainNetwork.Ethereum,
        default_symbol: 'SETH',
        name: 'Super Eth',
        icon_url: '/static/img/protocols/eth.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.Ethereum,
        has_chain_events_listener: false,
        chain_node_id: 2,
      });
    });
  });

  describe('CommunityContract', () => {
    step('Should seed with defaults', async () => {
      // has community ID unique constraint,
      // so can only seed with default values once
      await testSeed(CommunityContractSchema);
    });

    step('Should seed with overrides', async () => {
      await testSeed(CommunityContractSchema, {
        community_id: 'superEth',
        contract_id: 2,
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

  describe('Profile', () => {
    step('Should seed with defaults', async () => {
      await testSeed(ProfileSchema);
      await testSeed(ProfileSchema);
    });

    step('Should seed with overrides', async () => {
      await testSeed(ProfileSchema, {
        user_id: 1,
        profile_name: 'blah',
      });
    });
  });

  describe('Address', () => {
    step('Should seed with defaults', async () => {
      await testSeed(AddressSchema);
      await testSeed(AddressSchema);
    });

    step('Should seed with overrides', async () => {
      await testSeed(
        AddressSchema,
        {
          user_id: 1,
          address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
          community_id: 'ethereum',
          verification_token: 'PLACEHOLDER',
          verification_token_expires: undefined,
          verified: new Date(),
          role: 'admin',
          is_user_default: false,
        },
        {
          testOptions: {
            excludeOverrideChecks: [
              'verification_token',
              'verification_token_expires',
              'verified',
            ],
          },
        },
      );
    });
  });

  describe('NotificationCategory', () => {
    step('Should seed with defaults', async () => {
      await testSeed(NotificationCategorySchema);
      await testSeed(NotificationCategorySchema);
    });

    step('Should seed with overrides', async () => {
      await testSeed(NotificationCategorySchema, {
        name: NotificationCategories.NewThread,
        description: 'someone makes a new thread',
      });
    });
  });

  describe('Subscription', () => {
    step('Should seed with defaults', async () => {
      await testSeed(SubscriptionSchema);
      await testSeed(SubscriptionSchema);
    });

    step('Should seed with overrides', async () => {
      await testSeed(SubscriptionSchema, {
        subscriber_id: 1,
        category_id: NotificationCategories.NewThread,
        is_active: true,
      });
    });
  });

  describe('SnapshotSpace', () => {
    step('Should seed with defaults', async () => {
      await testSeed(SnapshotSpaceSchema);
      await testSeed(SnapshotSpaceSchema);
    });

    step('Should seed with overrides', async () => {
      await testSeed(SnapshotSpaceSchema, {
        snapshot_space: 'test space',
      });
    });
  });

  describe('SnapshotProposal', () => {
    step('Should seed with defaults', async () => {
      await testSeed(SnapshotProposalSchema, {
        space: 'test space',
      });
      await testSeed(SnapshotProposalSchema, {
        space: 'test space',
      });
    });

    step('Should seed with overrides', async () => {
      await testSeed(SnapshotProposalSchema, {
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
