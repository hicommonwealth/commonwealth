import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { UserTierMap } from '@hicommonwealth/shared';
import { Chance } from 'chance';
import { Op } from 'sequelize';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { magnaSync } from '../../src/integrations/token-allocation/magna.sync';
import { CommunitySeedResult, seedCommunity } from '../utils';

const chance = new Chance();

describe('MagnaSync Lifecycle', () => {
  let community: CommunitySeedResult;

  beforeAll(async () => {
    community = await seedCommunity({
      roles: ['admin'],
    });
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should process batch of allocations and update database', async () => {
    // add users to community
    const users = await models.User.bulkCreate(
      Array.from({ length: 100 }).map(() => ({
        tier: UserTierMap.VerifiedWallet,
        profile: {
          name: chance.name(),
          email: chance.email(),
          bio: chance.sentence(),
        },
      })),
    );
    // add claimable addresses to 80% of users
    await Promise.all(
      users.slice(0, Math.floor(users.length * 0.8)).map((user) =>
        models.ClaimAddresses.create({
          user_id: user.id!,
          address: `0x${chance.hash({ length: 40 })}`,
          created_at: new Date(),
          updated_at: new Date(),
        }),
      ),
    );
    // add historical allocations to all users
    await Promise.all(
      users.map((user) =>
        models.HistoricalAllocations.create({
          user_id: user.id!,
          num_threads: 0,
          thread_score: 0,
          num_comments: 0,
          comment_score: 0,
          num_reactions: 0,
          reactions_score: 0,
          unadjusted_score: 0,
          adjusted_score: 0,
          percent_score: 0,
          token_allocation: chance.integer({ min: 0, max: 100 }),
        }),
      ),
    );
    // add aura allocations to some users
    await Promise.all(
      users.slice(0, Math.floor(users.length * 0.8)).map((user) =>
        models.AuraAllocations.create({
          user_id: user.id!,
          total_xp: chance.integer({ min: 0, max: 100 }),
          percent_allocation: chance.integer({ min: 0, max: 100 }),
          token_allocation: chance.integer({ min: 0, max: 100 }),
        }),
      ),
    );

    // Execute sync
    await magnaSync(
      (args) => {
        // mock call to magna api that creates allocations
        return Promise.resolve({ id: `magna-id-${args.user_id}` });
      },
      10,
      0, // Set breather to 0 to speed up test
    );

    // Verify database updates
    const updates = await models.ClaimAddresses.findAll({
      where: { magna_synced_at: { [Op.ne]: null } },
    });
    updates.forEach((update) => {
      expect(update.magna_allocation_id).toBe(`magna-id-${update.user_id}`);
    });
  });
});
