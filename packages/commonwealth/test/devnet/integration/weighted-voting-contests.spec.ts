import { dispose, User } from '@hicommonwealth/core';
import { models, tokenBalanceCache } from '@hicommonwealth/model';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import {
  BalanceSourceType,
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

const TIMEOUT = 60_000 * 4;
const TX_TIMEOUT = 10_000;
const INTERVAL = 1_000;
const CMN_TOKEN_ADDRESS = '0x429ae85883f82203D736e8fc203A455990745ca1';

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
    const threadId = 2001;
    const threadTitle = 'Test Weighted Voting Thread';
    let user: User;
    let contestAddress: string;
    let contestId = 0;
    let chainNodeId: number;
    let privateKey: string;
    let rpcUrl: string;
    const stakeAmount = 5;

    let userAddress = '';
    const mintAmount = 10 ** 6;

    beforeAll(async () => {
      // Setup Commonwealth E2E environment with relayer and event processing
      const setupResult = await setupCommonwealthE2E();

      web3 = setupResult.web3;
      anvilAccounts = setupResult.anvilAccounts;
      privateKey = anvilAccounts[0].privateKey;
      userAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;

      // Set rpcUrl based on the anvil container
      const anvilPort = setupResult.anvilContainer!.getMappedPort(8545);
      rpcUrl = `http://localhost:${anvilPort}`;

      namespaceFactory = new NamespaceFactory(web3);
      communityStake = new CommunityStake(web3);

      // Use the ChainNode created by setupCommonwealthE2E (setupAnvil)
      const chainNode = await models.ChainNode.scope('withPrivateData').findOne(
        {
          where: { eth_chain_id: 31337 },
        },
      );
      if (!chainNode) {
        throw new Error(
          'Anvil ChainNode not found - setupCommonwealthE2E may have failed',
        );
      }
      chainNodeId = chainNode.id!;

      // TODO: deploy ERC20 for funding token

      // Create test user with unique ID to avoid conflicts
      const u = await models.User.create({
        id: userId,
        email: `test-${userId}@example.com`,
        isAdmin: true,
        profile: {},
        tier: UserTierMap.ManuallyVerified,
      });
      user = u as unknown as User;

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
          timeout: TX_TIMEOUT,
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
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      console.log(
        'Community setup complete - follows UI flow: Create → Deploy → Configure → Mint',
      );

      // Configure community stakes for testing
      const { block } = await namespaceFactory.configureCommunityStakes(
        namespaceName,
        commonProtocol.STAKE_ID,
      );

      // Wait for the block to be mined
      await vi.waitFor(
        async () => {
          const blockNumber = await web3.eth.getBlockNumber();
          expect(blockNumber).toBeGreaterThanOrEqual(block);
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Set community stake
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
          console.log('\n\nWaiting for CommunityStake to be created\n\n');
          const communityStake = await models.CommunityStake.findOne({
            where: {
              community_id: communityId,
              stake_id: 2,
            },
          });
          expect(communityStake).toBeTruthy();
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Buy some stake for voting weight
      await communityStake.buyStake(namespaceName, 2, stakeAmount); // Buy 5 units of stake

      console.log(
        'Community setup complete - simulated UI 3-transaction flow!',
      );
    }, TIMEOUT);

    afterAll(async () => {
      vi.restoreAllMocks();
      await dispose()();
    });

    test('should handle staked contest with weighted voting', async () => {
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
      const stakeTopicId = topicResult!.topic.id!;

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
          topic_id: stakeTopicId,
          ticker: 'ETH',
          decimals: 18,
          is_farcaster_contest: false,
          vote_weight_multiplier: 3,
        },
      });

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
          topic_id: stakeTopicId,
          title: threadTitle,
          body: 'This is a test thread for weighted voting',
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
              contest_address: contestAddress,
              thread_id: threadResult!.id,
              action: 'added',
            },
          });
          expect(contestAction).toBeTruthy();
          expect(contestAction!.actor_address).toBe(userAddress);
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Make upvote on thread
      await command(Thread.CreateThreadReaction(), {
        actor: {
          user: { id: userId, email: user.email!, isAdmin: true },
          address: userAddress,
        },
        payload: {
          thread_id: threadResult!.id!,
          reaction: 'like',
        },
      });

      // Wait for automatic processing of ContestContentUpvoted event
      await vi.waitFor(
        async () => {
          const voteAction = await models.ContestAction.findOne({
            where: {
              contest_address: contestAddress,
              actor_address: userAddress,
              action: 'upvoted',
            },
          });
          expect(voteAction).toBeTruthy();
          expect(voteAction!.calculated_voting_weight).not.toBeNull();
          expect(BigInt(voteAction!.calculated_voting_weight!)).toBe(
            BigInt(stakeAmount),
          );
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );
    });

    test('should handle ERC20 weighted voting in contests', async () => {
      // Create ERC20 weighted voting topic using command
      const erc20TopicResult = await command(Community.CreateTopic(), {
        actor: {
          user: { id: userId, email: user.email!, isAdmin: true },
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
          token_address: CMN_TOKEN_ADDRESS, // CMD Test Token
          token_symbol: 'CMN',
          vote_weight_multiplier: 2,
          token_decimals: 18,
        },
      });
      const erc20TopicId = erc20TopicResult!.topic.id!;

      // Deploy contest
      const erc20ContestResult = await namespaceFactory.newERC20Contest(
        namespaceName,
        3600, // 1 hour duration
        [60, 30, 10], // winner shares: 60%, 30%, 10%
        CMN_TOKEN_ADDRESS, // ERC20 token address
        10, // voter share
        CMN_TOKEN_ADDRESS, // exchange token
      );
      const erc20ContestAddress = erc20ContestResult.contest;

      const voteWeightMultiplier = 12;

      // Create contest manager using command
      await command(Contest.CreateContestManagerMetadata(), {
        actor: {
          user: { id: userId, email: user.email!, isAdmin: true },
          address: userAddress,
        },
        payload: {
          contest_address: erc20ContestAddress,
          community_id: communityId,
          name: 'Test ERC20 Contest',
          description: 'Testing ERC20 weighted voting in contests',
          image_url: 'https://example.com/erc20.png',
          funding_token_address: CMN_TOKEN_ADDRESS,
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
            id: userId,
            email: `test-${userId}@example.com`,
            isAdmin: true,
          },
          address: userAddress,
        },
        payload: {
          community_id: communityId,
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
          expect(contestAction!.actor_address).toBe(userAddress);
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      // Get token balance of user via tokenBalanceCache
      const tokenBalances = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.ERC20,
        addresses: [userAddress],
        sourceOptions: {
          evmChainId: 31337, // Use the Anvil chain ID
          contractAddress: CMN_TOKEN_ADDRESS,
        },
        cacheRefresh: true,
      });
      const tokenBalance = tokenBalances[userAddress] || '0';
      console.log('Token balance:', tokenBalance);

      // Make upvote on thread
      await command(Thread.CreateThreadReaction(), {
        actor: {
          user: { id: userId, email: user.email!, isAdmin: true },
          address: userAddress,
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
              actor_address: userAddress,
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
          actor_address: userAddress,
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
