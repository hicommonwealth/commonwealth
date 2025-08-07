import { command, dispose } from '@hicommonwealth/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { UpdateClaimAddress } from '../../src/aggregates/token-allocation/UpdateClaimAddress.command';
import { models } from '../../src/database';
import { CommunitySeedResult, seedCommunity } from '../utils';

describe('Token Allocation Lifecycle', () => {
  let community: CommunitySeedResult;

  beforeAll(async () => {
    community = await seedCommunity({
      roles: ['admin', 'member'],
      network: 'ethereum',
    });
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('UpdateClaimAddress', () => {
    it('should update claim address when no magna sync exists', async () => {
      const address = community.addresses.member;

      const result = await command(UpdateClaimAddress(), {
        actor: community.actors.member,
        payload: { address: address.address as `0x${string}` },
      });

      // Verify the claim address was set
      expect(result.claim_address).to.equal(address.address);

      // Verify in database
      const found = await models.ClaimAddresses.findAll({
        where: { user_id: community.actors.member.user.id },
      });
      expect(found.length).to.equal(1);
      expect(found[0].address).to.equal(address.address);
    });

    it('should throw error when magna sync exists', async () => {
      const user_id = community.actors.admin.user.id!;
      const address = community.addresses.admin.address! as `0x${string}`;

      // set magna watermark
      await models.ClaimAddresses.create({
        user_id,
        address,
        magna_synced_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      expect(
        command(UpdateClaimAddress(), {
          actor: community.actors.admin,
          payload: { address },
        }),
      ).rejects.toThrowError();
    });

    it('should throw error when address belongs to different user', async () => {
      expect(
        command(UpdateClaimAddress(), {
          actor: community.actors.admin,
          payload: {
            address: community.addresses.member.address as `0x${string}`,
          },
        }),
      ).rejects.toThrowError();
    });
  });
});
