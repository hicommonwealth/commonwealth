import { command } from '@hicommonwealth/core';
import { models, tokenBalanceCache } from '@hicommonwealth/model';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import {
  cleanupWeightedVotingTest,
  setupWeightedVotingTest,
  WeightedVotingTestSetup,
} from './integrationUtils/weightedVotingTestSetup';

import { Community, Contest, Thread } from '@hicommonwealth/model';

const TIMEOUT = 60_000 * 4;
const TX_TIMEOUT = 10_000;
const INTERVAL = 1_000;

describe(
  'ERC20 Weighted Voting Contests E2E Integration Test',
  () => {
    let setup: WeightedVotingTestSetup;

    beforeAll(async () => {
      setup = await setupWeightedVotingTest();
    }, TIMEOUT);

    afterAll(async () => {
      await cleanupWeightedVotingTest();
    });

    test('should handle ERC20 weighted voting in contests', async () => {
      // Create ERC20 weighted voting topic using command
      const erc20TopicResult = await command(Community.CreateTopic(), {
        actor: {
          user: { id: setup.userId, email: setup.user.email!, isAdmin: true },
          address: setup.userAddress,
        },
        payload: {
          community_id: setup.communityId,
          name: 'ERC20 Weighted Topic',
          description: 'A topic for testing ERC20 weighted voting',
          featured_in_sidebar: false,
          featured_in_new_post: false,
          weighted_voting: TopicWeightedVoting.ERC20,
          chain_node_id: setup.chainNodeId,
          token_address: setup.testToken.contractAddress,
          token_symbol: 'TT',
          vote_weight_multiplier: 2,
          token_decimals: 18,
        },
      });
      const erc20TopicId = erc20TopicResult!.topic.id!;

      // Deploy contest
      const erc20ContestResult = await setup.namespaceFactory.newERC20Contest(
        setup.namespaceName,
        3600, // 1 hour duration
        [60, 30, 10], // winner shares: 60%, 30%, 10%
        setup.testToken.contractAddress, // ERC20 token address
        10, // voter share
        setup.testToken.contractAddress, // exchange token
      );
      const erc20ContestAddress = erc20ContestResult.contest;

      const voteWeightMultiplier = 12;

      // Create contest manager using command
      await command(Contest.CreateContestManagerMetadata(), {
        actor: {
          user: { id: setup.userId, email: setup.user.email!, isAdmin: true },
          address: setup.userAddress,
        },
        payload: {
          contest_address: erc20ContestAddress,
          community_id: setup.communityId,
          name: 'Test ERC20 Contest',
          description: 'Testing ERC20 weighted voting in contests',
          image_url: 'https://example.com/erc20.png',
          funding_token_address: setup.testToken.contractAddress,
          prize_percentage: 100,
          payout_structure: [60, 30, 10],
          interval: 0,
          topic_id: erc20TopicId,
          ticker: 'TEST',
          decimals: 18,
          is_farcaster_contest: false,
          vote_weight_multiplier: voteWeightMultiplier,
        },
      });

      // Wait for contest instance to be created
      await vi.waitFor(
        async () => {
          const contest = await models.Contest.findOne({
            where: { contest_address: erc20ContestAddress },
          });
          expect(contest).toBeTruthy();
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Create a thread using the CreateThread command
      const erc20ThreadResult = await command(Thread.CreateThread(), {
        actor: {
          user: {
            id: setup.userId,
            email: `test-${setup.userId}@example.com`,
            isAdmin: true,
          },
          address: setup.userAddress,
        },
        payload: {
          community_id: setup.communityId,
          topic_id: erc20TopicId,
          title: 'Test ERC20 Weighted Voting Thread',
          body: 'This is a test thread for ERC20 weighted voting',
          kind: 'discussion' as const,
          stage: 'discussion',
          read_only: false,
        },
      });

      // Wait for automatic processing of ContestContentAdded event
      await vi.waitFor(
        async () => {
          const contestAction = await models.ContestAction.findOne({
            where: {
              contest_address: erc20ContestAddress,
              thread_id: erc20ThreadResult!.id,
              action: 'added',
            },
          });
          expect(contestAction).toBeTruthy();
          expect(contestAction!.actor_address).toBe(setup.userAddress);
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Get token balance of user via tokenBalanceCache
      const tokenBalances = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.ERC20,
        addresses: [setup.userAddress],
        sourceOptions: {
          evmChainId: 31337, // Use the Anvil chain ID
          contractAddress: setup.testToken.contractAddress,
        },
        cacheRefresh: true,
      });
      const tokenBalance = tokenBalances[setup.userAddress] || '0';
      console.log('Token balance:', tokenBalance);

      // Make upvote on thread
      await command(Thread.CreateThreadReaction(), {
        actor: {
          user: { id: setup.userId, email: setup.user.email!, isAdmin: true },
          address: setup.userAddress,
        },
        payload: {
          thread_id: erc20ThreadResult!.id!,
          reaction: 'like',
        },
      });

      // Wait for automatic processing of ContestContentUpvoted event
      await vi.waitFor(
        async () => {
          const voteAction = await models.ContestAction.findOne({
            where: {
              contest_address: erc20ContestAddress,
              actor_address: setup.userAddress,
              action: 'upvoted',
            },
          });
          expect(voteAction).toBeTruthy();
          expect(voteAction!.calculated_voting_weight).not.toBeNull();
          // For ERC20 voting, we expect the calculated weight to reflect
          // the token balance and multiplier
          const expectedWeight =
            BigInt(tokenBalance) * BigInt(voteWeightMultiplier);
          expect(BigInt(voteAction!.calculated_voting_weight!)).toEqual(
            expectedWeight,
          );
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );
    });
  },
  TIMEOUT,
);
