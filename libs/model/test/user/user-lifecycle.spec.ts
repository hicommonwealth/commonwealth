import { Actor, command, dispose } from '@hicommonwealth/core';
import { CreateReferralLink } from 'model/src/user/CreateReferralLink.command';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

  it('should create referral link when user is created', async () => {
    const response = await command(CreateReferralLink(), {
      actor: member,
      payload: {},
    });
    expect(response!.referral_link).toBeDefined();
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
