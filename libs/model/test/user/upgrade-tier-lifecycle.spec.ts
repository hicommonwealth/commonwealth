import { config, dispose } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { emitEvent, tokenBalanceCache } from '@hicommonwealth/model';
import { User } from '@hicommonwealth/schemas';
import { UserTierMap } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import {
  UPGRADE_MIN_USDC_BALANCE,
  UpgradeTierPolicy,
} from '../../src/aggregates/user/UpgradeTier.policy';
import { models } from '../../src/database';
import { USDC_BASE_MAINNET_ADDRESS } from '../../src/services/openai/parseBotCommand';
import { seed } from '../../src/tester';
import { drainOutbox } from '../utils';

// const buildNamespaceTransferSingleEvent = (
//   contractAddress: string,
//   from: string,
//   to: string,
//   id: string,
//   value: string,
// ) => ({
//   event_name: 'NamespaceTransferSingle',
//   event_payload: {
//     eventSource: {
//       ethChainId: 1,
//     },
//     rawLog: {
//       address: contractAddress,
//       topics: ['0xabcdef', '0x123456'],
//       data: '0xdata',
//       blockNumber: '123456' as unknown as bigint,
//       blockHash: '0xblockhash',
//       transactionIndex: 0,
//       removed: false,
//       transactionHash: '0xtxhash',
//       logIndex: 0,
//     },
//     block: {
//       number: '123456' as unknown as bigint,
//       timestamp: '1678901234' as unknown as bigint,
//       hash: '0xblockhash',
//       logsBloom: '0xlogsbloom',
//       parentHash: '0xparenthash',
//       miner: '0xminer',
//       gasLimit: '10000000' as unknown as bigint,
//     },
//     parsedArgs: {
//       operator: '0x1234567890123456789012345678901234567890' as `0x${string}`,
//       from: from as `0x${string}`,
//       to: to as `0x${string}`,
//       id: id as unknown as bigint,
//       value: value as unknown as bigint,
//     },
//   },
// });

describe('Upgrade Tiers lifecycle', () => {
  const userAddress: string = '0x8888888888888888888888888888888888888888';
  const contestAddress: string = '0x1234567890123456789012345678901234567890';
  const contestId: number = 1;

  // let community: z.infer<typeof Community>;
  let user: z.infer<typeof User>;

  beforeAll(async () => {
    const [node1] = await seed('ChainNode', {
      id: 1,
      eth_chain_id: 1,
    });
    const [user1] = await seed('User', {
      tier: UserTierMap.IncompleteUser,
    });
    const [community1] = await seed('Community', {
      chain_node_id: node1!.id,
      profile_count: 1,
      namespace_address: '0xFFF1234567890123456789012345678901234567',
      Addresses: [
        {
          role: 'member',
          address: userAddress,
          user_id: user1!.id,
          verified: new Date(),
          last_active: new Date().toISOString(),
        },
      ],
      namespace_verified: false,
    });

    const [topic1] = await seed('Topic', {
      id: 1,
      community_id: community1!.id,
    });

    await models.ContestManager.create({
      name: 'hello',
      community_id: community1!.id,
      payout_structure: [],
      ticker: 'ABC',
      decimals: 0,
      contest_address: contestAddress,
      cancelled: false,
      ended: false,
      is_farcaster_contest: false,
      topic_id: topic1!.id,
      interval: 0,
      funding_token_address: USDC_BASE_MAINNET_ADDRESS,
      contests: [
        {
          contest_address: contestAddress,
          contest_id: contestId,
          start_time: new Date(),
          end_time: new Date(new Date().getTime() + 60 * 60 * 1000),
          score: [],
        },
      ],
      environment: config.APP_ENV,
      creator_address: userAddress,
      created_at: new Date(),
    });

    user = user1!;
    // community = community1!;

    vi.spyOn(tokenBalanceCache, 'getBalances').mockResolvedValue({
      [userAddress]: '5',
    });
  });

  afterAll(async () => {
    await dispose()();
    vi.restoreAllMocks();
  });

  // describe('Nomination Upgrade Policy', async () => {
  //   test('should upgrade user to ChainVerified tier when 5 or more nomination tokens are held', async () => {
  //     const userBefore = await models.User.findByPk(user.id);
  //     expect(userBefore?.tier).toBe(UserTierMap.IncompleteUser);
  //     const communityBefore = await models.Community.findByPk(community.id);
  //     expect(communityBefore?.namespace_verified).toBe(false);

  //     await emitEvent(models.Outbox, [
  //       buildNamespaceTransferSingleEvent(
  //         community.namespace_address!,
  //         ZERO_ADDRESS,
  //         userAddress,
  //         NAMESPACE_COMMUNITY_NOMINATION_TOKEN_ID.toString(),
  //         NAMESPACE_MIN_NOMINATION_BALANCE.toString(),
  //       ) as EventPair<'NamespaceTransferSingle'>,
  //     ]);

  //     await drainOutbox(['NamespaceTransferSingle'], UpgradeTierPolicy);

  //     const userAfter = await models.User.findByPk(user.id);
  //     expect(userAfter?.tier).toBe(UserTierMap.ChainVerified);
  //     const communityAfter = await models.Community.findByPk(community.id);
  //     expect(communityAfter?.namespace_verified).toBe(true);
  //   });
  // });

  describe('Contest Upgrade Policy', async () => {
    test('should upgrade user to ChainVerified tier when contest is funded and there is contest activity', async () => {
      await models.User.update(
        { tier: UserTierMap.IncompleteUser },
        { where: { id: user.id } },
      );

      const userBefore = await models.User.findByPk(user.id);
      expect(userBefore?.tier).toBe(UserTierMap.IncompleteUser);

      vi.spyOn(commonProtocol, 'getContestScore').mockResolvedValue({
        contestBalance: (UPGRADE_MIN_USDC_BALANCE - 1n).toString(),
        scores: [],
      });

      await emitEvent(models.Outbox, [
        {
          event_name: 'ContestContentAdded',
          event_payload: {
            contest_address: contestAddress,
            creator_address: userAddress,
            content_id: 1,
            content_url: 'thread-id-1',
          },
        },
      ]);

      await drainOutbox(['ContestContentAdded'], UpgradeTierPolicy);

      const userAfter = await models.User.findByPk(user.id);
      expect(
        userAfter!.tier,
        'user tier should not change since contest balance is insufficient',
      ).toBe(UserTierMap.IncompleteUser);

      vi.spyOn(commonProtocol, 'getContestScore').mockResolvedValue({
        contestBalance: UPGRADE_MIN_USDC_BALANCE.toString(),
        scores: [],
      });

      await emitEvent(models.Outbox, [
        {
          event_name: 'ContestContentUpvoted',
          event_payload: {
            contest_address: contestAddress,
            content_id: 1,
            voting_power: '1',
            voter_address: userAddress,
          },
        },
      ]);

      await drainOutbox(['ContestContentUpvoted'], UpgradeTierPolicy);

      const userAfter2 = await models.User.findByPk(user.id);
      expect(
        userAfter2!.tier,
        'balance is sufficient, user should be upgraded to ChainVerified tier',
      ).toBe(UserTierMap.ChainVerified);
    });
  });
});
