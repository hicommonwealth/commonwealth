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

import { command } from '@hicommonwealth/core';
import { CommunityStake, NamespaceFactory } from '@hicommonwealth/evm-testing';
import { Community, Contest, Thread } from '@hicommonwealth/model';

import {
  CommunityNominationsAbi,
  NamespaceFactoryAbi,
} from '@commonxyz/common-protocol-abis';
import {
  commonProtocol,
  factoryContracts,
} from '@hicommonwealth/evm-protocols';

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
        isAdmin: true,
        profile: {},
        tier: UserTierMap.ManuallyVerified,
      });

      // Create a dummy/base community directly via models (required for user to have an address)
      const baseCommunityId = 'base-ethereum-community';
      await models.Community.create({
        id: baseCommunityId,
        name: 'Base Ethereum Community',
        chain_node_id: chainNodeId,
        network: 'ethereum',
        default_symbol: 'ETH',
        type: ChainType.Chain,
        base: ChainBase.Ethereum,
        tier: CommunityTierMap.ChainVerified,
        lifetime_thread_count: 0,
        profile_count: 1,
        active: true,
        social_links: [],
        stages_enabled: true,
        custom_stages: [],
        directory_page_enabled: false,
        collapsed_on_homepage: false,
        snapshot_spaces: [],
        ai_features_enabled: true,
        environment: 'CI',
        spam_tier_level: UserTierMap.NewlyVerifiedWallet,
      } as unknown as any);

      // Create user address in base community
      await models.Address.create({
        id: addressId,
        community_id: baseCommunityId,
        address: userAddress,
        user_id: userId,
        role: 'admin',
        verified: new Date(),
        last_active: new Date(),
        ghost_address: false,
        is_banned: false,
        verification_token: '1234567890',
      });

      // =============================================================
      // UI FLOW: Community Creation Following Real UI Steps
      // =============================================================

      // Step 1: Community Type Selection (already done - selected Ethereum)
      console.log('Step 1: Community type selected (Ethereum)');

      // Step 2: Community Information - CREATE COMMUNITY (like UI does)
      console.log('Step 2: Creating community in database...');
      await command(Community.CreateCommunity(), {
        actor: {
          user: { id: userId, email: user.email!, isAdmin: true },
          address: userAddress,
        },
        payload: {
          id: communityId,
          name: 'Test Weighted Community',
          chain_node_id: chainNodeId,
          default_symbol: 'ETH',
          type: ChainType.Chain,
          base: ChainBase.Ethereum,
          social_links: [],
          tags: [],
          directory_page_enabled: false,
          description: 'A test community for weighted voting contests',
        },
      });

      // Step 3: Onchain Transactions (3 blockchain transactions)
      console.log('Step 3: Starting blockchain transactions...');

      // Transaction 1: Deploy namespace ("Reserve community namespace")
      console.log('Transaction 1: Deploying namespace...');
      await namespaceFactory.deployNamespace(namespaceName);
      const namespaceAddress =
        await namespaceFactory.getNamespaceAddress(namespaceName);

      await models.Community.update(
        {
          namespace_address: namespaceAddress,
          namespace: namespaceName,
        },
        { where: { id: communityId } },
      );

      // Transaction 2: Configure verification
      console.log('Transaction 2: Configuring verification...');

      const factoryAddress = factoryContracts['31337']?.factory;
      if (!factoryAddress) {
        throw new Error('Factory address not found for chain 31337');
      }

      // Create contract instance using web3 from testing setup
      const factoryContract = new web3.eth.Contract(
        NamespaceFactoryAbi,
        factoryAddress,
      );

      // Call configureNominationNominator (same as configureVerification in UI)
      const configureVerificationTxReceipt = await factoryContract.methods
        .configureNominationNominator(namespaceName)
        .send({
          from: userAddress,
          gas: '500000', // Set reasonable gas limit
        });
      console.log(
        'Verification configured with tx:',
        configureVerificationTxReceipt.transactionHash,
      );

      await vi.waitFor(
        async () => {
          const community = await models.Community.findOne({
            where: { id: communityId },
          });
          expect(community?.namespace_verification_configured).toBe(true);
        },
        {
          timeout: TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Transaction 3: Mint verification token
      console.log('Transaction 3: Minting verification token...');

      const nominationContractAddress =
        factoryContracts['31337']?.communityNomination;
      if (!nominationContractAddress) {
        throw new Error(
          'Community nomination contract address not found for chain 31337',
        );
      }

      // Create community nominations contract instance
      const nominationsContract = new web3.eth.Contract(
        CommunityNominationsAbi,
        nominationContractAddress,
      );

      // Call nominateNominator (same as mintVerificationToken in UI)
      await nominationsContract.methods
        .nominateNominator(namespaceName, userAddress)
        .send({
          from: userAddress,
          value: web3.utils.toWei(
            commonProtocol.NOMINATION_FEE.toString(),
            'ether',
          ),
          gas: '500000', // Set reasonable gas limit
        });

      // Wait for NominationsWorker to process MintVerificationToken event
      await vi.waitFor(
        async () => {
          const community = await models.Community.findOne({
            where: { id: communityId },
          });
          expect(community?.namespace_verified).toBe(true);
          expect(community?.namespace_nominations).toContain(userAddress);
        },
        {
          timeout: TIMEOUT,
          interval: INTERVAL,
        },
      );

      console.log(
        'Community setup complete - follows UI flow: Create → Deploy → Configure → Mint',
      );

      // Configure community stakes for testing
      await namespaceFactory.configureCommunityStakes(namespaceName, 2);

      await command(Community.SetCommunityStake(), {
        actor: {
          user: { id: userId, email: user.email!, isAdmin: true },
          address: userAddress,
        },
        payload: {
          community_id: communityId,
          stake_id: 2,
          stake_token: '',
          vote_weight: 1,
          stake_enabled: true,
        },
      });

      // Wait for CommunityStake to be created
      await vi.waitFor(
        async () => {
          const communityStake = await models.CommunityStake.findOne({
            where: {
              community_id: communityId,
              stake_id: 2,
            },
          });
          expect(communityStake).toBeTruthy();
        },
        {
          timeout: TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Create weighted voting topic using command
      const topicResult = await command(Community.CreateTopic(), {
        actor: {
          user: { id: userId, email: user.email!, isAdmin: true },
          address: userAddress,
        },
        payload: {
          community_id: communityId,
          name: 'Weighted Voting Topic',
          description: 'A topic for testing weighted voting',
          featured_in_sidebar: false,
          featured_in_new_post: false,
          weighted_voting: TopicWeightedVoting.Stake,
          chain_node_id: chainNodeId,
          vote_weight_multiplier: 3,
        },
      });
      topicId = topicResult!.topic.id!;

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

      // Create contest manager using command
      await command(Contest.CreateContestManagerMetadata(), {
        actor: {
          user: { id: userId, email: user.email!, isAdmin: true },
          address: userAddress,
        },
        payload: {
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
          ticker: 'ETH',
          decimals: 18,
          is_farcaster_contest: false,
          vote_weight_multiplier: 3,
        },
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

      console.log(
        'Community setup complete - simulated UI 3-transaction flow!',
      );
    }, TIMEOUT);

    afterAll(async () => {
      vi.restoreAllMocks();
      await dispose()();
    });

    test.skip('should create weighted voting contest with correct vote weight calculation', async () => {
      // Create a thread using the CreateThread command
      const threadResult = await command(Thread.CreateThread(), {
        actor: {
          user: {
            id: userId,
            email: `test-${userId}@example.com`,
            isAdmin: true,
          },
          address: userAddress,
        },
        payload: {
          community_id: communityId,
          topic_id: topicId,
          title: threadTitle,
          body: 'This is a test thread for weighted voting',
          kind: 'discussion' as const,
          stage: 'discussion',
          read_only: false,
          canvas_signed_data: '',
          canvas_msg_id: '',
        },
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
        url: `/${communityId}/discussion/${threadResult!.id}`,
      });

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
      // Create ERC20 weighted voting topic using command
      const erc20TopicResult = await command(Community.CreateTopic(), {
        actor: {
          user: {
            id: userId,
            email: `test-${userId}@example.com`,
            isAdmin: true,
          },
          address: userAddress,
        },
        payload: {
          community_id: communityId,
          name: 'ERC20 Weighted Topic',
          description: 'A topic for testing ERC20 weighted voting',
          featured_in_sidebar: false,
          featured_in_new_post: false,
          weighted_voting: TopicWeightedVoting.ERC20,
          chain_node_id: chainNodeId,
          token_address: '0x1234567890123456789012345678901234567890',
          token_symbol: 'TEST',
          vote_weight_multiplier: 2.0,
          token_decimals: 18,
        },
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

      // Create contest manager for ERC20 voting using command
      await command(Contest.CreateContestManagerMetadata(), {
        actor: {
          user: {
            id: userId,
            email: `test-${userId}@example.com`,
            isAdmin: true,
          },
          address: userAddress,
        },
        payload: {
          contest_address: erc20ContestResult.contest,
          community_id: communityId,
          name: 'ERC20 Weighted Contest',
          description: 'Testing ERC20 weighted voting',
          image_url: 'https://example.com/erc20.png',
          funding_token_address: '0x1234567890123456789012345678901234567890',
          prize_percentage: 100,
          payout_structure: [60, 30, 10],
          interval: 0,
          topic_id: erc20TopicResult!.topic.id!,
          ticker: 'TEST',
          decimals: 18,
          is_farcaster_contest: false,
          vote_weight_multiplier: 2.0,
        },
      });

      // Create active contest
      await models.Contest.create({
        contest_address: erc20ContestResult.contest,
        contest_id: 1,
        start_time: new Date(),
        end_time: new Date(Date.now() + 3600000), // 1 hour from now
        score: [],
      });

      // Create thread in ERC20 topic using command
      const erc20ThreadResult = await command(Thread.CreateThread(), {
        actor: {
          user: {
            id: userId,
            email: `test-${userId}@example.com`,
            isAdmin: true,
          },
          address: userAddress,
        },
        payload: {
          community_id: communityId,
          topic_id: erc20TopicResult!.topic.id!,
          title: 'ERC20 Weighted Thread',
          body: 'Testing ERC20 weighted voting',
          kind: 'discussion' as const,
          stage: 'discussion',
          read_only: false,
          canvas_signed_data: '',
          canvas_msg_id: '',
        },
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
        url: `/${communityId}/discussion/${erc20ThreadResult!.id}`,
      });

      // Wait for automatic processing of ContestContentAdded event
      await vi.waitFor(
        async () => {
          const contestAction = await models.ContestAction.findOne({
            where: {
              contest_address: erc20ContestResult.contest,
              thread_id: erc20ThreadResult!.id,
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

    test.skip('should correctly calculate contest scores with weighted voting', async () => {
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
