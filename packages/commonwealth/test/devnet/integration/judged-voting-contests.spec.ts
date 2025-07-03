import { command } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { UserTierMap } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import {
  cleanupWeightedVotingTest,
  setupWeightedVotingTest,
  WeightedVotingTestSetup,
} from './integrationUtils/weightedVotingTestSetup';

import { CommunityNominations } from '@hicommonwealth/evm-testing';
import { Community, Contest, Thread } from '@hicommonwealth/model';

const TIMEOUT = 60_000 * 4;
const TX_TIMEOUT = 10_000;
const INTERVAL = 1_000;

describe(
  'Judged Voting Contests E2E Integration Test',
  () => {
    let setup: WeightedVotingTestSetup;

    beforeAll(async () => {
      setup = await setupWeightedVotingTest();
    }, TIMEOUT);

    afterAll(async () => {
      await cleanupWeightedVotingTest();
    });

    test('should handle judged contests with unweighted voting', async () => {
      let communityNominations: CommunityNominations;

      // Create unweighted topic (no weighted_voting set)
      // A contest is "judged" when:
      // 1. The topic has no weighted_voting set (null/undefined)
      // 2. The judgeContest feature flag is enabled
      // This differs from weighted contests that use TopicWeightedVoting.Stake or TopicWeightedVoting.ERC20
      const judgedTopicResult = await command(Community.CreateTopic(), {
        actor: {
          user: { id: setup.userId, email: setup.user.email!, isAdmin: true },
          address: setup.userAddress,
        },
        payload: {
          community_id: setup.communityId,
          name: 'Judged Contest Topic',
          description: 'A topic for testing judged contests',
          featured_in_sidebar: false,
          featured_in_new_post: false,
          // No weighted_voting specified - this makes it unweighted/judged
          chain_node_id: setup.chainNodeId,
        },
      });
      const judgedTopicId = judgedTopicResult!.topic.id!;

      const judgeId = 100; // Unique judge token ID for this contest

      // =============================================================
      // UI FLOW: Judge Contest Creation Following Real UI Steps
      // =============================================================

      // Step 1: Configure judge nominations (register and mint judge tokens)
      console.log('Step 1: Configuring judge nominations...');
      await setup.namespaceFactory.configureNominations(
        setup.namespaceName,
        true, // creator only
        5, // max nominations
        judgeId,
      );

      // Initialize community nominations SDK
      communityNominations = new CommunityNominations(setup.web3);

      // Step 2: Nominate self as judge (explicit nomination via blockchain)
      console.log('Step 2: Nominating creator as judge...');
      await communityNominations.nominateJudges(
        setup.namespaceName,
        [setup.userAddress],
        judgeId,
      );

      // Step 3: Deploy judged contest
      console.log('Step 3: Deploying judged contest...');
      const judgedContestResult =
        await setup.namespaceFactory.newSingleJudgedContest(
          setup.namespaceName,
          3600, // 1 hour duration
          [80, 15, 5], // winner shares: 80%, 15%, 5%
          10, // voter share
          '0x0000000000000000000000000000000000000000', // ETH as exchange token
          judgeId,
        );
      const judgedContestAddress = judgedContestResult.contest;

      // Step 4: Create contest manager metadata
      console.log('Step 4: Creating contest manager metadata...');
      await command(Contest.CreateContestManagerMetadata(), {
        actor: {
          user: { id: setup.userId, email: setup.user.email!, isAdmin: true },
          address: setup.userAddress,
        },
        payload: {
          contest_address: judgedContestAddress,
          community_id: setup.communityId,
          name: 'Test Judged Contest',
          description: 'Testing judged voting in contests',
          image_url: 'https://example.com/judged.png',
          funding_token_address: '0x0000000000000000000000000000000000000000',
          prize_percentage: 100,
          payout_structure: [80, 15, 5],
          interval: 0,
          topic_id: judgedTopicId,
          ticker: 'ETH',
          decimals: 18,
          is_farcaster_contest: false,
          namespace_judge_token_id: judgeId,
        },
      });

      // Wait for contest to be created
      await vi.waitFor(
        async () => {
          const contest = await models.Contest.findOne({
            where: { contest_address: judgedContestAddress },
          });
          expect(contest).toBeTruthy();
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Wait for judge nomination to be processed and creator added as judge
      await vi.waitFor(
        async () => {
          const contestManager = await models.ContestManager.findOne({
            where: { contest_address: judgedContestAddress },
          });
          expect(contestManager?.namespace_judges).toContain(setup.userAddress);
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Create a thread
      const judgedThreadResult = await command(Thread.CreateThread(), {
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
          topic_id: judgedTopicId,
          title: 'Test Judged Contest Thread',
          body: 'This is a test thread for judged contests',
          kind: 'discussion' as const,
          stage: 'discussion',
          read_only: false,
        },
      });

      // Wait for thread to be added to contest
      await vi.waitFor(
        async () => {
          const contestAction = await models.ContestAction.findOne({
            where: {
              contest_address: judgedContestAddress,
              thread_id: judgedThreadResult!.id,
              action: 'added',
            },
          });
          expect(contestAction).toBeTruthy();
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Test that the judge can vote (creator is automatically nominated as judge)
      console.log('testing judge can vote');
      await command(Thread.CreateThreadReaction(), {
        actor: {
          user: { id: setup.userId, email: setup.user.email!, isAdmin: true },
          address: setup.userAddress,
        },
        payload: {
          thread_id: judgedThreadResult!.id!,
          reaction: 'like',
        },
      });

      // Wait for judge vote to be processed
      await vi.waitFor(
        async () => {
          const voteAction = await models.ContestAction.findOne({
            where: {
              contest_address: judgedContestAddress,
              actor_address: setup.userAddress,
              action: 'upvoted',
            },
          });
          expect(voteAction).toBeTruthy();
          expect(voteAction!.calculated_voting_weight).not.toBeNull();
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Create a second user who is NOT a judge
      const nonJudgeUserId = 1002;
      const nonJudgeAddressId = 1002;
      const nonJudgeUserAddress = setup.anvilAccounts[1].address;

      // Create non-judge user
      await models.User.create({
        id: nonJudgeUserId,
        email: `nonjudge-${nonJudgeUserId}@example.com`,
        isAdmin: false,
        profile: {},
        tier: UserTierMap.ManuallyVerified,
      });

      // Create address for non-judge user in the community
      await models.Address.create({
        id: nonJudgeAddressId,
        community_id: setup.communityId,
        address: nonJudgeUserAddress,
        user_id: nonJudgeUserId,
        role: 'member',
        verified: new Date(),
        last_active: new Date(),
        ghost_address: false,
        is_banned: false,
        verification_token: '1234567891',
      });

      // Test that non-judge cannot vote (should be filtered out by ContestWorker policy)
      console.log('testing non-judge cannot vote');
      try {
        await command(Thread.CreateThreadReaction(), {
          actor: {
            user: {
              id: nonJudgeUserId,
              email: `nonjudge-${nonJudgeUserId}@example.com`,
              isAdmin: false,
            },
            address: nonJudgeUserAddress,
          },
          payload: {
            thread_id: judgedThreadResult!.id!,
            reaction: 'like',
          },
        });

        // If we get here, the vote was processed, but it should be filtered out
        // by the ContestWorker policy, so no ContestAction should be created
        await vi.waitFor(
          async () => {
            const nonJudgeVoteAction = await models.ContestAction.findOne({
              where: {
                contest_address: judgedContestAddress,
                actor_address: nonJudgeUserAddress,
                action: 'upvoted',
              },
            });
            // This should NOT exist because non-judges are filtered out
            expect(nonJudgeVoteAction).toBeNull();
          },
          {
            timeout: TX_TIMEOUT,
            interval: INTERVAL,
          },
        );
      } catch (error) {
        // This might throw an error if the CreateThreadReaction command itself
        // blocks non-judges, which is also acceptable behavior
        console.log('Non-judge vote blocked by command layer:', error.message);
      }

      // Verify only judge votes are recorded
      const allVoteActions = await models.ContestAction.findAll({
        where: {
          contest_address: judgedContestAddress,
          action: 'upvoted',
        },
      });

      expect(allVoteActions.length).toBe(1);
      expect(allVoteActions[0].actor_address).toBe(setup.userAddress);
    });
  },
  TIMEOUT,
);
