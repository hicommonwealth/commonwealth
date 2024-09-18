import { Actor, command, dispose, query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceType } from '@hicommonwealth/shared';
import { expect } from 'chai';
import { bootstrap_testing, seed } from 'model/src/tester';
import { afterAll, afterEach, beforeAll, describe, test } from 'vitest';
import z from 'zod';
import { models } from '../../src/database';
import {
  CreateThreadSubscription,
  DeleteThreadSubscription,
  GetThreadSubscriptions,
} from '../../src/subscription';

describe('Thread subscription lifecycle', () => {
  let actor: Actor;
  let threadOne: z.infer<typeof schemas.Thread> | undefined;
  let threadTwo: z.infer<typeof schemas.Thread> | undefined;
  beforeAll(async () => {
    await bootstrap_testing(true);
    const [user] = await seed('User', {
      isAdmin: false,
    });
    const [node] = await seed('ChainNode', {
      url: 'https://ethereum-sepolia.publicnode.com',
      name: 'Sepolia Testnet',
      eth_chain_id: 11155111,
      balance_type: BalanceType.Ethereum,
    });
    const [community] = await seed('Community', {
      chain_node_id: node!.id!,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'member',
          user_id: user!.id,
        },
      ],
      topics: [{}],
    });

    [threadOne] = await seed('Thread', {
      address_id: community!.Addresses![0].id!,
      community_id: community?.id,
      topic_id: community!.topics![0].id,
      pinned: false,
      read_only: false,
    });
    [threadTwo] = await seed('Thread', {
      address_id: community!.Addresses![0].id!,
      community_id: community?.id,
      topic_id: community!.topics![0].id,
      pinned: false,
      read_only: false,
    });
    actor = {
      user: { id: user!.id!, email: user!.email! },
      address: '0x',
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  afterEach(async () => {
    await models.ThreadSubscription.truncate({});
  });

  test('should create a new thread subscription', async () => {
    const payload = {
      id: 0,
      thread_id: threadOne!.id!,
    };
    const res = await command(CreateThreadSubscription(), {
      payload,
      actor,
    });
    expect(res).to.deep.contains({
      user_id: actor.user.id,
      thread_id: threadOne!.id,
    });
  });

  test('should get thread subscriptions', async () => {
    const [threadSubOne, threadSubTwo] =
      await models.ThreadSubscription.bulkCreate([
        { user_id: actor.user.id!, thread_id: threadOne!.id! },
        { user_id: actor.user.id!, thread_id: threadTwo!.id! },
      ]);

    expect(threadSubOne).to.exist;
    expect(threadSubTwo).to.exist;

    const res = await query(GetThreadSubscriptions(), {
      actor,
      payload: {},
    });

    expect(res).to.exist;
    expect(res![0]).to.exist;
    expect(res![1]).to.exist;

    res![0]!.Thread = null!;
    res![1]!.Thread = null!;

    expect(res).to.have.deep.members([
      { ...threadSubOne.toJSON(), Thread: null },
      { ...threadSubTwo.toJSON(), Thread: null },
    ]);
  });

  test('should not throw for no thread subscriptions', async () => {
    const res = await query(GetThreadSubscriptions(), {
      actor,
      payload: {},
    });
    expect(res).to.deep.equal([]);
  });

  test('should delete a thread subscriptions', async () => {
    await models.ThreadSubscription.bulkCreate([
      { user_id: actor.user.id!, thread_id: threadOne!.id! },
      { user_id: actor.user.id!, thread_id: threadTwo!.id! },
    ]);

    const payload = {
      id: actor.user.id!,
      thread_ids: [threadOne!.id!, threadTwo!.id!],
    };

    const res = await command(DeleteThreadSubscription(), {
      payload,
      actor,
    });
    expect(res).to.equal(2);
  });
});
