import { dispose } from '@hicommonwealth/core';
import { UserTierMap } from '@hicommonwealth/shared';
import { Chance } from 'chance';
import { Op } from 'sequelize';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { models } from '../../src/database';
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
    // add claim event
    await models.ClaimEvents.create({
      id: 'test-event',
      description: 'Test Event',
      contract_id: '0x1234567890123456789012345678901234567890',
      contract_address: '0x1234567890123456789012345678901234567890',
      token: 'TEST',
      token_id: 'abc123',
      token_address: '0x1234567890123456789012345678901234567890',
      unlock_schedule_id: 'abc123',
      unlock_start_at: new Date(),
      initial_percentage: 0.33,
      cliff_date: new Date(),
      end_registration_date: new Date(),
    });
    // add claimable addresses to 80% of users
    await Promise.all(
      users.slice(0, Math.floor(users.length * 0.8)).map((user) =>
        models.ClaimAddresses.create({
          event_id: 'test-event',
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
          percent_allocation: 0,
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
      (args) => Promise.resolve(args.key),
      10,
      0, // Set breather to 0 to speed up test
    );

    // Verify database updates
    const updates = await models.ClaimAddresses.findAll({
      where: { magna_synced_at: { [Op.ne]: null } },
    });
    updates.forEach((update) => {
      expect(update.magna_allocation_id).toBe(`test-event-${update.user_id}`);
    });
  });
});
