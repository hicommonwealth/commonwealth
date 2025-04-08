import { config, dispose } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { emitEvent, tokenBalanceCache } from '@hicommonwealth/model';
import {
  ChainNode,
  Community,
  ContestManager,
  EventPair,
  Topic,
  User,
} from '@hicommonwealth/schemas';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import {
  UPGRADE_MIN_USDC_BALANCE,
  UpgradeTierPolicy,
} from 'model/src/aggregates/user/UpgradeTier.policy';
import { models } from 'model/src/database';
import { USDC_BASE_MAINNET_ADDRESS } from 'model/src/services/openai/parseBotCommand';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { seed } from '../../src/tester';
import { drainOutbox } from '../utils';

const buildNamespaceTransferSingleEvent = (
  contractAddress: string,
  from: string,
  to: string,
  id: string,
  value: string,
) => ({
  event_name: 'NamespaceTransferSingle',
  event_payload: {
    eventSource: {
      ethChainId: 1,
    },
    rawLog: {
      address: contractAddress,
      topics: ['0xabcdef', '0x123456'],
      data: '0xdata',
      blockNumber: '123456' as unknown as bigint,
      blockHash: '0xblockhash',
      transactionIndex: 0,
      removed: false,
      transactionHash: '0xtxhash',
      logIndex: 0,
    },
    block: {
      number: '123456' as unknown as bigint,
      timestamp: '1678901234' as unknown as bigint,
      hash: '0xblockhash',
      logsBloom: '0xlogsbloom',
      parentHash: '0xparenthash',
      miner: '0xminer',
      gasLimit: '10000000' as unknown as bigint,
    },
    parsedArgs: {
      operator: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      from: from as `0x${string}`,
      to: to as `0x${string}`,
      id: id as unknown as bigint,
      value: value as unknown as bigint,
    },
  },
});

describe('Upgrade Tiers lifecycle', () => {
  const userAddress: string = '0x8888888888888888888888888888888888888888';
  const contestAddress: string = '0x1234567890123456789012345678901234567890';
  const contestFundingTokenAddress: string = '0x1337';
  const contestId: number = 1;

  let node: z.infer<typeof ChainNode>;
  let community: z.infer<typeof Community>;
  let user: z.infer<typeof User>;
  let topic: z.infer<typeof Topic>;
  let contestManager: z.infer<typeof ContestManager>;

  beforeAll(async () => {
    const [node1] = await seed('ChainNode', {
      id: 1,
      eth_chain_id: 1,
    });
    const [user1] = await seed('User', {
      tier: 0,
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
    });

    const [topic1] = await seed('Topic', {
      id: 1,
      community_id: community1!.id,
    });

    contestManager = await models.ContestManager.create({
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

    node = node1!;
    user = user1!;
    topic = topic1!;
    community = community1!;

    vi.spyOn(tokenBalanceCache, 'getBalances').mockResolvedValue({
      [userAddress]: '5',
    });
  });

  afterAll(async () => {
    await dispose()();
    vi.restoreAllMocks();
  });

  describe('Nomination Upgrade Policy', async () => {
    test('should upgrade user to tier 4 when 5 or more nomination tokens are held', async () => {
      const userBefore = await models.User.findByPk(user.id);
      expect(userBefore?.tier).toBe(0);

      await emitEvent(models.Outbox, [
        buildNamespaceTransferSingleEvent(
          community.namespace_address!,
          ZERO_ADDRESS,
          userAddress,
          '3',
          '5',
        ) as EventPair<'NamespaceTransferSingle'>,
      ]);

      await drainOutbox(['NamespaceTransferSingle'], UpgradeTierPolicy);

      const userAfter = await models.User.findByPk(user.id);
      expect(userAfter?.tier).toBe(4);
    });
  });

  describe('Contest Upgrade Policy', async () => {
    test('should upgrade user to tier 4 when contest is funded and there is contest activity', async () => {
      await models.User.update({ tier: 0 }, { where: { id: user.id } });

      const userBefore = await models.User.findByPk(user.id);
      expect(userBefore?.tier).toBe(0);

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
      ).toBe(0);

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
        'balance is sufficient, user should be upgraded to tier 4',
      ).toBe(4);
    });
  });
});
