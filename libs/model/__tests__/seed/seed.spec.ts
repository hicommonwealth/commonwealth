import { dispose } from '@hicommonwealth/core';
import { expect } from 'chai';
import z from 'zod';
import {
  ChainNodeSchema,
  ContractSchema,
  SchemaWithModel,
  UserSchema,
  seed,
  seedDb,
} from '../../src/test';

async function testSeed<T extends SchemaWithModel<any>>(
  schemaModel: T,
  overrides: Partial<z.infer<T['schema']>> = {},
): Promise<z.infer<T['schema']>> {
  const createdEntity = await seed(schemaModel, overrides);
  const data = await schemaModel.schema.parse(createdEntity.toJSON());
  expect(data).to.have.property('id');
  expect(data.id).to.not.be.null;
  const existingEntity = await schemaModel.model.findByPk(data.id);
  expect(existingEntity, 'failed to find created entity').not.to.be.null;
  return schemaModel.schema.parse(existingEntity?.toJSON());
}

describe('Seed functions', () => {
  before(async () => {
    await seedDb();
  });

  after(async () => {
    await dispose()();
  });

  it('Seed User with defaults', async () => {
    await testSeed(UserSchema);
  });

  it('Seed User with overrides', async () => {
    const entity = await testSeed(UserSchema, {
      email: 'blah999@gmail.com',
    });
    expect(entity.email).to.eq('blah999@gmail.com');
  });

  it('Seed ChainNode with defaults', async () => {
    await testSeed(ChainNodeSchema);
  });

  it('Seed ChainNode with overrides', async () => {
    const entity = await testSeed(ChainNodeSchema, {
      name: 'blah',
    });
    expect(entity.name).to.eq('blah');
  });

  it('Seed Contract with defaults', async () => {
    await testSeed(ContractSchema);
  });

  it('Seed Contract with overrides', async () => {
    const entity = await testSeed(ContractSchema, {
      token_name: 'blah',
    });
    expect(entity.token_name).to.eq('blah');
  });
});
