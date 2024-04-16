import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { BalanceType } from '@hicommonwealth/shared';
import { expect } from 'chai';
import { models } from '../../src/database';
import {
  CreateThreadSubscription,
  DeleteThreadSubscription,
  GetThreadSubscriptions,
} from '../../src/subscription';
import { seed } from '../../src/tester';

describe('Thread subscription lifecycle', () => {
  let actor: Actor;
  let threadOne, threadTwo;
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
      discord_config_id: null,
    });

    [threadOne] = await seed('Thread', {
      address_id: community.Addresses[0].id,
      community_id: community?.id,
      topic_id: community.topics[0].id,
    });
    [threadTwo] = await seed('Thread', {
      address_id: community.Addresses[0].id,
      community_id: community?.id,
      topic_id: community.topics[0].id,
    });
    actor = {
      user: { id: user!.id!, email: user!.email! },
      address_id: null,
    };
  });

  after(async () => {
    await dispose()();
  });

  afterEach(async () => {
    await models.ThreadSubscription.truncate({});
  });

  it('should create a new thread subscription', async () => {
    const payload = {
      thread_id: threadOne.id,
    };
    const res = await command(CreateThreadSubscription(), {
      payload,
      actor,
    });
    expect(res).to.deep.contains({
      user_id: actor.user.id,
      thread_id: threadOne.id,
    });
  });

  it('should get thread subscriptions', async () => {
    const [threadSubOne, threadSubTwo] =
      await models.ThreadSubscription.bulkCreate([
        { user_id: actor.user.id, thread_id: threadOne.id },
        { user_id: actor.user.id, thread_id: threadTwo.id },
      ]);

    const res = await query(GetThreadSubscriptions(), {
      actor,
      payload: {},
    });
    expect(res).to.have.deep.members([
      threadSubOne.toJSON(),
      threadSubTwo.toJSON(),
    ]);
  });

  it('should not throw for no thread subscriptions', async () => {
    const res = await query(GetThreadSubscriptions(), {
      actor,
      payload: {},
    });
    expect(res).to.deep.equal([]);
  });

  it('should delete a thread subscriptions', async () => {
    await models.ThreadSubscription.bulkCreate([
      { user_id: actor.user.id, thread_id: threadOne.id },
      { user_id: actor.user.id, thread_id: threadTwo.id },
    ]);

    const payload = {
      thread_ids: [threadOne.id, threadTwo.id],
    };

    const res = await command(DeleteThreadSubscription(), {
      payload,
      actor,
    });
    expect(res).to.equal(2);
  });
});
