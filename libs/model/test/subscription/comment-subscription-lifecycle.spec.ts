import { Actor, command, dispose, query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceType } from '@hicommonwealth/shared';
import { expect } from 'chai';
import { bootstrap_testing, seed } from 'model/src/tester';
import { afterAll, afterEach, beforeAll, describe, test } from 'vitest';
import z from 'zod';
import { models } from '../../src/database';
import { CommentSubscriptionInstance } from '../../src/models/comment_subscriptions';
import {
  CreateCommentSubscription,
  DeleteCommentSubscription,
  GetCommentSubscriptions,
} from '../../src/subscription';

describe('Comment subscription lifecycle', () => {
  let actor: Actor;
  let commentOne: z.infer<typeof schemas.Comment> | undefined;
  let commentTwo: z.infer<typeof schemas.Comment> | undefined;
  let community: z.infer<typeof schemas.Community> | undefined;
  let thread: z.infer<typeof schemas.Thread> | undefined;
  let address: z.infer<typeof schemas.Address> | undefined;

  beforeAll(async () => {
    await bootstrap_testing(true);
    const [user] = await seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });

    address = community?.Addresses?.[0]!;

    const [node] = await seed('ChainNode', {
      url: 'https://ethereum-sepolia.publicnode.com',
      name: 'Sepolia Testnet',
      eth_chain_id: 11155111,
      balance_type: BalanceType.Ethereum,
    });
    [community] = await seed('Community', {
      chain_node_id: node?.id,
      Addresses: [
        {
          role: 'member',
          user_id: user!.id,
        },
      ],
    });

    [thread] = await seed('Thread', {
      address_id: community?.Addresses?.at(0)?.id,
      community_id: community?.id,
      topic_id: community?.topics?.at(0)?.id,
      pinned: false,
      read_only: false,
      version_history: [],
    });

    [commentOne] = await seed('Comment', {
      address_id: community?.Addresses?.at(0)?.id,
      community_id: community?.id,
      thread_id: thread!.id!,
    });
    [commentTwo] = await seed('Comment', {
      address_id: community?.Addresses?.at(0)?.id,
      community_id: community?.id,
      thread_id: thread!.id!,
    });
    actor = {
      user: { id: user!.id!, email: user!.email! },
      address_id: undefined,
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
      comment_id: commentOne!.id!,
    };
    const res = await command(CreateCommentSubscription(), {
      payload,
      actor,
    });
    expect(res).to.deep.contains({
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

    expect(thread).to.not.be.null;
    expect(address).to.not.be.null;

    function updateStructure(comment: CommentSubscriptionInstance) {
      return {
        ...comment.toJSON(),
        Comment: {
          ...commentOne,
          Thread: null,
        },
      };
    }

    console.log(
      'FIXME: commentSubOne: ',
      JSON.stringify(updateStructure(commentSubOne), null, 2),
    );
    console.log('FIXME: res: ', JSON.stringify(res![0], null, 2));

    // This s giving me non-deterministic results. Sometimes the 'res' will have
    // Thread, sometimes it is null.

    expect(res).to.have.deep.members([
      updateStructure(commentSubOne),
      updateStructure(commentSubTwo),
    ]);
  });

  test('should not throw for no comment subscriptions', async () => {
    const res = await query(GetCommentSubscriptions(), {
      actor,
      payload: {},
    });
    expect(res).to.deep.equal([]);
  });

  test('should delete a comment subscriptions', async () => {
    await models.CommentSubscription.bulkCreate([
      { user_id: actor.user.id!, comment_id: commentOne!.id! },
      { user_id: actor.user.id!, comment_id: commentTwo!.id! },
    ]);

    const payload = {
      comment_ids: [commentOne!.id!, commentTwo!.id!],
    };

    const res = await command(DeleteCommentSubscription(), {
      payload,
      actor,
    });
    expect(res).to.equal(2);
  });
});
