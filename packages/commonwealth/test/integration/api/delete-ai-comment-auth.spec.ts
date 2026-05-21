import { Actor, dispose } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import * as tester from '@hicommonwealth/model/tester';
import { ChainBase, UserTierMap } from '@hicommonwealth/shared';
import Chance from 'chance';
import jsonwebtoken from 'jsonwebtoken';
import fetch from 'node-fetch';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testServer, TestServer } from '../../../server-test';

const chance = Chance();

describe('Delete AI Comment Authorization', () => {
  let server: TestServer;
  let community_id: string;
  let topic_id: number;
  let thread_id: number;
  let ai_comment_id: number;
  let bot_user_id: number;
  let bot_address_id: number;
  let triggering_user: Actor;
  let other_user: Actor;
  let admin_user: Actor;
  let jwt_triggering: string = '';
  let jwt_other: string = '';
  let jwt_admin: string = '';

  const DeleteComment = async (
    actor: Actor,
    jwt: string,
    comment_id: number,
  ) => {
    const url = `${server.baseUrl}/api/v1/DeleteComment`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        address: actor.address!,
      },
      body: JSON.stringify({
        jwt,
        comment_id,
      }),
    });
    return res;
  };

  beforeAll(async () => {
    server = await testServer();

    // Create bot user and address
    const [bot_user] = await tester.seed('User', {
      profile: { name: 'AI Bot User' },
      tier: UserTierMap.ManuallyVerified,
      email: 'bot@test.com',
      created_at: new Date(),
    });
    bot_user_id = bot_user!.id!;

    // Create triggering user (user who triggered the AI comment)
    const [triggering_user_record] = await tester.seed('User', {
      profile: { name: 'Triggering User' },
      tier: UserTierMap.ManuallyVerified,
      email: 'triggering@test.com',
      created_at: new Date(),
    });

    // Create another regular user
    const [other_user_record] = await tester.seed('User', {
      profile: { name: 'Other User' },
      tier: UserTierMap.ManuallyVerified,
      email: 'other@test.com',
      created_at: new Date(),
    });

    // Create admin user
    const [admin_user_record] = await tester.seed('User', {
      profile: { name: 'Admin User' },
      tier: UserTierMap.ManuallyVerified,
      email: 'admin@test.com',
      created_at: new Date(),
    });

    // Create community with all users as members
    const [community] = await tester.seed('Community', {
      chain_node_id: server.e2eTestEntities.testChainNodes[0].id,
      base: ChainBase.Ethereum,
      active: true,
      lifetime_thread_count: 0,
      profile_count: 1,
      groups: [],
      topics: [{ name: 'delete-ai-comment-test-topic' }],
      Addresses: [
        {
          role: 'member',
          user_id: bot_user_id,
          verified: new Date(),
          address: '0x0000000000000000000000000000000000000AAA',
        },
        {
          role: 'member',
          user_id: triggering_user_record!.id,
          verified: new Date(),
          address: '0x0000000000000000000000000000000000000BBB',
        },
        {
          role: 'member',
          user_id: other_user_record!.id,
          verified: new Date(),
          address: '0x0000000000000000000000000000000000000CCC',
        },
        {
          role: 'admin',
          user_id: admin_user_record!.id,
          verified: new Date(),
          address: '0x0000000000000000000000000000000000000DDD',
        },
      ],
    });

    community_id = community!.id!;
    topic_id = community!.topics!.at(0)!.id!;
    bot_address_id = community?.Addresses?.at(0)?.id!;

    // Set bot user address in config for isBotAddress to work
    config.AI.BOT_USER_ADDRESS = community?.Addresses?.at(0)?.address!;

    // Create a thread
    const [thread] = await tester.seed('Thread', {
      community_id,
      topic_id,
      address_id: community?.Addresses?.at(1)?.id, // created by triggering user
      title: 'Test Thread for AI Comment',
      body: 'Test thread body',
      kind: 'discussion',
      stage: 'discussion',
      read_only: false,
      pinned: false,
      reaction_weights_sum: '0',
    });
    thread_id = thread!.id!;

    // Create an AI comment (comment created by bot user)
    const [ai_comment] = await tester.seed('Comment', {
      thread_id,
      address_id: bot_address_id,
      body: 'This is an AI generated comment',
      reaction_weights_sum: '0',
    });
    ai_comment_id = ai_comment!.id!;

    // Create AICompletionToken linking the triggering user to the AI comment
    await models.AICompletionToken.create({
      user_id: triggering_user_record!.id!,
      community_id,
      thread_id,
      parent_comment_id: null,
      content: 'This is an AI generated comment',
      comment_id: ai_comment_id,
      expires_at: new Date(Date.now() + 3600000), // 1 hour from now
      used_at: new Date(),
    });

    // Set up actors
    triggering_user = {
      user: {
        id: triggering_user_record!.id!,
        email: triggering_user_record!.email!,
      },
      address: community?.Addresses?.at(1)?.address,
    };
    other_user = {
      user: {
        id: other_user_record!.id!,
        email: other_user_record!.email!,
      },
      address: community?.Addresses?.at(2)?.address,
    };
    admin_user = {
      user: {
        id: admin_user_record!.id!,
        email: admin_user_record!.email!,
      },
      address: community?.Addresses?.at(3)?.address,
    };

    // Create JWTs
    jwt_triggering = jsonwebtoken.sign(
      {
        id: triggering_user_record!.id!,
        email: triggering_user_record!.email!,
      },
      config.AUTH.JWT_SECRET,
    );
    jwt_other = jsonwebtoken.sign(
      {
        id: other_user_record!.id!,
        email: other_user_record!.email!,
      },
      config.AUTH.JWT_SECRET,
    );
    jwt_admin = jsonwebtoken.sign(
      {
        id: admin_user_record!.id!,
        email: admin_user_record!.email!,
      },
      config.AUTH.JWT_SECRET,
    );
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should allow the triggering user to delete the AI comment they indirectly created', async () => {
    const res = await DeleteComment(
      triggering_user,
      jwt_triggering,
      ai_comment_id,
    );
    const text = await res.text();

    expect(res.status).toBe(200);
    const json = JSON.parse(text);
    expect(json.comment_id).toBe(ai_comment_id);
  });

  it('should NOT allow a non-triggering user to delete the AI comment', async () => {
    // Create another AI comment for this test
    const [ai_comment2] = await tester.seed('Comment', {
      thread_id,
      address_id: bot_address_id,
      body: 'This is another AI generated comment',
      reaction_weights_sum: '0',
    });
    const ai_comment_id2 = ai_comment2!.id!;

    // Link it to the triggering user
    await models.AICompletionToken.create({
      user_id: triggering_user.user.id!,
      community_id,
      thread_id,
      parent_comment_id: null,
      content: 'This is another AI generated comment',
      comment_id: ai_comment_id2,
      expires_at: new Date(Date.now() + 3600000),
      used_at: new Date(),
    });

    // Try to delete with other user
    const res = await DeleteComment(other_user, jwt_other, ai_comment_id2);
    const text = await res.text();

    // Should fail with 401 Unauthorized since the user is not the triggering user
    expect(res.status).toBe(401);
    const json = JSON.parse(text);
    // Check for error message - could be in 'error' or 'message' field
    const errorMessage = json.error || json.message;
    expect(errorMessage).toBeDefined();
    // Error could be about not having the right role or not being the author
    expect(errorMessage).toMatch(/User is not|Not the author/);
  });

  it('should allow an admin to delete any AI comment', async () => {
    // Create another AI comment for this test
    const [ai_comment3] = await tester.seed('Comment', {
      thread_id,
      address_id: bot_address_id,
      body: 'This is a third AI generated comment',
      reaction_weights_sum: '0',
    });
    const ai_comment_id3 = ai_comment3!.id!;

    // Link it to the triggering user (not the admin)
    await models.AICompletionToken.create({
      user_id: triggering_user.user.id!,
      community_id,
      thread_id,
      parent_comment_id: null,
      content: 'This is a third AI generated comment',
      comment_id: ai_comment_id3,
      expires_at: new Date(Date.now() + 3600000),
      used_at: new Date(),
    });

    // Admin should be able to delete it
    const res = await DeleteComment(admin_user, jwt_admin, ai_comment_id3);
    const text = await res.text();

    expect(res.status).toBe(200);
    const json = JSON.parse(text);
    expect(json.comment_id).toBe(ai_comment_id3);
  });

  it('should allow the triggering user to delete their own AI comment even without direct authorship', async () => {
    // Create yet another AI comment for this test
    const [ai_comment4] = await tester.seed('Comment', {
      thread_id,
      address_id: bot_address_id,
      body: 'This is a fourth AI generated comment',
      reaction_weights_sum: '0',
    });
    const ai_comment_id4 = ai_comment4!.id!;

    // Link it to the triggering user
    await models.AICompletionToken.create({
      user_id: triggering_user.user.id!,
      community_id,
      thread_id,
      parent_comment_id: null,
      content: 'This is a fourth AI generated comment',
      comment_id: ai_comment_id4,
      expires_at: new Date(Date.now() + 3600000),
      used_at: new Date(),
    });

    // The triggering user should be able to delete it
    const res = await DeleteComment(
      triggering_user,
      jwt_triggering,
      ai_comment_id4,
    );
    const text = await res.text();

    expect(res.status).toBe(200);
    const json = JSON.parse(text);
    expect(json.comment_id).toBe(ai_comment_id4);
  });

  it('should NOT allow the triggering user to delete an AI comment when BOT_USER_ADDRESS is not set', async () => {
    // Save the current BOT_USER_ADDRESS value
    const originalBotUserAddress = config.AI.BOT_USER_ADDRESS;

    try {
      // Unset the BOT_USER_ADDRESS to simulate the env variable not being set
      config.AI.BOT_USER_ADDRESS = undefined;

      // Create another AI comment for this test
      const [ai_comment5] = await tester.seed('Comment', {
        thread_id,
        address_id: bot_address_id,
        body: 'This is a fifth AI generated comment',
        reaction_weights_sum: '0',
      });
      const ai_comment_id5 = ai_comment5!.id!;

      // Link it to the triggering user
      await models.AICompletionToken.create({
        user_id: triggering_user.user.id!,
        community_id,
        thread_id,
        parent_comment_id: null,
        content: 'This is a fifth AI generated comment',
        comment_id: ai_comment_id5,
        expires_at: new Date(Date.now() + 3600000),
        used_at: new Date(),
      });

      // Try to delete with triggering user - should fail because the system
      // can't recognize this as an AI comment without BOT_USER_ADDRESS
      const res = await DeleteComment(
        triggering_user,
        jwt_triggering,
        ai_comment_id5,
      );
      const text = await res.text();

      // Should fail with 401 Unauthorized since the system can't determine
      // this is an AI comment and the user is not the direct author
      expect(res.status).toBe(401);
      const json = JSON.parse(text);
      const errorMessage = json.error || json.message;
      expect(errorMessage).toBeDefined();
      expect(errorMessage).toMatch(/User is not|Not the author/);
    } finally {
      // Restore the original BOT_USER_ADDRESS value
      config.AI.BOT_USER_ADDRESS = originalBotUserAddress;
    }
  });

  it('should allow a user to delete their own standard (non-AI) comment with BOT_USER_ADDRESS set', async () => {
    // Get the triggering user's address ID
    const triggeringUserAddressId = (
      await models.Address.findOne({
        where: {
          user_id: triggering_user.user.id!,
          community_id,
        },
      })
    )?.id!;

    // Create a standard comment by the triggering user (not by the bot)
    const [regular_comment] = await tester.seed('Comment', {
      thread_id,
      address_id: triggeringUserAddressId,
      body: 'This is a regular user comment',
      reaction_weights_sum: '0',
    });
    const regular_comment_id = regular_comment!.id!;

    // User should be able to delete their own comment
    const res = await DeleteComment(
      triggering_user,
      jwt_triggering,
      regular_comment_id,
    );
    const text = await res.text();

    expect(res.status).toBe(200);
    const json = JSON.parse(text);
    expect(json.comment_id).toBe(regular_comment_id);
  });

  it('should allow a user to delete their own standard (non-AI) comment when BOT_USER_ADDRESS is NOT set', async () => {
    // Save the current BOT_USER_ADDRESS value
    const originalBotUserAddress = config.AI.BOT_USER_ADDRESS;

    try {
      // Unset the BOT_USER_ADDRESS to simulate the env variable not being set
      config.AI.BOT_USER_ADDRESS = undefined;

      // Get the triggering user's address ID
      const triggeringUserAddressId = (
        await models.Address.findOne({
          where: {
            user_id: triggering_user.user.id!,
            community_id,
          },
        })
      )?.id!;

      // Create a standard comment by the triggering user (not by the bot)
      const [regular_comment] = await tester.seed('Comment', {
        thread_id,
        address_id: triggeringUserAddressId,
        body: 'This is another regular user comment',
        reaction_weights_sum: '0',
      });
      const regular_comment_id = regular_comment!.id!;

      // User should be able to delete their own comment even without BOT_USER_ADDRESS set
      // This ensures normal comment deletion isn't affected by the AI feature configuration
      const res = await DeleteComment(
        triggering_user,
        jwt_triggering,
        regular_comment_id,
      );
      const text = await res.text();

      expect(res.status).toBe(200);
      const json = JSON.parse(text);
      expect(json.comment_id).toBe(regular_comment_id);
    } finally {
      // Restore the original BOT_USER_ADDRESS value
      config.AI.BOT_USER_ADDRESS = originalBotUserAddress;
    }
  });

  it("should NOT allow a user to delete another user's standard (non-AI) comment with BOT_USER_ADDRESS set", async () => {
    // Get the triggering user's address ID
    const triggeringUserAddressId = (
      await models.Address.findOne({
        where: {
          user_id: triggering_user.user.id!,
          community_id,
        },
      })
    )?.id!;

    // Create a standard comment by the triggering user
    const [regular_comment] = await tester.seed('Comment', {
      thread_id,
      address_id: triggeringUserAddressId,
      body: 'This is a comment by the triggering user',
      reaction_weights_sum: '0',
    });
    const regular_comment_id = regular_comment!.id!;

    // Try to delete with other_user (who is not the author)
    const res = await DeleteComment(other_user, jwt_other, regular_comment_id);
    const text = await res.text();

    // Should fail with 401 Unauthorized since the user is not the author
    expect(res.status).toBe(401);
    const json = JSON.parse(text);
    const errorMessage = json.error || json.message;
    expect(errorMessage).toBeDefined();
    expect(errorMessage).toMatch(/User is not|Not the author/);
  });

  it("should NOT allow a user to delete another user's standard (non-AI) comment when BOT_USER_ADDRESS is NOT set", async () => {
    // Save the current BOT_USER_ADDRESS value
    const originalBotUserAddress = config.AI.BOT_USER_ADDRESS;

    try {
      // Unset the BOT_USER_ADDRESS to simulate the env variable not being set
      config.AI.BOT_USER_ADDRESS = undefined;

      // Get the triggering user's address ID
      const triggeringUserAddressId = (
        await models.Address.findOne({
          where: {
            user_id: triggering_user.user.id!,
            community_id,
          },
        })
      )?.id!;

      // Create a standard comment by the triggering user
      const [regular_comment] = await tester.seed('Comment', {
        thread_id,
        address_id: triggeringUserAddressId,
        body: 'This is another comment by the triggering user',
        reaction_weights_sum: '0',
      });
      const regular_comment_id = regular_comment!.id!;

      // Try to delete with other_user (who is not the author)
      const res = await DeleteComment(
        other_user,
        jwt_other,
        regular_comment_id,
      );
      const text = await res.text();

      // Should fail with 401 Unauthorized since the user is not the author
      // This ensures normal authorization still works even without BOT_USER_ADDRESS set
      expect(res.status).toBe(401);
      const json = JSON.parse(text);
      const errorMessage = json.error || json.message;
      expect(errorMessage).toBeDefined();
      expect(errorMessage).toMatch(/User is not|Not the author/);
    } finally {
      // Restore the original BOT_USER_ADDRESS value
      config.AI.BOT_USER_ADDRESS = originalBotUserAddress;
    }
  });
});
