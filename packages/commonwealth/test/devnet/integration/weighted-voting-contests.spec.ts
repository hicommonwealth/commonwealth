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
import * as solc from 'solc';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import Web3 from 'web3';
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

const deployERC20Token = async (
  web3: Web3,
  name: string,
  symbol: string,
  decimals: number,
  initialSupply: number,
): Promise<{
  contractAddress: string;
  transactionHash: string;
  contract: any;
  abi: any;
}> => {
  // Hardcoded ERC20 Solidity contract code
  const solidityCode = `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;

    contract TestERC20Token {
        string public name;
        string public symbol;
        uint8 public decimals;
        uint256 public totalSupply;

        mapping(address => uint256) public balanceOf;
        mapping(address => mapping(address => uint256)) public allowance;

        event Transfer(address indexed from, address indexed to, uint256 value);
        event Approval(address indexed owner, address indexed spender, uint256 value);

        constructor(
            string memory _name,
            string memory _symbol,
            uint8 _decimals,
            uint256 _initialSupply
        ) {
            name = _name;
            symbol = _symbol;
            decimals = _decimals;
            totalSupply = _initialSupply * 10**_decimals;
            balanceOf[msg.sender] = totalSupply;
            emit Transfer(address(0), msg.sender, totalSupply);
        }

        function transfer(address to, uint256 value) public returns (bool) {
            require(balanceOf[msg.sender] >= value, "Insufficient balance");
            balanceOf[msg.sender] -= value;
            balanceOf[to] += value;
            emit Transfer(msg.sender, to, value);
            return true;
        }

        function approve(address spender, uint256 value) public returns (bool) {
            allowance[msg.sender][spender] = value;
            emit Approval(msg.sender, spender, value);
            return true;
        }

        function transferFrom(address from, address to, uint256 value) public returns (bool) {
            require(balanceOf[from] >= value, "Insufficient balance");
            require(allowance[from][msg.sender] >= value, "Insufficient allowance");
            balanceOf[from] -= value;
            balanceOf[to] += value;
            allowance[from][msg.sender] -= value;
            emit Transfer(from, to, value);
            return true;
        }

        function mint(address to, uint256 amount) public {
            totalSupply += amount;
            balanceOf[to] += amount;
            emit Transfer(address(0), to, amount);
        }
    }
  `;

  // Prepare compilation input
  const input = {
    language: 'Solidity',
    sources: {
      'TestERC20Token.sol': {
        content: solidityCode,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  };

  // Compile the contract
  const compilationResult = JSON.parse(solc.compile(JSON.stringify(input)));

  // Check for compilation errors
  if (compilationResult.errors) {
    const errors = compilationResult.errors.filter(
      (error: any) => error.severity === 'error',
    );
    if (errors.length > 0) {
      throw new Error(
        `Compilation failed: ${errors.map((e: any) => e.message).join(', ')}`,
      );
    }
  }

  // Extract bytecode and ABI
  const contract =
    compilationResult.contracts['TestERC20Token.sol']['TestERC20Token'];
  const bytecode = '0x' + contract.evm.bytecode.object;
  const abi = contract.abi;

  // Get the first account to deploy from
  const accounts = await web3.eth.getAccounts();
  const deployerAccount = accounts[0];

  // Create contract instance
  const contractInstance = new web3.eth.Contract(abi);

  // Deploy the contract
  return new Promise((resolve, reject) => {
    contractInstance
      .deploy({
        data: bytecode,
        arguments: [name, symbol, decimals, initialSupply],
      })
      .send({
        from: deployerAccount,
        gas: '3000000', // Set a reasonable gas limit
      })
      .on('receipt', async (receipt) => {
        try {
          const deployedContract = new web3.eth.Contract(
            abi,
            receipt.contractAddress!,
          );

          // Mint 10^18 additional tokens to the deployer
          const mintAmount = web3.utils.toWei('1', 'ether'); // 10^18 tokens
          await deployedContract.methods
            .mint(deployerAccount, mintAmount)
            .send({
              from: deployerAccount,
              gas: '300000',
            });

          resolve({
            contractAddress: receipt.contractAddress!,
            transactionHash: receipt.transactionHash,
            contract: deployedContract,
            abi: abi,
          });
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

describe(
  'Weighted Voting Contests E2E Integration Test',
  () => {
    let namespaceFactory: NamespaceFactory;
    let communityStake: CommunityStake;
    let anvilAccounts: any;
    let web3: any;

    // Test data
    const communityId = 'test-weighted-community';
    const namespaceName = 'test-' + Date.now();
    const addressId = 1001;
    const userId = 1001;
    const threadId = 2001;
    const threadTitle = 'Test Weighted Voting Thread';
    let user: User;
    let contestAddress: string;
    let contestId = 0;
    let chainNodeId: number;
    let privateKey: string;
    const stakeAmount = 5;

    let userAddress = '';
    let testToken: {
      contractAddress: string;
      transactionHash: string;
      contract: any;
      abi: any;
    } | null = null;

    beforeAll(async () => {
      // Setup Commonwealth E2E environment with relayer and event processing
      const setupResult = await setupCommonwealthE2E();

      web3 = setupResult.web3;
      anvilAccounts = setupResult.anvilAccounts;
      privateKey = anvilAccounts[0].privateKey;
      userAddress = web3.eth.accounts.privateKeyToAccount(privateKey).address;

      namespaceFactory = new NamespaceFactory(web3);
      communityStake = new CommunityStake(web3);

      // Use the ChainNode created by setupCommonwealthE2E (setupAnvil)
      const chainNode = setupResult.chain;
      if (!chainNode) {
        throw new Error(
          'Anvil ChainNode not found - setupCommonwealthE2E may have failed',
        );
      }
      chainNodeId = chainNode.id!;

      console.log('deploying ERC20 for voting token');
      // Deploy ERC20 for voting token
      testToken = await deployERC20Token(web3, 'Test Token', 'TT', 18, 10 ** 6);

      console.log('creating test user');
      // Create test user with unique ID to avoid conflicts
      const u = await models.User.create({
        id: userId,
        email: `test-${userId}@example.com`,
        isAdmin: true,
        profile: {},
        tier: UserTierMap.ManuallyVerified,
      });
      user = u as unknown as User;

      console.log('creating base community');
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

      let namespaceAddress: string | null = null;

      // wait for namespace to be deployed
      await vi.waitFor(
        async () => {
          namespaceAddress =
            await namespaceFactory.getNamespaceAddress(namespaceName);
          expect(namespaceAddress).toBeTruthy();
        },
        {
          timeout: TX_TIMEOUT,
          interval: INTERVAL,
        },
      );

      console.log('updating community with namespace address');
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

      console.log('creating factory contract instance');
      // Create contract instance using web3 from testing setup
      const factoryContract = new web3.eth.Contract(
        NamespaceFactoryAbi,
        factoryAddress,
      );

      console.log('calling configureNominationNominator');
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

      console.log('waiting for verification to be configured');
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

      console.log('creating nomination contract instance');
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

      console.log('calling nominateNominator');
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

      console.log('waiting for MintVerificationToken event to be processed');
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

      console.log('configuring community stakes');
      // Configure community stakes for testing
      const { block } = await namespaceFactory.configureCommunityStakes(
        namespaceName,
        commonProtocol.STAKE_ID,
      );

      console.log('waiting for block to be mined');
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

      console.log('setting community stake');
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

      console.log('waiting for CommunityStake to be created');
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

      console.log('buying stake for voting weight');
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
      console.log('creating topic');
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

      console.log('deploying contest');
      // Deploy contest
      try {
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
      } catch (err) {
        console.error(err);
        throw err;
      }

      console.log('creating contest manager');
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
          expect(contestAction!.actor_address).toBe(userAddress);
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
          user: { id: userId, email: user.email!, isAdmin: true },
          address: userAddress,
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
          token_address: testToken!.contractAddress,
          token_symbol: 'TT',
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
        testToken!.contractAddress, // ERC20 token address
        10, // voter share
        testToken!.contractAddress, // exchange token
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
          funding_token_address: testToken!.contractAddress,
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
          contractAddress: testToken!.contractAddress,
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
  },
  TIMEOUT,
);
