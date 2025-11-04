import { Actor, command, dispose } from '@hicommonwealth/core';
import { BalanceSourceType, GatedActionEnum } from '@hicommonwealth/shared';
import Chance from 'chance';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateComment } from '../../src/aggregates/comment';
import { CreateGroup } from '../../src/aggregates/community';
import { CreateThread } from '../../src/aggregates/thread';
import { models } from '../../src/database';
import { NonMember } from '../../src/middleware/errors';
import { getBotUser } from '../../src/utils/botUser';
import { seedCommunity } from '../utils/community-seeder';

const chance = new Chance();

describe('Bot user permissions in gated topics', () => {
  let community_id: string;
  let topic_id: number;
  let admin: Actor;
  let regularUser: Actor;
  let botActor: Actor;
  let thread_id: number;

  beforeAll(async () => {
    // Create the enum type if it doesn't exist (required for GroupGatedActions)
    await models.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_GroupGatedActions_gated_actions') THEN
          CREATE TYPE "enum_GroupGatedActions_gated_actions" AS ENUM (
            'CREATE_THREAD',
            'CREATE_COMMENT',
            'CREATE_THREAD_REACTION',
            'CREATE_COMMENT_REACTION',
            'UPDATE_POLL'
          );
        END IF;
      END
      $$;
    `);

    // Seed a new community with admin and regular member
    const seeded = await seedCommunity({
      id: `bot-gating-test-${chance.word()}`,
      roles: ['admin', 'member'],
    });

    community_id = seeded.community.id!;
    topic_id = seeded.community.topics![0].id!;
    admin = seeded.actors.admin;
    regularUser = seeded.actors.member;

    // Create a group gated by a non-existent ERC20 token
    const fakeTokenAddress = `0x${chance.string({ length: 40, pool: 'abcdef0123456789' })}`;

    const group = await command(CreateGroup(), {
      actor: admin,
      payload: {
        community_id,
        metadata: {
          name: 'Fake Token Holders',
          description: 'Group gated by a non-existent ERC20 token',
          required_requirements: 1,
        },
        requirements: [
          {
            rule: 'threshold',
            data: {
              threshold: '1', // Must have at least 1 token
              source: {
                source_type: BalanceSourceType.ERC20,
                evm_chain_id: seeded.node.eth_chain_id!,
                contract_address: fakeTokenAddress,
              },
            },
          },
        ],
        topics: [
          {
            id: topic_id,
            permissions: [GatedActionEnum.CREATE_COMMENT],
            is_private: false,
          },
        ],
      },
    });

    expect(group).toBeDefined();
    expect(group?.groups?.[0]?.id).toBeDefined();

    // Create a thread in the gated topic
    const thread = await command(CreateThread(), {
      actor: admin,
      payload: {
        community_id,
        topic_id,
        title: 'Test thread in gated topic',
        body: 'This thread is in a topic gated by a fake ERC20 token',
        kind: 'discussion',
        stage: '',
        read_only: false,
      },
    });

    expect(thread).toBeDefined();
    thread_id = thread!.id!;

    // Set up the bot user for testing
    const botUserAddress = process.env.AI_BOT_USER_ADDRESS;
    if (!botUserAddress) {
      throw new Error('AI_BOT_USER_ADDRESS environment variable is not set');
    }

    // Check if bot user exists, create if needed
    let existingBotUser = await models.User.findOne({
      where: { email: 'ai-bot@common.xyz' },
      include: [
        {
          model: models.Address,
          where: { community_id: community_id },
          required: false,
        },
      ],
    });

    if (!existingBotUser) {
      existingBotUser = await models.User.create({
        email: 'ai-bot@common.xyz',
        emailVerified: true,
        isAdmin: false,
        profile: {},
        tier: 0,
      });

      await models.Address.create({
        user_id: existingBotUser.id,
        address: botUserAddress,
        community_id: community_id,
        verified: new Date(),
        ghost_address: false,
        is_banned: false,
        role: 'member',
        verification_token: '1234567890',
      });
    } else if (existingBotUser.Addresses?.length === 0) {
      // Bot user exists but doesn't have an address in this community
      await models.Address.create({
        user_id: existingBotUser.id,
        address: botUserAddress,
        community_id: community_id,
        verified: new Date(),
        ghost_address: false,
        is_banned: false,
        role: 'member',
        verification_token: '1234567890',
      });
    }

    // Get the bot user to create bot actor
    const botUser = await getBotUser();
    if (!botUser) {
      throw new Error('Bot user not configured for testing');
    }

    botActor = {
      user: {
        id: botUser.user.id!,
        email: botUser.user.email!,
      },
      address: botUser.address.address,
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should prevent regular user from posting a comment in the gated topic', async () => {
    // Attempt to create a comment as a regular user
    // This should fail because the user doesn't have the required ERC20 token
    await expect(
      command(CreateComment(), {
        actor: regularUser,
        payload: {
          thread_id,
          body: 'Regular user comment - should fail',
        },
      }),
    ).rejects.toThrow(NonMember);
  });

  it('should allow bot user to post a comment in the gated topic', async () => {
    // Bot user should be able to comment despite the topic being gated
    const comment = await command(CreateComment(), {
      actor: botActor,
      payload: {
        thread_id,
        body: 'Bot user comment in gated topic - should succeed',
      },
    });

    expect(comment).toBeDefined();
    expect(comment?.id).toBeDefined();
    expect(comment?.body).toBe(
      'Bot user comment in gated topic - should succeed',
    );

    // Verify the comment was created in the database
    const dbComment = await models.Comment.findOne({
      where: { id: comment!.id },
    });

    expect(dbComment).toBeDefined();
    expect(dbComment?.body).toBe(
      'Bot user comment in gated topic - should succeed',
    );
  });

  it('should confirm the regular user still cannot post after bot posts', async () => {
    // Verify that the regular user is still blocked even after bot successfully posts
    await expect(
      command(CreateComment(), {
        actor: regularUser,
        payload: {
          thread_id,
          body: 'Regular user second attempt - should still fail',
        },
      }),
    ).rejects.toThrow(NonMember);
  });

  it('should allow bot user to post multiple comments in the gated topic', async () => {
    // Test that bot can post multiple times
    const comment1 = await command(CreateComment(), {
      actor: botActor,
      payload: {
        thread_id,
        body: 'Bot comment #2',
      },
    });

    const comment2 = await command(CreateComment(), {
      actor: botActor,
      payload: {
        thread_id,
        body: 'Bot comment #3',
      },
    });

    expect(comment1?.id).toBeDefined();
    expect(comment2?.id).toBeDefined();
    expect(comment1?.id).not.toBe(comment2?.id);
  });
});
