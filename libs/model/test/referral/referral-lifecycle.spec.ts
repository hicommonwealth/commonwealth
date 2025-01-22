import { BigNumber } from '@ethersproject/bignumber';
import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { ChainBase, ChainType, ZERO_ADDRESS } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { CreateCommunity, UpdateCommunity } from '../../src/community';
import { models } from '../../src/database';
import { ChainEventPolicy } from '../../src/policies';
import { commonProtocol } from '../../src/services';
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
  let nonMemberUser: z.infer<typeof schemas.User> | undefined;
  let chain_node_id: number;

  beforeAll(async () => {
    const { actors, base, community } = await seedCommunity({
      roles: ['admin', 'member'],
    });
    admin = actors.admin;
    [nonMemberUser] = await seed('User', {
      profile: {
        name: 'non-member',
      },
      referred_by_address: admin.address, // referrer
      isAdmin: false,
      is_welcome_onboard_flow_complete: false,
    });
    const [nonMemberAddress] = await seed('Address', {
      community_id: base!.id!,
      user_id: nonMemberUser!.id!,
      address: '0x0000000000000000000000000000000000001234',
      verified: true, // must be verified to update community as admin
    });
    nonMember = {
      user: {
        id: nonMemberUser!.id!,
        email: nonMemberUser!.email!,
        isAdmin: false,
      },
      address: nonMemberAddress!.address!,
    };
    chain_node_id = community!.chain_node_id!;
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should create referral/fees when referred user creates a community', async () => {
    // non-member creates a community with a referral link from admin
    const result = await command(CreateCommunity(), {
      actor: nonMember,
      payload: {
        id: 'referred-community',
        name: 'Referred Community',
        description: 'Referred Community Description',
        default_symbol: 'RC',
        base: ChainBase.Ethereum,
        type: ChainType.Offchain,
        chain_node_id,
        directory_page_enabled: true,
        social_links: [],
        tags: [],
      },
    });
    expect(result).toBeTruthy();
    const community = result?.community;
    expect(community).toBeTruthy();
    const community_id = community!.id!;

    // creates "partial" platform entries for referrals
    await drainOutbox(['CommunityCreated'], UserReferrals);

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
        community_id: null,
        community_name: null,
        community_icon_url: null,
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

    // simulate namespace creation on-chain (From the UI)
    const namespaceAddress = '0x0000000000000000000000000000000000000001';
    const transactionHash = '0x2';
    const chainEvents1 = [
      chainEvent(
        transactionHash,
        '0x0000000000000000000000000000000000000002',
        EvmEventSignatures.NamespaceFactory.NamespaceDeployedWithReferral,
        [
          namespaceAddress,
          '0x0000000000000000000000000000000000000004', // fee manager address
          admin.address, // referrer
          '0x0000000000000000000000000000000000000003', // referral fee contract
          '0x0', // signature
          nonMember.address!, // referee
        ],
      ),
    ];
    await models.Outbox.bulkCreate(chainEvents1);

    // simulate UI updating the namespace address
    vi.spyOn(
      commonProtocol.newNamespaceValidator,
      'validateNamespace',
    ).mockResolvedValue(namespaceAddress);
    await command(UpdateCommunity(), {
      actor: nonMember,
      payload: {
        community_id,
        transactionHash,
        namespace: namespaceAddress,
      },
    });
    vi.restoreAllMocks();

    // syncs "partial" platform entries for referrals with on-chain transactions
    await drainOutbox(['ChainEventCreated'], ChainEventPolicy);

    expectedReferrals[0].eth_chain_id = 1;
    expectedReferrals[0].transaction_hash = '0x2';
    expectedReferrals[0].namespace_address = namespaceAddress;
    expectedReferrals[0].created_on_chain_timestamp =
      chainEvents1[0].event_payload.block.timestamp;
    expectedReferrals[0].community_id = community!.id;
    expectedReferrals[0].community_name = community!.name;
    expectedReferrals[0].community_icon_url = community!.icon_url;

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
        referee_address: nonMember.address!,
        referee_profile: {
          name: nonMemberUser?.profile.name,
          avatar_url: nonMemberUser?.profile.avatar_url,
        },
        community_id,
        community_name: community!.name,
        community_icon_url: community!.icon_url,
      },
    ];
    const referralFees = await query(GetUserReferralFees(), {
      actor: admin,
      payload: {},
    });
    expect(referralFees).toMatchObject(expectedReferralFees);
  });
});
