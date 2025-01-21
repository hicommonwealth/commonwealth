import { BigNumber } from '@ethersproject/bignumber';
import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { JoinCommunity } from '../../src/community';
import { models } from '../../src/database';
import { ChainEventPolicy } from '../../src/policies';
import { seed } from '../../src/tester';
import { GetUserReferralFees, UserReferrals } from '../../src/user';
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
  let nonMember: Actor;
  let community_id: string;

  beforeAll(async () => {
    const { actors, base, community } = await seedCommunity({
      roles: ['admin', 'member'],
    });
    admin = actors.admin;
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

  it('should create a referral when signing in with a referral link', async () => {
    // non-member joins with referral link
    await command(JoinCommunity(), {
      actor: nonMember,
      payload: {
        community_id,
        referrer_address: admin.address,
      },
    });

    // creates "partial" platform entries for referrals
    await drainOutbox(['CommunityJoined'], UserReferrals);

    const expectedReferrals: z.infer<typeof schemas.ReferralView>[] = [
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

    const referrerUser = await models.User.findOne({
      where: { id: admin.user.id },
    });
    expect(referrerUser?.referral_count).toBe(1);

    const refereeAddress = await models.Address.findOne({
      where: { user_id: nonMember.user.id, community_id },
    });
    expect(refereeAddress?.referred_by_address).toBe(admin.address);

    // simulate on-chain transactions that occur when referees
    // deploy a new namespace with a referral link (ReferralSet)
    const namespaceAddress = '0x0000000000000000000000000000000000000001';
    const chainEvents1 = [
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
    expectedReferrals[0].transaction_hash = '0x2';
    expectedReferrals[0].namespace_address = namespaceAddress;
    expectedReferrals[0].created_on_chain_timestamp =
      chainEvents1[0].event_payload.block.timestamp;

    // get referrals again with tx attributes
    const referrals2 = await query(GetUserReferrals(), {
      actor: admin,
      payload: {},
    });
    expect(referrals2).toMatchObject(expectedReferrals);

    // simulate on-chain transactions that occur when
    // referral fees are distributed to the referrer
    const checkpoint = new Date();
    const fee = 1;
    const ethMul = BigNumber.from(10).pow(18);
    const hex = BigNumber.from(fee).mul(ethMul).toHexString();
    await models.Outbox.bulkCreate([
      chainEvent(
        '0x4',
        nonMember.address!,
        EvmEventSignatures.Referrals.FeeDistributed,
        [
          namespaceAddress,
          ZERO_ADDRESS,
          { hex, type: 'BigNumber' }, // total amount distributed
          admin.address, // referrer address
          { hex, type: 'BigNumber' }, // referrer received amount
        ],
      ),
    ]);

    // syncs referral fees
    await drainOutbox(['ChainEventCreated'], ChainEventPolicy, checkpoint);

    expectedReferrals[0].referrer_received_eth_amount = fee;

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
        transaction_hash: '0x4',
        namespace_address: namespaceAddress,
        distributed_token_address: ZERO_ADDRESS,
        referrer_recipient_address: admin.address,
        referrer_received_amount: fee,
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
