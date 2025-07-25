import { dispose, type DeepPartial } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  CommunityTierMap,
} from '@hicommonwealth/shared';
import { Model, ValidationError, type ModelStatic } from 'sequelize';
import { afterAll, describe, expect, test } from 'vitest';
import z from 'zod';
import { models } from '../../src/database';
import { SeedOptions, seed } from '../../src/tester';

// testSeed creates an entity using the `seed` function
// then attempts to find the entity and validate it
async function testSeed<T extends schemas.Aggregates>(
  name: T,
  values?: DeepPartial<z.infer<(typeof schemas)[T]>>,
  options: SeedOptions = { mock: true },
): Promise<z.infer<(typeof schemas)[T]>> {
  const [record, records] = await seed(name, values, options);
  expect(records.length, 'failed to create entity').to.be.gt(0);

  // perform schema validation on created entity (throws)
  const schema = schemas[name];
  const model: ModelStatic<Model> = models[name];
  const data: ReturnType<typeof schema.parse> = schema.parse(record);

  // attempt to find entity that was created
  const existingEntity = await model.findOne({
    where: {
      [model.primaryKeyAttribute]:
        data[model.primaryKeyAttribute as keyof typeof data],
    },
  });
  expect(existingEntity, 'failed to find created entity after creation').not.to
    .be.null;

  // perform schema validation on found entity (throws)
  return data;
}

describe('Seed functions', () => {
  let shouldExit = true;

  afterAll(async () => {
    await dispose()();
  });

  describe('User', () => {
    test('Should seed with defaults', async () => {
      await testSeed('User', { selected_community_id: null });
      await testSeed('User', { selected_community_id: null });
      shouldExit = false;
    });

    test('Should seed with overrides', async () => {
      expect(shouldExit).to.be.false;
      shouldExit = true;
      const values = {
        email: 'temp@gmail.com',
        emailVerified: true,
        isAdmin: true,
      };
      // NOTE: some props like emailVerified and isAdmin
      // are explicitly excluded via sequelize model config
      const result = await testSeed('User', values);
      expect(result).contains(values);
      shouldExit = false;
    });
  });

  describe('ChainNode', () => {
    test('Should seed with defaults', async () => {
      expect(shouldExit).to.be.false;
      shouldExit = true;
      await testSeed('ChainNode');
      await testSeed('ChainNode');
      shouldExit = false;
    });

    test('Should seed with overrides', async () => {
      expect(shouldExit).to.be.false;
      shouldExit = true;
      await testSeed('ChainNode', {
        url: 'mainnet1.edgewa.re',
        name: 'Edgeware Mainnet',
        balance_type: BalanceType.Substrate,
      });
      shouldExit = false;
    });
  });

  describe('Community', () => {
    test('Should seed with overrides', async () => {
      expect(shouldExit).to.be.false;
      shouldExit = true;
      const node = await testSeed('ChainNode');
      const user = await testSeed('User', { selected_community_id: null });
      await testSeed('Community', {
        id: 'ethereum',
        tier: CommunityTierMap.ChainVerified,
        network: ChainNetwork.Ethereum,
        default_symbol: 'ETH',
        name: 'Ethereum',
        icon_url: 'assets/img/protocols/eth.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.Ethereum,
        chain_node_id: node!.id,
        lifetime_thread_count: 1,
        profile_count: 1,
        Addresses: [
          {
            user_id: user.id,
            address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
            community_id: 'ethereum',
            verification_token: 'PLACEHOLDER',
            verification_token_expires: undefined,
            verified: new Date(),
            role: 'admin',
          },
        ],
      });

      await testSeed('Community', {
        id: 'superEth',
        tier: CommunityTierMap.ChainVerified,
        network: ChainNetwork.Ethereum,
        default_symbol: 'SETH',
        name: 'Super Eth',
        icon_url: 'assets/img/protocols/eth.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.Ethereum,
        chain_node_id: node!.id,
        lifetime_thread_count: 1,
        profile_count: 1,
        Addresses: [
          {
            user_id: user.id,
            address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
            community_id: 'ethereum',
            verification_token: 'PLACEHOLDER',
            verification_token_expires: undefined,
            verified: new Date(),
            role: 'admin',
          },
        ],
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
      shouldExit = false;
    });

    test('Should not mock data', async () => {
      expect(shouldExit).to.be.false;
      shouldExit = true;
      await expect(
        seed(
          'Community',
          {
            lifetime_thread_count: 0,
            profile_count: 1,
          },
          { mock: false },
        ),
      ).rejects.toThrow(ValidationError);
      shouldExit = false;
    });
  });
});
