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
        result: [
          {
            from: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            to: '0xb0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            data: '0x1234',
            platformFee: null,
          },
        ],
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

      const result = await command(UpdateClaimAddress(), {
        actor: community.actors.member,
        payload: {
          event_id: 'test-event',
          address: address.address as `0x${string}`,
        },
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
        event_id: 'test-event',
        user_id,
        address,
        magna_synced_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        historic: 0,
        aura: 1,
        nft: 0,
      });

      expect(
        command(UpdateClaimAddress(), {
          actor: community.actors.admin,
          payload: { event_id: 'test-event', address },
        }),
      ).rejects.toThrowError();
    });

    it('should throw error when address belongs to different user', async () => {
      expect(
        command(UpdateClaimAddress(), {
          actor: community.actors.admin,
          payload: {
            event_id: 'test-event',
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
        WHERE event_id = :event_id AND user_id = :user_id;
      `,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            event_id: 'test-event',
            user_id: community.actors.member.user.id,
            allocation_id,
          },
        },
      );

      // claim token
      const result = await command(ClaimToken(), {
        actor: community.actors.member,
        payload: { allocation_id },
      });

      expect(result.from).to.be.a('string');
      expect(result.to).to.be.a('string');
      expect(result.data).to.be.a('string');
    });
  });
});
