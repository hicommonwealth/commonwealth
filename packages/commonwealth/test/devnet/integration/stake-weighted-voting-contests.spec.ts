import { command } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
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
  'Stake Weighted Voting Contests E2E Integration Test',
  () => {
    let setup: WeightedVotingTestSetup;

    beforeAll(async () => {
      setup = await setupWeightedVotingTest();
    }, TIMEOUT);

    afterAll(async () => {
      await cleanupWeightedVotingTest();
    });

    test('should handle staked contest with weighted voting', async () => {
      console.log('creating topic');
      // Create weighted voting topic using command
      const topicResult = await command(Community.CreateTopic(), {
        actor: {
          user: { id: setup.userId, email: setup.user.email!, isAdmin: true },
          address: setup.userAddress,
        },
        payload: {
          community_id: setup.communityId,
          name: 'Weighted Voting Topic',
          description: 'A topic for testing weighted voting',
          featured_in_sidebar: false,
          featured_in_new_post: false,
          weighted_voting: TopicWeightedVoting.Stake,
          chain_node_id: setup.chainNodeId,
          vote_weight_multiplier: 3,
        },
      });
      const stakeTopicId = topicResult!.topic.id!;

      console.log('deploying contest');
      // Deploy contest
      let contestAddress: string;
      try {
        const contestResult = await setup.namespaceFactory.newSingleContest(
          setup.namespaceName,
          3600, // 1 hour duration
          [70, 20, 10], // winner shares: 70%, 20%, 10%
          '0x0000000000000000000000000000000000000000', // ETH as exchange token
          2, // stake ID
          10, // voter share
          3, // weight multiplier
        );
        contestAddress = contestResult.contest;
      } catch (err) {
        console.error(err);
        throw err;
      }

      console.log('creating contest manager');
      // Create contest manager using command
      await command(Contest.CreateContestManagerMetadata(), {
        actor: {
          user: { id: setup.userId, email: setup.user.email!, isAdmin: true },
          address: setup.userAddress,
        },
        payload: {
          contest_address: contestAddress,
          community_id: setup.communityId,
          name: 'Test Weighted Contest',
          description: 'Testing weighted voting in contests',
          image_url: 'https://example.com/image.png',
          funding_token_address: '0x0000000000000000000000000000000000000000',
          prize_percentage: 100,
          payout_structure: [70, 20, 10],
          interval: 0,
          topic_id: stakeTopicId,
          ticker: 'ETH',
          decimals: 18,
          is_farcaster_contest: false,
          vote_weight_multiplier: 3,
        },
      });

      console.log('waiting for contest instance to be created');
      // Wait for contest instance to be created
      await vi.waitFor(
        async () => {
          const contest = await models.Contest.findOne({
            where: { contest_address: contestAddress },
          });
          expect(contest).toBeTruthy();
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      console.log('creating thread');
      // Create a thread using the CreateThread command
      const threadResult = await command(Thread.CreateThread(), {
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
          topic_id: stakeTopicId,
          title: 'Test Weighted Voting Thread',
          body: 'This is a test thread for weighted voting',
          kind: 'discussion' as const,
          stage: 'discussion',
          read_only: false,
        },
      });

      console.log(
        'waiting for automatic processing of ContestContentAdded event',
      );
      // Wait for automatic processing of ContestContentAdded event
      await vi.waitFor(
        async () => {
          const contestAction = await models.ContestAction.findOne({
            where: {
              contest_address: contestAddress,
              thread_id: threadResult!.id,
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

      console.log('making upvote on thread');
      // Make upvote on thread
      await command(Thread.CreateThreadReaction(), {
        actor: {
          user: { id: setup.userId, email: setup.user.email!, isAdmin: true },
          address: setup.userAddress,
        },
        payload: {
          thread_id: threadResult!.id!,
          reaction: 'like',
        },
      });

      console.log(
        'waiting for automatic processing of ContestContentUpvoted event',
      );
      // Wait for automatic processing of ContestContentUpvoted event
      await vi.waitFor(
        async () => {
          const voteAction = await models.ContestAction.findOne({
            where: {
              contest_address: contestAddress,
              actor_address: setup.userAddress,
              action: 'upvoted',
            },
          });
          expect(voteAction).toBeTruthy();
          expect(voteAction!.calculated_voting_weight).not.toBeNull();
          expect(BigInt(voteAction!.calculated_voting_weight!)).toBe(
            BigInt(setup.stakeAmount),
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
