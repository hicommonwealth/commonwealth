import { Actor, command, dispose } from '@hicommonwealth/core';
import { ChainNode } from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { CreateCommunity } from '../../src/community';
import { models } from '../../src/database';
import { CreateReferralLink, UserReferrals } from '../../src/user';
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

  it('should create a referral', async () => {
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

    await drainOutbox(['CommunityCreated'], UserReferrals());

    // get referrals
    const referrals = await models.Referral.findAll({
      where: { referee_id: member.user.id },
      order: [['created_at', 'DESC']],
    });
    expect(referrals.length).toBe(1);
  });
});
