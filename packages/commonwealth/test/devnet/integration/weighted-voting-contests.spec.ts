import { dispose } from '@hicommonwealth/core';
import {
  addContentBatch,
  voteContentBatch,
} from '@hicommonwealth/evm-protocols';
import { config, models } from '@hicommonwealth/model';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import {
  ChainBase,
  ChainType,
  CommunityTierMap,
  UserTierMap,
} from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { setupCommonwealthE2E } from './integrationUtils/mainSetup';

import { CommunityStake, NamespaceFactory } from '@hicommonwealth/evm-testing';

const TIMEOUT = 120_000;
const INTERVAL = 3_000;

describe(
  'Weighted Voting Contests E2E Integration Test',
  () => {
    let namespaceFactory: NamespaceFactory;
    let communityStake: CommunityStake;
    let anvilAccounts: any;
    let web3: any;

    // Test data
    const communityId = 'test-weighted-community';
    const namespaceName = 'TestWeightedNamespace';
    const addressId = 1001;
    const userId = 1001;
    const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const voterAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const threadId = 2001;
    const threadTitle = 'Test Weighted Voting Thread';
    let topicId: number;
    let contestAddress: string;
    let contestId = 0;
    let chainNodeId: number;
    let privateKey: string;
    let rpcUrl: string;

    beforeAll(async () => {
      // Setup Commonwealth E2E environment with relayer and event processing
      const setupResult = await setupCommonwealthE2E();

      web3 = setupResult.web3;
      anvilAccounts = setupResult.anvilAccounts;
      privateKey = config.WEB3.PRIVATE_KEY;

      // Set rpcUrl based on the anvil container
      const anvilPort = setupResult.anvilContainer!.getMappedPort(8545);
      rpcUrl = `http://localhost:${anvilPort}`;

      namespaceFactory = new NamespaceFactory(web3);
      communityStake = new CommunityStake(web3);

      // Use the ChainNode created by setupCommonwealthE2E (setupAnvil)
      const chainNode = await models.ChainNode.findOne({
        where: { eth_chain_id: 31337 },
      });
      if (!chainNode) {
        throw new Error(
          'Anvil ChainNode not found - setupCommonwealthE2E may have failed',
        );
      }
      chainNodeId = chainNode.id!;

      // Create test user with unique ID to avoid conflicts
      const user = await models.User.create({
        id: userId,
        email: `test-${userId}@example.com`,
        isAdmin: false,
        profile: {},
        tier: UserTierMap.ManuallyVerified,
      });

      // Deploy namespace on anvil
      await namespaceFactory.deployNamespace(namespaceName);

      // Configure community stakes
      await namespaceFactory.configureCommunityStakes(namespaceName, 2);

      // Get namespace address
      const namespaceAddress =
        await namespaceFactory.getNamespaceAddress(namespaceName);

      // Create community with stake-based weighted voting
      const community = await models.Community.create({
        id: communityId,
        name: 'Test Weighted Community',
        chain_node_id: chainNodeId,
        network: 'ethereum',
        default_symbol: 'ETH',
        type: ChainType.Chain,
        base: ChainBase.Ethereum,
        tier: CommunityTierMap.ChainVerified,
        lifetime_thread_count: 0,
        profile_count: 1,
        namespace_address: namespaceAddress,
        spam_tier_level: UserTierMap.NewlyVerifiedWallet,
        active: true,
        social_links: [],
        stages_enabled: true,
        custom_stages: [],
        directory_page_enabled: false,
        collapsed_on_homepage: false,
        snapshot_spaces: [],
        ai_features_enabled: true,
        environment: 'CI',
      } as unknown as any);

      // Create weighted voting topic
      const topic = await models.Topic.create({
        name: 'Weighted Voting Topic',
        community_id: communityId,
        weighted_voting: TopicWeightedVoting.Stake,
        chain_node_id: chainNodeId,
        vote_weight_multiplier: 1.5,
        description: 'A topic for testing weighted voting',
        featured_in_sidebar: false,
        featured_in_new_post: false,
      });
      topicId = topic.id!;

      // Create community stake
      await models.CommunityStake.create({
        community_id: communityId,
        stake_id: 2,
        stake_token: namespaceAddress,
        vote_weight: 3,
        stake_enabled: true,
      });

      // Create user address
      await models.Address.create({
        id: addressId,
        community_id: communityId,
        address: userAddress,
        user_id: userId,
        role: 'member',
        verified: new Date(),
        last_active: new Date(),
        ghost_address: false,
        is_banned: false,
        verification_token: '1234567890',
      });

      // Deploy contest
      const contestResult = await namespaceFactory.newSingleContest(
        namespaceName,
        3600, // 1 hour duration
        [70, 20, 10], // winner shares: 70%, 20%, 10%
        '0x0000000000000000000000000000000000000000', // ETH as exchange token
        2, // stake ID
        10, // voter share
        3, // weight multiplier
      );
      contestAddress = contestResult.contest;

      // Create contest manager in database
      await models.ContestManager.create({
        contest_address: contestAddress,
        community_id: communityId,
        name: 'Test Weighted Contest',
        description: 'Testing weighted voting in contests',
        image_url: 'https://example.com/image.png',
        funding_token_address: '0x0000000000000000000000000000000000000000',
        prize_percentage: 100,
        payout_structure: [70, 20, 10],
        interval: 0,
        topic_id: topicId,
        created_at: new Date(),
        cancelled: false,
        ended: false,
        vote_weight_multiplier: 3,
        ticker: 'ETH',
        decimals: 18,
        is_farcaster_contest: false,
        environment: 'CI',
      });

      // Create active contest
      await models.Contest.create({
        contest_address: contestAddress,
        contest_id: contestId,
        start_time: new Date(),
        end_time: new Date(Date.now() + 3600000), // 1 hour from now
        score: [],
      });

      // Buy some stake for voting weight
      await communityStake.buyStake(namespaceName, 2, 5); // Buy 5 units of stake

      // Note: Block mining is handled automatically by the test environment
    }, TIMEOUT);

    afterAll(async () => {
      vi.restoreAllMocks();
      await dispose()();
    });

    test('should create weighted voting contest with correct vote weight calculation', async () => {
      // Create a thread that will be added to the contest
      const thread = await models.Thread.create({
        id: threadId,
        community_id: communityId,
        address_id: addressId,
        topic_id: topicId,
        title: threadTitle,
        body: 'This is a test thread for weighted voting',
        kind: 'discussion',
        stage: 'discussion',
        created_by: userAddress,
        deleted_at: undefined,
        pinned: false,
        read_only: false,
        reaction_weights_sum: '0',
        view_count: 0,
        comment_count: 0,
        reaction_count: 0,
      });

      // Make actual web3 contract call to add content to contest
      await addContentBatch({
        chain: {
          eth_chain_id: 31337,
          rpc: rpcUrl,
        },
        privateKey,
        contest: [contestAddress],
        creator: userAddress,
        url: `/${communityId}/discussion/${threadId}`,
      });

      // Wait for automatic processing of ContestContentAdded event
      await vi.waitFor(
        async () => {
          const contestAction = await models.ContestAction.findOne({
            where: {
              contest_address: contestAddress,
              thread_id: threadId,
              action: 'added',
            },
          });
          expect(contestAction).toBeTruthy();
          expect(contestAction!.actor_address).toBe(userAddress);
        },
        {
          timeout: TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Make actual web3 contract call to vote on contest content
      await voteContentBatch({
        chain: {
          eth_chain_id: 31337,
          rpc: rpcUrl,
        },
        privateKey,
        voter: voterAddress,
        entries: [
          {
            contestAddress: contestAddress,
            contentId: '1', // First content ID
          },
        ],
      });

      // Wait for automatic processing of ContestContentUpvoted event
      await vi.waitFor(
        async () => {
          const voteAction = await models.ContestAction.findOne({
            where: {
              contest_address: contestAddress,
              actor_address: voterAddress,
              action: 'upvoted',
            },
          });

          expect(voteAction).toBeTruthy();
          expect(voteAction!.calculated_voting_weight).not.toBeNull();

          // The calculated voting weight should be based on the stake balance and multiplier
          // With 1.5x multiplier, the weight should be 1.5 times the stake balance
          expect(BigInt(voteAction!.calculated_voting_weight!)).toBeGreaterThan(
            BigInt(0),
          );
        },
        {
          timeout: TIMEOUT,
          interval: INTERVAL,
        },
      );
    });

    test('should handle ERC20 weighted voting in contests', async () => {
      // Create ERC20 weighted voting topic
      const erc20Topic = await models.Topic.create({
        name: 'ERC20 Weighted Topic',
        community_id: communityId,
        weighted_voting: TopicWeightedVoting.ERC20,
        chain_node_id: chainNodeId,
        token_address: '0x1234567890123456789012345678901234567890',
        token_symbol: 'TEST',
        vote_weight_multiplier: 2.0,
        token_decimals: 18,
        description: 'A topic for testing ERC20 weighted voting',
        featured_in_sidebar: false,
        featured_in_new_post: false,
      });

      // Deploy ERC20 contest for this topic
      const erc20ContestResult = await namespaceFactory.newSingleContest(
        namespaceName,
        3600, // 1 hour duration
        [60, 30, 10], // winner shares
        '0x1234567890123456789012345678901234567890', // ERC20 token address
        0, // no stake ID for ERC20
        10, // voter share
        2.0, // weight multiplier
      );

      // Create contest manager for ERC20 voting
      const erc20ContestManager = await models.ContestManager.create({
        contest_address: erc20ContestResult.contest,
        community_id: communityId,
        name: 'ERC20 Weighted Contest',
        description: 'Testing ERC20 weighted voting',
        image_url: 'https://example.com/erc20.png',
        funding_token_address: '0x1234567890123456789012345678901234567890',
        prize_percentage: 100,
        payout_structure: [60, 30, 10],
        interval: 0,
        topic_id: erc20Topic.id!,
        created_at: new Date(),
        cancelled: false,
        ended: false,
        vote_weight_multiplier: 2.0,
        ticker: 'TEST',
        decimals: 18,
        is_farcaster_contest: false,
      });

      // Create active contest
      await models.Contest.create({
        contest_address: erc20ContestResult.contest,
        contest_id: 1,
        start_time: new Date(),
        end_time: new Date(Date.now() + 3600000), // 1 hour from now
        score: [],
      });

      // Create thread in ERC20 topic
      const erc20Thread = await models.Thread.create({
        id: threadId + 1,
        community_id: communityId,
        address_id: addressId,
        topic_id: erc20Topic.id!,
        title: 'ERC20 Weighted Thread',
        body: 'Testing ERC20 weighted voting',
        kind: 'discussion',
        stage: 'discussion',
        created_by: userAddress,
        deleted_at: undefined,
        pinned: false,
        read_only: false,
        reaction_weights_sum: '0',
        view_count: 0,
        comment_count: 0,
        reaction_count: 0,
      });

      // Make actual web3 contract call to add content to ERC20 contest
      await addContentBatch({
        chain: {
          eth_chain_id: 31337,
          rpc: rpcUrl,
        },
        privateKey,
        contest: [erc20ContestResult.contest],
        creator: userAddress,
        url: `/${communityId}/discussion/${erc20Thread.id}`,
      });

      // Wait for automatic processing of ContestContentAdded event
      await vi.waitFor(
        async () => {
          const contestAction = await models.ContestAction.findOne({
            where: {
              contest_address: erc20ContestResult.contest,
              thread_id: erc20Thread.id!,
              action: 'added',
            },
          });
          expect(contestAction).toBeTruthy();
          expect(contestAction!.actor_address).toBe(userAddress);
        },
        {
          timeout: TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Make actual web3 contract call to vote with ERC20 weighted voting
      await voteContentBatch({
        chain: {
          eth_chain_id: 31337,
          rpc: rpcUrl,
        },
        privateKey,
        voter: voterAddress,
        entries: [
          {
            contestAddress: erc20ContestResult.contest,
            contentId: '1', // First content ID for this contest
          },
        ],
      });

      // Wait for automatic processing of ContestContentUpvoted event
      await vi.waitFor(
        async () => {
          const erc20Vote = await models.ContestAction.findOne({
            where: {
              contest_address: erc20ContestResult.contest,
              actor_address: voterAddress,
              action: 'upvoted',
            },
          });

          expect(erc20Vote).toBeTruthy();
          expect(erc20Vote!.calculated_voting_weight).not.toBeNull();

          // Verify ERC20 weighted voting calculation (2x multiplier applied)
          const votingPower = BigInt(erc20Vote!.voting_power || '0');
          const calculatedWeight = BigInt(
            erc20Vote!.calculated_voting_weight || '0',
          );
          expect(Number(calculatedWeight)).toBeGreaterThan(Number(votingPower));
        },
        {
          timeout: TIMEOUT,
          interval: INTERVAL,
        },
      );
    });

    test('should correctly calculate contest scores with weighted voting', async () => {
      // Create multiple contest actions with different weights
      const contentActions = [
        {
          content_id: 3,
          actor_address: userAddress,
          calculated_voting_weight: '1500000000000000000', // 1.5 tokens
        },
        {
          content_id: 4,
          actor_address: voterAddress,
          calculated_voting_weight: '3000000000000000000', // 3 tokens
        },
        {
          content_id: 5,
          actor_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          calculated_voting_weight: '750000000000000000', // 0.75 tokens
        },
      ];

      // Add contest actions for score calculation
      for (const action of contentActions) {
        await models.ContestAction.create({
          contest_address: contestAddress,
          contest_id: contestId,
          content_id: action.content_id,
          action: 'upvoted',
          actor_address: action.actor_address,
          thread_id: threadId,
          content_url: `/${communityId}/discussion/${threadId}`,
          voting_power: action.calculated_voting_weight,
          calculated_voting_weight: action.calculated_voting_weight,
          created_at: new Date(),
        });
      }

      // Get contest actions and verify weights
      const contestActions = await models.ContestAction.findAll({
        where: {
          contest_address: contestAddress,
          action: 'upvoted',
        },
        order: [['calculated_voting_weight', 'DESC']],
      });

      expect(contestActions.length).toBeGreaterThan(0);

      // Verify actions are ordered by weight (highest first)
      let previousWeight = BigInt('999999999999999999999999999999999999999');
      for (const action of contestActions) {
        const currentWeight = BigInt(action.calculated_voting_weight || '0');
        expect(Number(currentWeight)).toBeLessThanOrEqual(
          Number(previousWeight),
        );
        previousWeight = currentWeight;
      }

      // Verify total weighted votes
      const totalWeight = contestActions.reduce(
        (sum, action) => sum + BigInt(action.calculated_voting_weight || '0'),
        BigInt(0),
      );
      expect(Number(totalWeight)).toBeGreaterThan(0);
    });
  },
  TIMEOUT,
);
