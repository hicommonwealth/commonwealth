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
  let _user3: UserAttributes;
  let _user4: UserAttributes;
  let _community: CommunityAttributes;
  let _topic: TopicAttributes;
  let _memberActors: {
    user: {
      id: number;
      email: string;
    };
    address: string;
  }[];
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
      email: 'admin@example.com',
      emailVerified: true,
      tier: UserTierMap.ManuallyVerified,
      profile: {
        name: 'Admin User',
        bio: 'Admin bio',
        avatar_url: 'admin.jpg',
      },
    });

    _user2 = await models.User.create({
      email: 'member1@example.com',
      emailVerified: true,
      tier: UserTierMap.ManuallyVerified,
      profile: {
        name: 'Member User 1',
        bio: 'Member bio',
        avatar_url: 'member1.jpg',
      },
    });

    _user3 = await models.User.create({
      email: 'member2@example.com',
      emailVerified: true,
      tier: UserTierMap.ManuallyVerified,
      profile: {
        name: 'Member User 2',
        bio: 'Member bio',
        avatar_url: 'member2.jpg',
      },
    });

    _user4 = await models.User.create({
      email: 'member3@example.com',
      emailVerified: true,
      tier: UserTierMap.ManuallyVerified,
      profile: {
        name: 'Member User 3',
        bio: 'Member bio',
        avatar_url: 'member3.jpg',
      },
    });

    // Seed community
    const [community] = await seed('Community', {
      name: 'Test ETH Community',
      description: 'Community for native ETH weighted voting test',
      chain_node_id: chain!.id,
      environment: 'test',
      profile_count: 4,
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
        {
          user_id: _user3.id,
          role: 'member',
          address: anvilAccounts[2].address,
          hex: anvilAccounts[2].address,
          ghost_address: false,
          is_banned: false,
          verification_token: '123456',
          verified: new Date(),
        },
        {
          user_id: _user4.id,
          role: 'member',
          address: anvilAccounts[3].address,
          hex: anvilAccounts[3].address,
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

    _memberActors = [
      {
        user: {
          id: _user2.id!,
          email: _user2.email!,
        },
        address: community!.Addresses![1].address!,
      },
      {
        user: {
          id: _user3.id!,
          email: _user3.email!,
        },
        address: community!.Addresses![2].address!,
      },
      {
        user: {
          id: _user4.id!,
          email: _user4.email!,
        },
        address: community!.Addresses![3].address!,
      },
    ];
  });

  test(
    'should recalculate vote weights for threads and comments after ETH balance changes',
    async () => {
      // Get initial ETH balances for all member accounts
      const initialBalances = await Promise.all(
        _memberActors.map((_, index) =>
          _web3.eth.getBalance(_anvilAccounts[index + 1].address),
        ),
      );

      // Create a thread using command (using first member)
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
        actor: _memberActors[0],
      });

      // Create a comment on the thread (using first member)
      const comment = await command(Comment.CreateComment(), {
        payload: {
          thread_id: thread.id!,
          body: 'Test comment for native ETH voting',
        },
        actor: _memberActors[0],
      });

      // Create thread reactions from all 3 members
      const threadReactions = await Promise.all(
        _memberActors.map((actor) =>
          command(Thread.CreateThreadReaction(), {
            payload: {
              thread_id: thread.id!,
              thread_msg_id: thread.canvas_msg_id,
              reaction: 'like',
            },
            actor,
          }),
        ),
      );

      // Create comment reactions from all 3 members
      const commentReactions = await Promise.all(
        _memberActors.map((actor) =>
          command(Comment.CreateCommentReaction(), {
            payload: {
              comment_id: comment.id!,
              reaction: 'like',
            },
            actor,
          }),
        ),
      );

      // Calculate expected initial weights for all members
      const expectedInitialWeights = initialBalances.map(
        (balance) =>
          calculateVoteWeight(balance.toString(), voteWeightMultiplier)!,
      );

      // Verify initial vote weights match the initial balances
      threadReactions.forEach((reaction, index) => {
        expect(reaction.calculated_voting_weight).toBe(
          expectedInitialWeights[index].toString(),
        );
      });

      commentReactions.forEach((reaction, index) => {
        expect(reaction.calculated_voting_weight).toBe(
          expectedInitialWeights[index].toString(),
        );
      });

      // Verify initial sum of all weights
      const initialThreadWeightSum = threadReactions.reduce(
        (sum, reaction) => sum + BigInt(reaction.calculated_voting_weight!),
        BigInt(0),
      );
      const initialCommentWeightSum = commentReactions.reduce(
        (sum, reaction) => sum + BigInt(reaction.calculated_voting_weight!),
        BigInt(0),
      );

      await vi.waitFor(
        async () => {
          const updatedThread = await models.Thread.findByPk(thread.id);
          const updatedComment = await models.Comment.findByPk(comment.id);
          expect(updatedThread!.reaction_weights_sum).toBe(
            initialThreadWeightSum.toString(),
          );
          expect(updatedComment!.reaction_weights_sum).toBe(
            initialCommentWeightSum.toString(),
          );
        },
        { timeout: 10_000, interval: 1000 },
      );

      // Transfer some ETH from first member to reduce their balance
      const transferAmount = _web3.utils.toWei('1', 'ether');
      const transaction = await _web3.eth.sendTransaction({
        from: _memberActors[0].address,
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

      // Check new balance for first member
      const newBalance = await _web3.eth.getBalance(_memberActors[0].address);

      // Verify balance decreased for first member
      expect(BigInt(newBalance)).toBeLessThan(BigInt(initialBalances[0]));

      // Calculate expected new vote weight based on new balance for first member
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

      // Verify that the vote weights were recalculated correctly
      await vi.waitFor(
        async () => {
          const updatedThreadReactions = await Promise.all(
            threadReactions.map((reaction) =>
              models.Reaction.findByPk(reaction.id),
            ),
          );

          const updatedCommentReactions = await Promise.all(
            commentReactions.map((reaction) =>
              models.Reaction.findByPk(reaction.id),
            ),
          );

          // First member's weight should be updated to reflect new balance
          expect(updatedThreadReactions[0]!.calculated_voting_weight).toBe(
            expectedNewWeight.toString(),
          );
          expect(updatedCommentReactions[0]!.calculated_voting_weight).toBe(
            expectedNewWeight.toString(),
          );

          // Other members' weights should remain the same
          for (let i = 1; i < _memberActors.length; i++) {
            expect(updatedThreadReactions[i]!.calculated_voting_weight).toBe(
              expectedInitialWeights[i].toString(),
            );
            expect(updatedCommentReactions[i]!.calculated_voting_weight).toBe(
              expectedInitialWeights[i].toString(),
            );
          }
        },
        {
          timeout: 10_000,
          interval: 1000,
        },
      );

      // Calculate expected weight sums
      const expectedThreadWeightSum = (
        BigInt(expectedNewWeight) +
        BigInt(expectedInitialWeights[1]) +
        BigInt(expectedInitialWeights[2])
      ).toString();
      console.log('expectedThreadWeightSum', expectedThreadWeightSum);

      const expectedCommentWeightSum = expectedThreadWeightSum;

      // Verify the thread weight sum matches the sum of all updated reaction weights
      const updatedThread = await models.Thread.findByPk(thread.id);
      expect(updatedThread!.reaction_weights_sum).toBe(expectedThreadWeightSum);

      // Verify the comment weight sum matches the sum of all updated reaction weights
      const updatedComment = await models.Comment.findByPk(comment.id);
      expect(updatedComment!.reaction_weights_sum).toBe(
        expectedCommentWeightSum,
      );
    },
    { timeout: 120_000 },
  );
});
