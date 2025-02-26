import { Actor, command, dispose, query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { EventPair, EventSchemas } from '@hicommonwealth/schemas';
import { ChainBase, ChainType, ZERO_ADDRESS } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { CreateCommunity, UpdateCommunity } from '../../src/community';
import { models } from '../../src/database';
import { ChainEventPolicy } from '../../src/policies';
import { commonProtocol } from '../../src/services';
import { seed } from '../../src/tester';
import { GetUserReferralFees, GetUserReferrals } from '../../src/user';
import { drainOutbox, seedCommunity } from '../utils';

function chainEvent<
  E extends 'ReferralFeeDistributed' | 'NamespaceDeployedWithReferral',
  A extends z.infer<EventSchemas[E]>['parsedArgs'],
>(
  eventName: E,
  transactionHash: string,
  address: string,
  parsedArgs: A,
): EventPair<E> {
  return {
    event_name: eventName,
    event_payload: {
      eventSource: {
        ethChainId: 1,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parsedArgs: parsedArgs as any,
      rawLog: {
        blockNumber: 1n,
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
        number: 1n,
        hash: '0x1',
        logsBloom: '0x1',
        nonce: '0x1',
        parentHash: '0x1',
        timestamp: BigInt(new Date().getTime()),
        miner: '0x1',
        gasLimit: 1n,
      },
    },
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

  // TODO: @Roger discussed changing so that referral is created on namespace deployed
  it.skip('should create referral/fees when referred user creates a community', async () => {
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

    // simulate namespace creation on-chain (From the UI)
    const namespaceAddress = '0x0000000000000000000000000000000000000001';
    const transactionHash = '0x2';
    const chainEvents1 = [
      chainEvent(
        'NamespaceDeployedWithReferral',
        transactionHash,
        '0x0000000000000000000000000000000000000002',
        {
          name: 'temp name',
          feeManager: '0x0000000000000000000000000000000000000004',
          referrer: admin.address as `0x${string}`,
          referralFeeManager: '0x0000000000000000000000000000000000000003',
          signature: '0x0',
          namespaceDeployer: nonMember.address! as `0x${string}`,
          nameSpaceAddress: namespaceAddress,
        },
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

    // project referrals with on-chain transactions
    await drainOutbox(['NamespaceDeployedWithReferral'], ChainEventPolicy);

    const expectedReferrals: z.infer<typeof schemas.ReferralView>[] = [
      {
        namespace_address: namespaceAddress,
        referrer_address: admin.address!,
        referee_address: nonMember.address!,
        eth_chain_id: 1,
        transaction_hash: '0x2',
        referrer_received_eth_amount: '0',
        created_on_chain_timestamp:
          chainEvents1[0].event_payload.block.timestamp.toString(),
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        referee_user_id: nonMember.user.id!,
        referee_profile: { name: 'non-member' },
        community_id: community!.id,
        community_name: community!.name,
        community_icon_url: community!.icon_url,
      },
    ];

    // get referrals again with tx attributes
    const referrals2 = await query(GetUserReferrals(), {
      actor: admin,
      payload: {},
    });
    expect(referrals2).toMatchObject(expectedReferrals);

    // simulate on-chain transactions that occur when
    // referral fees are distributed to the referrer
    const checkpoint = new Date();
    const fee = 123456n;
    await models.Outbox.bulkCreate([
      chainEvent('ReferralFeeDistributed', '0x4', nonMember.address!, {
        namespace: namespaceAddress,
        token: ZERO_ADDRESS,
        amount: fee.toString(),
        recipient: admin.address,
        recipientAmount: fee.toString(),
      } as unknown as z.infer<
        EventSchemas['ReferralFeeDistributed']
      >['parsedArgs']),
    ]);

    // syncs referral fees
    await drainOutbox(['ReferralFeeDistributed'], ChainEventPolicy, checkpoint);

    expectedReferrals[0].referrer_received_eth_amount = fee.toString();

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
        referrer_received_amount: fee.toString(),
        transaction_timestamp: expect.any(String),
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
