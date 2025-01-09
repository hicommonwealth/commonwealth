import { BigNumber } from '@ethersproject/bignumber';
import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { JoinCommunity } from 'model/src/community';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { models } from '../../src/database';
import { ChainEventPolicy } from '../../src/policies';
import { seed } from '../../src/tester';
import { GetUserReferralFees, UpdateUser, UserReferrals } from '../../src/user';
import { GetUserReferrals } from '../../src/user/GetUserReferrals.query';
import { drainOutbox, seedCommunity } from '../utils';

function chainEvent(
  transactionHash: string,
  address: string,
  eventSignature: string,
  parsedArgs: unknown[],
) {
  return {
    event_name: 'ChainEventCreated',
    event_payload: {
      eventSource: {
        ethChainId: 1,
        eventSignature,
      },
      parsedArgs,
      rawLog: {
        blockNumber: 1,
        blockHash: '0x1',
        transactionIndex: 1,
        removed: false,
        address,
        data: '0x',
        topics: [],
        transactionHash,
        logIndex: 1,
      },
      block: {
        number: 1,
        hash: '0x1',
        logsBloom: '0x1',
        nonce: '0x1',
        parentHash: '0x1',
        timestamp: new Date().getTime(),
        miner: '0x1',
        gasLimit: 1,
        gasUsed: 1,
      },
    },
    created_at: new Date(),
    updated_at: new Date(),
  };
}

describe('Referral lifecycle', () => {
  let admin: Actor;
  let member: Actor;
  let nonMember: Actor;
  let community_id: string;

  beforeAll(async () => {
    const { actors, base, community } = await seedCommunity({
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
    community_id = community!.id!;
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

    // creates "partial" platform entries for referrals
    await drainOutbox(['SignUpFlowCompleted'], UserReferrals);

    const expectedReferrals: z.infer<typeof schemas.ReferralView>[] = [
      {
        eth_chain_id: null,
        transaction_hash: null,
        namespace_address: null,
        referee_address: member.address!,
        referrer_address: admin.address!,
        referrer_received_eth_amount: 0,
        created_on_chain_timestamp: null,
        created_off_chain_at: expect.any(Date),
        updated_at: expect.any(Date),
        referee_user_id: member.user.id!,
        referee_profile: { name: 'member' },
      },
      {
        eth_chain_id: null,
        transaction_hash: null,
        namespace_address: null,
        referee_address: nonMember.address!,
        referrer_address: admin.address!,
        referrer_received_eth_amount: 0,
        created_on_chain_timestamp: null,
        created_off_chain_at: expect.any(Date),
        updated_at: expect.any(Date),
        referee_user_id: nonMember.user.id!,
        referee_profile: { name: 'non-member' },
      },
    ];

    // get "partial" platform entries for referrals
    const referrals = await query(GetUserReferrals(), {
      actor: admin,
      payload: {},
    });
    expect(referrals).toMatchObject(expectedReferrals);

    // member user joins the community using referrals
    await command(JoinCommunity(), {
      actor: member,
      payload: {
        community_id,
        referrer_address: admin.address,
      },
    });

    // counts the referral for the referrer
    await drainOutbox(['CommunityJoined'], UserReferrals);

    const referrerUser = await models.User.findOne({
      where: { id: admin.user.id },
    });
    expect(referrerUser?.referral_count).toBe(1);

    const refereeAddress = await models.Address.findOne({
      where: { user_id: member.user.id, community_id },
    });
    expect(refereeAddress?.referred_by_address).toBe(admin.address);

    // simulate on-chain transactions that occur when referees
    // deploy a new namespace with a referral link (ReferralSet)
    const namespaceAddress = '0x0000000000000000000000000000000000000001';
    const chainEvents1 = [
      chainEvent(
        '0x1',
        member.address!, // referee
        EvmEventSignatures.Referrals.ReferralSet,
        [
          namespaceAddress,
          admin.address, // referrer
        ],
      ),
      chainEvent(
        '0x2',
        nonMember.address!, // referee
        EvmEventSignatures.Referrals.ReferralSet,
        [
          namespaceAddress,
          admin.address, // referrer
        ],
      ),
    ];
    await models.Outbox.bulkCreate(chainEvents1);

    // syncs "partial" platform entries for referrals with on-chain transactions
    await drainOutbox(['ChainEventCreated'], ChainEventPolicy);

    expectedReferrals[0].eth_chain_id = 1;
    expectedReferrals[0].transaction_hash = '0x1';
    expectedReferrals[0].namespace_address = namespaceAddress;
    expectedReferrals[0].created_on_chain_timestamp =
      chainEvents1[0].event_payload.block.timestamp;
    expectedReferrals[1].eth_chain_id = 1;
    expectedReferrals[1].transaction_hash = '0x2';
    expectedReferrals[1].namespace_address = namespaceAddress;
    expectedReferrals[1].created_on_chain_timestamp =
      chainEvents1[1].event_payload.block.timestamp;

    // get referrals again with tx attributes
    const referrals2 = await query(GetUserReferrals(), {
      actor: admin,
      payload: {},
    });
    expect(referrals2).toMatchObject(expectedReferrals);

    // simulate on-chain transactions that occur when
    // referral fees are distributed to the referrer
    const checkpoint = new Date();
    const fee1 = 1;
    const fee2 = 2;
    const ethMul = BigNumber.from(10).pow(18);
    const hex1 = BigNumber.from(fee1).mul(ethMul).toHexString();
    const hex2 = BigNumber.from(fee2).mul(ethMul).toHexString();
    await models.Outbox.bulkCreate([
      chainEvent(
        '0x3',
        member.address!,
        EvmEventSignatures.Referrals.FeeDistributed,
        [
          namespaceAddress,
          ZERO_ADDRESS,
          { hex: hex1, type: 'BigNumber' }, // total amount distributed
          admin.address, // referrer address
          { hex: hex1, type: 'BigNumber' }, // referrer received amount
        ],
      ),
      chainEvent(
        '0x4',
        nonMember.address!,
        EvmEventSignatures.Referrals.FeeDistributed,
        [
          namespaceAddress,
          ZERO_ADDRESS,
          { hex: hex2, type: 'BigNumber' }, // total amount distributed
          admin.address, // referrer address
          { hex: hex2, type: 'BigNumber' }, // referrer received amount
        ],
      ),
    ]);

    // syncs referral fees
    await drainOutbox(['ChainEventCreated'], ChainEventPolicy, checkpoint);

    expectedReferrals[0].referrer_received_eth_amount = fee1;
    expectedReferrals[1].referrer_received_eth_amount = fee2;

    // get referrals again with fees
    const referrals3 = await query(GetUserReferrals(), {
      actor: admin,
      payload: {},
    });
    expect(referrals3).toMatchObject(expectedReferrals);

    // get referral fees
    const expectedReferralFees = [
      {
        eth_chain_id: 1,
        transaction_hash: '0x3',
        namespace_address: namespaceAddress,
        distributed_token_address: ZERO_ADDRESS,
        referrer_recipient_address: admin.address,
        referrer_received_amount: fee1,
        transaction_timestamp: expect.any(Number),
      },
      {
        eth_chain_id: 1,
        transaction_hash: '0x4',
        namespace_address: namespaceAddress,
        distributed_token_address: ZERO_ADDRESS,
        referrer_recipient_address: admin.address,
        referrer_received_amount: fee2,
        transaction_timestamp: expect.any(Number),
      },
    ];
    const referralFees = await query(GetUserReferralFees(), {
      actor: admin,
      payload: {},
    });
    expect(referralFees).toMatchObject(expectedReferralFees);
  });
});
