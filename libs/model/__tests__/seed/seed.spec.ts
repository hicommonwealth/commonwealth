import { BalanceType, dispose } from '@hicommonwealth/core';
import { expect } from 'chai';
import { step } from 'mocha-steps';
import z from 'zod';
import {
  ChainNodeSchema,
  ContractSchema,
  SchemaWithModel,
  UserSchema,
  checkDb,
  seed,
} from '../../src/test';

async function testSeed<T extends SchemaWithModel<any>>(
  schemaModel: T,
  overrides: Partial<z.infer<T['schema']>> = {},
  excludeOverrides: (keyof typeof overrides)[] = [],
) {
  const createdEntity = await seed(schemaModel, overrides);
  expect(createdEntity, 'failed to create entity').not.to.be.null;

  const data = await schemaModel.schema.parse(createdEntity.toJSON());
  expect(data, 'created entity is missing id').to.have.property('id');

  const existingEntity = await schemaModel.model.findByPk(data.id);
  expect(existingEntity, 'failed to find created entity after creation').not.to
    .be.null;

  const overridesToCheck = Object.keys(overrides).reduce((acc, k) => {
    if (excludeOverrides.includes(k)) {
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
        ['emailVerified', 'isAdmin'],
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
    step('Seed Contract with defaults', async () => {
      await testSeed(ContractSchema);
    });

    // step('Seed Contract with overrides', async () => {
    //   await testSeed(ContractSchema, {
    //     chain_node_id: 1,
    //     token_name: 'blah',
    //   });
    // });
  });
});
