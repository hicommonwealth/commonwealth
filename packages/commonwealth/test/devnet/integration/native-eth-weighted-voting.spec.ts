import { command } from '@hicommonwealth/core';
import { calculateVoteWeight } from '@hicommonwealth/evm-protocols';
import {
  Community,
  Thread,
  middleware,
  models,
  tester,
} from '@hicommonwealth/model';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { UserTierMap, ZERO_ADDRESS } from '@hicommonwealth/shared';
import { describe, expect, test, vi } from 'vitest';
import { setupCommonwealthE2E } from './integrationUtils/mainSetup';

const { seed } = tester;
const { RefreshWeightedVotes } = Community;
const { systemActor } = middleware;

describe('Native ETH weighted voting lifecycle', () => {
  test(
    'should recalculate vote weights after ETH balance changes',
    async () => {
      const { web3, anvilAccounts, chain } = await setupCommonwealthE2E();

      // Get initial ETH balance
      const initialBalance = await web3.eth.getBalance(
        anvilAccounts[0].address,
      );
      console.log(
        `Initial ETH balance: ${web3.utils.fromWei(initialBalance, 'ether')} ETH`,
      );

      // Seed community
      const [community] = await seed('Community', {
        name: 'Test ETH Community',
        description: 'Community for native ETH weighted voting test',
        chain_node_id: chain!.id,
        environment: 'test',
        profile_count: 1,
      });

      // Create a topic with native ETH weighted voting
      const voteWeightMultiplier = 1;
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

      // Create a user and address directly
      const user = await models.User.create({
        email: 'test@example.com',
        emailVerified: true,
        tier: UserTierMap.ManuallyVerified,
        profile: {
          name: 'Test User',
          bio: 'Test bio',
          avatar_url: 'test.jpg',
        },
      });

      const address = await models.Address.create({
        user_id: user.id,
        community_id: community!.id!,
        address: anvilAccounts[0].address,
        role: 'admin',
        hex: anvilAccounts[0].address,
        ghost_address: false,
        is_banned: false,
        verification_token: '123456',
      });

      // Create a thread directly
      const thread = await models.Thread.create({
        body: 'Test thread for native ETH voting',
        community_id: community!.id!,
        topic_id: topic.id!,
        title: 'Native ETH Voting Test Thread',
        kind: 'discussion',
        stage: '',
        read_only: false,
        address_id: address.id!,
        created_by: address.address,
      });

      // Calculate expected initial vote weight based on initial balance
      const expectedInitialWeight = calculateVoteWeight(
        initialBalance.toString(),
        voteWeightMultiplier,
      )!;

      // Create an actor for the address
      const actor = {
        user: {
          id: user.id,
          email: user.email!,
        },
        address: address.address,
      };

      // CreateThreadReaction
      const initialReaction = await command(Thread.CreateThreadReaction(), {
        payload: {
          thread_id: thread.id!,
          thread_msg_id: thread.canvas_msg_id,
          reaction: 'like',
        },
        actor,
      });

      console.log(
        `Initial reaction weight: ${initialReaction.calculated_voting_weight}`,
      );
      console.log(`Expected initial weight: ${expectedInitialWeight}`);

      // Verify initial vote weight matches exactly what we calculated
      expect(initialReaction.calculated_voting_weight).toBe(
        expectedInitialWeight.toString(),
      );

      // Transfer some ETH to another address to reduce balance
      const transferAmount = web3.utils.toWei('1', 'ether');
      await web3.eth.sendTransaction({
        from: anvilAccounts[0].address,
        to: anvilAccounts[1].address,
        value: transferAmount,
        gas: 21000,
      });

      // Check new balance
      const newBalance = await web3.eth.getBalance(anvilAccounts[0].address);
      console.log(
        `New ETH balance after transfer: ${web3.utils.fromWei(newBalance, 'ether')} ETH`,
      );

      // Calculate expected new vote weight based on new balance
      const expectedNewWeight = calculateVoteWeight(
        newBalance.toString(),
        voteWeightMultiplier,
      )!;

      console.log(`Expected new weight: ${expectedNewWeight}`);

      // Verify balance decreased
      expect(BigInt(newBalance)).toBeLessThan(BigInt(initialBalance));

      // Execute RefreshWeightedVotes command
      await command(RefreshWeightedVotes(), {
        payload: {
          topic_id: topic.id!,
          community_id: community!.id!,
        },
        actor: systemActor({}),
      });

      // Wait for the async recalculation to complete
      await vi.waitFor(
        async () => {
          const updatedReaction = await models.Reaction.findByPk(
            initialReaction.id,
          );
          const updatedWeight = updatedReaction!.calculated_voting_weight;

          console.log(`Updated reaction weight: ${updatedWeight}`);

          // Verify that the vote weight was recalculated to exactly match the new balance
          expect(updatedWeight).toBe(expectedNewWeight.toString());
        },
        {
          timeout: 30000,
          interval: 1000,
        },
      );

      // Also verify the thread's reaction_weights_sum was updated
      const updatedThread = await models.Thread.findByPk(thread.id);
      const threadWeightSum = updatedThread!.reaction_weights_sum;

      console.log(`Thread reaction weights sum: ${threadWeightSum}`);

      // Verify the thread weight sum matches the updated reaction weight exactly
      expect(threadWeightSum).toBe(expectedNewWeight.toString());

      // Verify the final reaction weight matches our calculation
      const finalReaction = await models.Reaction.findByPk(initialReaction.id);
      expect(finalReaction!.calculated_voting_weight).toBe(
        expectedNewWeight.toString(),
      );

      // Verify the weights changed as expected
      expect(expectedNewWeight).toBeLessThan(expectedInitialWeight);
      expect(expectedNewWeight).toBeGreaterThan(BigInt(0));
    },
    { timeout: 120000 },
  );
});
