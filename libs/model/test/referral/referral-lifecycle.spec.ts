import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { ChainNode } from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { GetUserReferrals } from 'model/src/user/GetUserReferrals.query';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { CreateCommunity } from '../../src/community';
import {
  CreateReferralLink,
  GetReferralLink,
  UpdateUser,
  UserReferrals,
} from '../../src/user';
import { drainOutbox, seedCommunity } from '../utils';

describe('Referral lifecycle', () => {
  let admin: Actor;
  let member: Actor;
  let node: z.infer<typeof ChainNode>;

  beforeAll(async () => {
    const { node: _node, actors } = await seedCommunity({
      roles: ['admin', 'member'],
    });
    admin = actors.admin;
    member = actors.member;
    node = _node!;
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should create a referral when creating a community with a referral link', async () => {
    // admin creates a referral link
    const response = await command(CreateReferralLink(), {
      actor: admin,
      payload: {},
    });

    // member creates a community using the referral link
    const id = 'test-community-with-referral-link';
    await command(CreateCommunity(), {
      actor: member,
      payload: {
        chain_node_id: node.id!,
        id,
        name: id,
        type: ChainType.Offchain,
        base: ChainBase.Ethereum,
        default_symbol: 'TEST',
        social_links: [],
        directory_page_enabled: false,
        tags: [],
        referral_link: response?.referral_link,
      },
    });

    await drainOutbox(['CommunityCreated'], UserReferrals);

    // get referrals
    const referrals = await query(GetUserReferrals(), {
      actor: admin,
      payload: {},
    });

    expect(referrals?.length).toBe(1);

    const ref = referrals!.at(0)!;
    expect(ref).toMatchObject({
      referrer: {
        id: admin.user.id,
        profile: {
          name: 'admin',
          avatar_url: ref.referrer.profile.avatar_url,
        },
      },
      referee: {
        id: member.user.id,
        profile: {
          name: 'member',
          avatar_url: ref.referee.profile.avatar_url,
        },
      },
      event_name: 'CommunityCreated',
      event_payload: {
        userId: member.user.id?.toString(),
        communityId: id,
      },
    });
  });

  it('should create a referral when signing up with a referral link', async () => {
    const response = await query(GetReferralLink(), {
      actor: admin,
      payload: {},
    });

    // member signs up with the referral link
    await command(UpdateUser(), {
      actor: member,
      payload: {
        id: member.user.id!,
        referral_link: response?.referral_link,
        profile: { name: 'member' }, // this flags is_welcome_onboard_flow_complete
      },
    });

    await drainOutbox(['SignUpFlowCompleted'], UserReferrals);

    // get referrals
    const referrals = await query(GetUserReferrals(), {
      actor: admin,
      payload: {},
    });

    expect(referrals?.length).toBe(2);

    const ref = referrals!.at(1)!;
    expect(ref).toMatchObject({
      referrer: {
        id: admin.user.id,
        profile: {
          name: 'admin',
          avatar_url: ref.referrer.profile.avatar_url,
        },
      },
      referee: {
        id: member.user.id,
        profile: {
          name: 'member',
          avatar_url: ref.referee.profile.avatar_url,
        },
      },
      event_name: 'SignUpFlowCompleted',
      event_payload: {
        user_id: member.user.id,
        referral_link: response?.referral_link,
      },
    });
  });
});
