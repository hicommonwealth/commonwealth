import { Actor, command, dispose, query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceType, CommunityTierMap } from '@hicommonwealth/shared';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import z from 'zod';
import {
  CreateCommentSubscription,
  DeleteCommentSubscription,
  GetCommentSubscriptions,
} from '../../src/aggregates/subscription';
import { models } from '../../src/database';
import { seed } from '../../src/tester';

describe('Comment subscription lifecycle', () => {
  let actor: Actor;
  let commentOne: z.infer<typeof schemas.Comment> | undefined;
  let commentTwo: z.infer<typeof schemas.Comment> | undefined;

  beforeAll(async () => {
    const [user] = await seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });
    const [node] = await seed('ChainNode', {
      url: 'https://ethereum-sepolia.publicnode.com',
      name: 'Sepolia Testnet',
      eth_chain_id: 11155111,
      balance_type: BalanceType.Ethereum,
    });
    const [community] = await seed('Community', {
      tier: CommunityTierMap.ChainVerified,
      chain_node_id: node!.id!,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'member',
          user_id: user!.id,
          verified: new Date(),
        },
      ],
      topics: [{}],
    });

    const [thread] = await seed('Thread', {
      address_id: community!.Addresses!.at(0)!.id!,
      community_id: community?.id,
      topic_id: community?.topics?.at(0)?.id,
      pinned: false,
      read_only: false,
      reaction_weights_sum: '0',
    });

    [commentOne] = await seed('Comment', {
      address_id: community?.Addresses?.at(0)?.id,
      thread_id: thread!.id!,
      reaction_weights_sum: '0',
    });
    [commentTwo] = await seed('Comment', {
      address_id: community?.Addresses?.at(0)?.id,
      thread_id: thread!.id!,
      reaction_weights_sum: '0',
    });
    actor = {
      user: { id: user!.id!, email: user!.email! },
      address: community?.Addresses?.at(0)?.address,
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  afterEach(async () => {
    await models.CommentSubscription.truncate({});
  });

  test('should create a new comment subscription', async () => {
    const payload = {
      id: actor.user.id!,
      comment_id: commentOne!.id!,
    };
    const res = await command(CreateCommentSubscription(), {
      payload,
      actor,
    });
    expect(res).toMatchObject({
      user_id: actor.user.id,
      comment_id: commentOne!.id,
    });
  });

  test('should get comment subscriptions', async () => {
    const [commentSubOne, commentSubTwo] =
      await models.CommentSubscription.bulkCreate([
        { user_id: actor.user.id!, comment_id: commentOne!.id! },
        { user_id: actor.user.id!, comment_id: commentTwo!.id! },
      ]);

    const res = await query(GetCommentSubscriptions(), {
      actor,
      payload: {},
    });

    expect(res!.length).toBe(2);
    expect(res![0].id === commentSubOne.id);
    expect(res![1].id === commentSubTwo.id);
  });

  test('should not throw for no comment subscriptions', async () => {
    const res = await query(GetCommentSubscriptions(), {
      actor,
      payload: {},
    });
    expect(res).toEqual([]);
  });

  test('should delete a comment subscriptions', async () => {
    await models.CommentSubscription.bulkCreate([
      { user_id: actor.user.id!, comment_id: commentOne!.id! },
      { user_id: actor.user.id!, comment_id: commentTwo!.id! },
    ]);

    const payload = {
      id: 0,
      comment_ids: [commentOne!.id!, commentTwo!.id!],
    };

    const res = await command(DeleteCommentSubscription(), {
      payload,
      actor,
    });
    expect(res).toBe(2);
  });
});
