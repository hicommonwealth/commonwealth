import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { BalanceType } from '@hicommonwealth/shared';
import { expect } from 'chai';
import { models } from '../../src/database';
import {
  CreateCommentSubscription,
  DeleteCommentSubscription,
  GetCommentSubscriptions,
} from '../../src/subscription';
import { seed } from '../../src/tester';

describe('Comment subscription lifecycle', () => {
  let actor: Actor;
  let commentOne, commentTwo;
  before(async () => {
    const [user] = await seed('User', {
      isAdmin: false,
      selected_community_id: null,
    });
    const [node] = await seed('ChainNode', {
      url: 'https://ethereum-sepolia.publicnode.com',
      name: 'Sepolia Testnet',
      eth_chain_id: 11155111,
      balance_type: BalanceType.Ethereum,
      contracts: [],
    });
    const [community] = await seed('Community', {
      chain_node_id: node?.id,
      Addresses: [
        {
          role: 'member',
          user_id: user!.id,
          profile_id: undefined,
        },
      ],
      CommunityStakes: [],
      groups: [],
      contest_managers: [],
      discord_config_id: null,
    });

    const [thread] = await seed('Thread', {
      address_id: community?.Addresses?.at(0)?.id,
      community_id: community?.id,
      topic_id: community?.topics?.at(0)?.id,
    });

    [commentOne] = await seed('Comment', {
      address_id: community?.Addresses?.at(0)?.id,
      community_id: community?.id,
      thread_id: thread?.id,
    });
    [commentTwo] = await seed('Comment', {
      address_id: community?.Addresses?.at(0)?.id,
      community_id: community?.id,
      thread_id: thread?.id,
    });
    actor = {
      user: { id: user!.id!, email: user!.email! },
      address_id: undefined,
    };
  });

  after(async () => {
    await dispose()();
  });

  afterEach(async () => {
    await models.CommentSubscription.truncate({});
  });

  it('should create a new comment subscription', async () => {
    const payload = {
      comment_id: commentOne.id,
    };
    const res = await command(CreateCommentSubscription(), {
      payload,
      actor,
    });
    expect(res).to.deep.contains({
      user_id: actor.user.id,
      comment_id: commentOne.id,
    });
  });

  it('should get comment subscriptions', async () => {
    const [commentSubOne, commentSubTwo] =
      await models.CommentSubscription.bulkCreate([
        { user_id: actor.user.id, comment_id: commentOne.id },
        { user_id: actor.user.id, comment_id: commentTwo.id },
      ]);

    const res = await query(GetCommentSubscriptions(), {
      actor,
      payload: {},
    });
    expect(res).to.have.deep.members([
      commentSubOne.toJSON(),
      commentSubTwo.toJSON(),
    ]);
  });

  it('should not throw for no comment subscriptions', async () => {
    const res = await query(GetCommentSubscriptions(), {
      actor,
      payload: {},
    });
    expect(res).to.deep.equal([]);
  });

  it('should delete a comment subscriptions', async () => {
    await models.CommentSubscription.bulkCreate([
      { user_id: actor.user.id, comment_id: commentOne.id },
      { user_id: actor.user.id, comment_id: commentTwo.id },
    ]);

    const payload = {
      comment_ids: [commentOne.id, commentTwo.id],
    };

    const res = await command(DeleteCommentSubscription(), {
      payload,
      actor,
    });
    expect(res).to.equal(2);
  });
});
