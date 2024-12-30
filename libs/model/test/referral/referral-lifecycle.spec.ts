import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { GetUserReferrals } from 'model/src/user/GetUserReferrals.query';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seed } from '../../src/tester';
import { UpdateUser, UserReferrals } from '../../src/user';
import { drainOutbox, seedCommunity } from '../utils';

describe('Referral lifecycle', () => {
  let admin: Actor;
  let member: Actor;
  let nonMember: Actor;

  beforeAll(async () => {
    const { actors, base } = await seedCommunity({
      roles: ['admin', 'member'],
    });
    admin = actors.admin;
    member = actors.member;
    const [nonMemberUser] = await seed('User', {
      profile: {
        name: 'non-member',
      },
      isAdmin: false,
      is_welcome_onboard_flow_complete: false,
    });
    const [nonMemberAddress] = await seed('Address', {
      community_id: base!.id!,
      user_id: nonMemberUser!.id!,
    });
    nonMember = {
      user: {
        id: nonMemberUser!.id!,
        email: nonMemberUser!.email!,
        isAdmin: false,
      },
      address: nonMemberAddress!.address!,
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should create a referral when signing up with a referral link', async () => {
    // member signs up with the referral link
    await command(UpdateUser(), {
      actor: member,
      payload: {
        id: member.user.id!,
        referrer_address: admin.address,
        profile: { name: 'member' }, // this flags is_welcome_onboard_flow_complete
      },
    });

    await command(UpdateUser(), {
      actor: nonMember,
      payload: {
        id: nonMember.user.id!,
        referrer_address: admin.address,
        profile: { name: 'non-member' }, // this flags is_welcome_onboard_flow_complete
      },
    });

    await drainOutbox(['SignUpFlowCompleted'], UserReferrals);

    // get referrals
    const referrals = await query(GetUserReferrals(), {
      actor: admin,
      payload: {},
    });

    expect(referrals?.length).toBe(2);

    let ref = referrals!.at(0)!;
    expect(ref).toMatchObject({
      eth_chain_id: null,
      transaction_hash: null,
      namespace_address: null,
      referee_address: member.address,
      referrer_address: admin.address,
      referrer_received_eth_amount: 0,
      created_on_chain_timestamp: null,
      created_off_chain_at: expect.any(Date),
      updated_at: expect.any(Date),
      referee_user_id: member.user.id,
      referee_profile: { name: 'member' },
    });
    ref = referrals!.at(1)!;
    expect(ref).toMatchObject({
      eth_chain_id: null,
      transaction_hash: null,
      namespace_address: null,
      referee_address: nonMember.address,
      referrer_address: admin.address,
      referrer_received_eth_amount: 0,
      created_on_chain_timestamp: null,
      created_off_chain_at: expect.any(Date),
      updated_at: expect.any(Date),
      referee_user_id: nonMember.user.id!,
      referee_profile: { name: 'non-member' },
    });
  });
});
