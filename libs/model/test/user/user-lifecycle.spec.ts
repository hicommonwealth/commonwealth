import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GetReferralLink } from '../../src/user';
import { CreateReferralLink } from '../../src/user/CreateReferralLink.command';
import { seedCommunity } from '../utils/community-seeder';

describe('User lifecycle', () => {
  let member: Actor;

  beforeAll(async () => {
    const { actors } = await seedCommunity({
      roles: ['member'],
    });
    member = actors.member;
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('referrals', () => {
    it('should create referral link when user is created', async () => {
      const response = await command(CreateReferralLink(), {
        actor: member,
        payload: {},
      });
      expect(response!.referral_link).toBeDefined();

      // make sure it's saved
      const response2 = await query(GetReferralLink(), {
        actor: member,
        payload: {},
      });
      expect(response2!.referral_link).to.eq(response?.referral_link);
    });

    it('should fail to create referral link when one already exists', async () => {
      expect(
        command(CreateReferralLink(), {
          actor: member,
          payload: {},
        }),
      ).rejects.toThrowError('Referral link already exists');
    });
  });

  describe('xp', () => {
    it('should project xp points', async () => {
      // TODO: setup quest
      // TODO: act on quest
      // TODO: check if xp points were projected
    });
  });
});
