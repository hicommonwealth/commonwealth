import { command, dispose } from '@hicommonwealth/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UpdateClaimAddress } from '../../src/aggregates/token-allocation/UpdateClaimAddress.command';
import { models } from '../../src/database';
import { CommunitySeedResult, seedCommunity } from '../utils';

describe('Token Allocation Lifecycle', () => {
  let communitySeed: CommunitySeedResult;

  beforeAll(async () => {
    communitySeed = await seedCommunity({
      roles: ['admin', 'member'],
    });
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('UpdateClaimAddress', () => {
    it('should update claim address when no magna sync exists', async () => {
      const address = communitySeed.addresses.member;
      const result = await command(UpdateClaimAddress(), {
        actor: communitySeed.actors.member,
        payload: { address_id: address.id! },
      });

      // Verify the claim address was set
      expect(result.claim_address).to.equal(address.address);

      // Verify in database
      const found = await models.ClaimAddresses.findAll({
        where: { user_id: communitySeed.actors.member.user.id },
      });
      expect(found.length).to.equal(1);
      expect(found[0].address).to.equal(address.address);
    });

    it('should throw error when magna sync exists', async () => {
      const user_id = communitySeed.actors.admin.user.id;

      // Create historical allocation with magna sync
      await models.HistoricalAllocations.create({
        user_id,
        address: communitySeed.addresses.member.address,
        created_at: new Date(),
        updated_at: new Date(),
        magna_synced_at: new Date(),
        token_allocation: 100,
        percent_allocation: 100,
        num_threads: 100,
        thread_score: 100,
        num_comments: 100,
        comment_score: 100,
        num_reactions: 100,
        reactions_score: 100,
        unadjusted_score: 100,
        adjusted_score: 100,
        percent_score: 100,
      });

      expect(
        command(UpdateClaimAddress(), {
          actor: communitySeed.actors.admin,
          payload: { address_id: communitySeed.addresses.admin.id! },
        }),
      ).rejects.toThrowError();
    });

    it('should throw error when address belongs to different user', async () => {
      expect(
        command(UpdateClaimAddress(), {
          actor: communitySeed.actors.admin,
          payload: { address_id: communitySeed.addresses.member.id! },
        }),
      ).rejects.toThrowError();
    });
  });
});
