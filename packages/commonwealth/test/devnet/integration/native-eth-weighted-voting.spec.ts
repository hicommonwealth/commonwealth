import { command } from '@hicommonwealth/core';
import { calculateVoteWeight } from '@hicommonwealth/evm-protocols';
import {
  ChainNodeAttributes,
  Comment,
  Community,
  CommunityAttributes,
  Thread,
  TopicAttributes,
  UserAttributes,
  models,
  tester,
} from '@hicommonwealth/model';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { UserTierMap, ZERO_ADDRESS } from '@hicommonwealth/shared';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import Web3 from 'web3';
import { setupCommonwealthE2E } from './integrationUtils/mainSetup';

const { seed } = tester;
const { RefreshWeightedVotes } = Community;

describe('Native ETH weighted voting lifecycle', () => {
  const voteWeightMultiplier = 1;

  let _web3: Web3;
  let _anvilAccounts: { address: string; privateKey: string }[];
  let _chain: ChainNodeAttributes;
  let _user1: UserAttributes;
  let _user2: UserAttributes;
  let _community: CommunityAttributes;
  let _topic: TopicAttributes;
  let _memberActor: {
    user: {
      id: number;
      email: string;
    };
    address: string;
  };
  let _adminActor: {
    user: {
      id: number;
      email: string;
    };
    address: string;
  };

  beforeAll(async () => {
    const { web3, anvilAccounts, chain } = await setupCommonwealthE2E();
    _web3 = web3;
    _anvilAccounts = anvilAccounts;
    _chain = chain!;

    _user1 = await models.User.create({
      email: 'test@example.com',
      emailVerified: true,
      tier: UserTierMap.ManuallyVerified,
      profile: {
        name: 'Test User',
        bio: 'Test bio',
        avatar_url: 'test.jpg',
      },
    });

    _user2 = await models.User.create({
      email: 'test2@example.com',
      emailVerified: true,
      tier: UserTierMap.ManuallyVerified,
      profile: {
        name: 'Test User 2',
        bio: 'Test bio',
        avatar_url: 'test.jpg',
      },
    });

    // Seed community
    const [community] = await seed('Community', {
      name: 'Test ETH Community',
      description: 'Community for native ETH weighted voting test',
      chain_node_id: chain!.id,
      environment: 'test',
      profile_count: 1,
      active: true,
      Addresses: [
        {
          user_id: _user1.id,
          role: 'admin',
          address: anvilAccounts[0].address,
          hex: anvilAccounts[0].address,
          ghost_address: false,
          is_banned: false,
          verification_token: '123456',
          verified: new Date(),
        },
        {
          user_id: _user2.id,
          role: 'member',
          address: anvilAccounts[1].address,
          hex: anvilAccounts[1].address,
          ghost_address: false,
          is_banned: false,
          verification_token: '123456',
          verified: new Date(),
        },
      ],
    });
    _community = community! as CommunityAttributes;

    // Create a topic with native ETH weighted voting

    const topic = await models.Topic.create({
      community_id: community!.id!,
      name: 'Native ETH Voting Topic',
      description: 'Topic for testing native ETH weighted voting',
      featured_in_sidebar: false,
      featured_in_new_post: false,
      weighted_voting: TopicWeightedVoting.ERC20,
      token_address: ZERO_ADDRESS,
      token_symbol: 'ETH',
      vote_weight_multiplier: voteWeightMultiplier,
      chain_node_id: chain!.id,
    });
    _topic = topic!;

    _adminActor = {
      user: {
        id: _user1.id!,
        email: _user1.email!,
      },
      address: community!.Addresses![0].address!,
    };
    _memberActor = {
      user: {
        id: _user2.id!,
        email: _user2.email!,
      },
      address: community!.Addresses![1].address!,
    };
  });

  test(
    'should recalculate vote weights for threads and comments after ETH balance changes',
    async () => {
      // Get initial ETH balance
      const initialBalance = await _web3.eth.getBalance(
        _anvilAccounts[1].address,
      );

      // Create a thread using command
      const thread = await command(Thread.CreateThread(), {
        payload: {
          body: 'Test thread for native ETH voting',
          community_id: _community.id!,
          topic_id: _topic.id!,
          title: 'Native ETH Voting Test Thread',
          kind: 'discussion',
          stage: '',
          read_only: false,
        },
        actor: _memberActor,
      });

      // Create a comment on the thread
      const comment = await command(Comment.CreateComment(), {
        payload: {
          thread_id: thread.id!,
          body: 'Test comment for native ETH voting',
        },
        actor: _memberActor,
      });

      // Create a thread reaction
      const threadReaction = await command(Thread.CreateThreadReaction(), {
        payload: {
          thread_id: thread.id!,
          thread_msg_id: thread.canvas_msg_id,
          reaction: 'like',
        },
        actor: _memberActor,
      });

      // Create a comment reaction
      const commentReaction = await command(Comment.CreateCommentReaction(), {
        payload: {
          comment_id: comment.id!,
          reaction: 'like',
        },
        actor: _memberActor,
      });

      // Thread reaction vote weight should match the initial balance
      const expectedInitialWeight = calculateVoteWeight(
        initialBalance.toString(),
        voteWeightMultiplier,
      )!;
      expect(threadReaction.calculated_voting_weight).toBe(
        expectedInitialWeight.toString(),
      );

      // Comment reaction vote weight should match the initial balance
      const expectedInitialCommentWeight = calculateVoteWeight(
        initialBalance.toString(),
        voteWeightMultiplier,
      )!;
      expect(commentReaction.calculated_voting_weight).toBe(
        expectedInitialCommentWeight.toString(),
      );

      // Transfer some ETH to another address to reduce balance
      const transferAmount = _web3.utils.toWei('1', 'ether');
      const transaction = await _web3.eth.sendTransaction({
        from: _memberActor.address,
        to: ZERO_ADDRESS,
        value: transferAmount,
        gas: 21000,
      });

      // Wait for transaction to be mined
      await vi.waitFor(
        async () => {
          const receipt = await _web3.eth.getTransactionReceipt(
            transaction.transactionHash,
          );
          if (receipt && receipt.status) {
            return receipt;
          }
          throw new Error('Transaction not yet mined');
        },
        { timeout: 10_000, interval: 1000 },
      );

      // Check new balance
      const newBalance = await _web3.eth.getBalance(_memberActor.address);

      // Verify balance decreased
      expect(BigInt(newBalance)).toBeLessThan(BigInt(initialBalance));

      // Calculate expected new vote weight based on new balance
      const expectedNewWeight = calculateVoteWeight(
        newBalance.toString(),
        voteWeightMultiplier,
      )!;

      // Execute RefreshWeightedVotes command
      await command(RefreshWeightedVotes(), {
        payload: {
          topic_id: _topic.id!,
          community_id: _community.id!,
        },
        actor: _adminActor,
      });

      // Verify that the vote weight was recalculated to exactly match the new balance
      await vi.waitFor(
        async () => {
          const updatedReaction = await models.Reaction.findByPk(
            threadReaction.id,
          );
          const updatedWeight = updatedReaction!.calculated_voting_weight;
          expect(updatedWeight).toBe(expectedNewWeight.toString());
        },
        {
          timeout: 10_000,
          interval: 1000,
        },
      );

      // Verify the thread weight sum matches the updated reaction weight exactly
      const updatedThread = await models.Thread.findByPk(thread.id);
      const threadWeightSum = updatedThread!.reaction_weights_sum;
      expect(threadWeightSum).toBe(expectedNewWeight.toString());

      // Verify the comment weight sum matches the updated reaction weight exactly
      const updatedComment = await models.Comment.findByPk(comment.id);
      const commentWeightSum = updatedComment!.reaction_weights_sum;
      expect(commentWeightSum).toBe(expectedNewWeight.toString());
    },
    { timeout: 120_000 },
  );
});
