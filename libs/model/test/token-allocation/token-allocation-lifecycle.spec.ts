import { command, dispose } from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  ClaimToken,
  UpdateClaimAddress,
} from '../../src/aggregates/token-allocation';
import { models } from '../../src/database';
import { CommunitySeedResult, seedCommunity } from '../utils';

describe('Token Allocation Lifecycle', () => {
  let community: CommunitySeedResult;

  beforeAll(async () => {
    community = await seedCommunity({
      roles: ['admin', 'member'],
      network: 'ethereum',
    });
    // mock magna api
    vi.mock('../../src/services/magna/api', () => ({
      createAllocation: vi.fn().mockResolvedValue({
        isProcessed: true,
        result: {
          key: 'initial-airdrop-0x1234',
        },
      }),
      claimAllocation: vi.fn().mockResolvedValue({
        isProcessed: true,
        result: {
          parameters: {
            instructions: ['claim'],
            transactionId: '0x1234',
          },
        },
      }),
    }));
  });

  afterAll(async () => {
    vi.clearAllMocks();
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

    it('should claim token', async () => {
      const allocation_id = 'initial-airdrop-0x1234';

      // mock allocation
      await models.sequelize.query(
        `
        UPDATE "ClaimAddresses" 
        SET magna_allocation_id = :allocation_id 
        WHERE user_id = :user_id;
      `,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            user_id: community.actors.member.user.id,
            allocation_id,
          },
        },
      );

      // claim token
      const result = await command(ClaimToken(), {
        actor: community.actors.member,
        payload: {
          address: community.addresses.member.address as `0x${string}`,
          allocation_id,
        },
      });

      expect(result.transaction_id).to.be.a('string');
      expect(result.instructions).to.be.an('array');
    });
  });
});
