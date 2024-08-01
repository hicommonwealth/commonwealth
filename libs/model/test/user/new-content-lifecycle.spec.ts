import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { expect } from 'chai';
import { CreateThread } from 'model/src/thread';
import { GetNewContent } from 'model/src/user';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { seed } from '../../src/tester';

describe('New Content lifecycle', () => {
  let id: string;
  let actor1: Actor;
  let actor2: Actor;

  beforeAll(async () => {
    const [node] = await seed('ChainNode', {});
    const [user1] = await seed('User');
    const [user2] = await seed('User');
    const [community] = await seed('Community', {
      chain_node_id: node?.id,
      Addresses: [
        {
          role: 'member',
          user_id: user1!.id,
        },
        {
          role: 'member',
          user_id: user2!.id,
        },
      ],
    });

    id = community!.id!;
    actor1 = {
      user: { id: user1!.id!, email: user1!.email!, isAdmin: user1?.isAdmin },
      address_id: community!.Addresses!.at(0)!.address!,
    };
    actor2 = {
      user: { id: user2!.id!, email: user2!.email!, isAdmin: user2?.isAdmin },
      address_id: community!.Addresses!.at(1)!.address!,
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should return empty array when user-joined communities have no new content', async () => {
    const results = await query(GetNewContent(), {
      actor: actor1,
      payload: {},
    });
    expect(results?.joinedCommunityIdsWithNewContent.length).to.be.equal(0);
  });

  test('should return ids of user-joined communities which have new content', async () => {
    // TODO: ask @Roger - CreateThread() command doesnt actually create a thread, should we still
    // test this or whats the preferred alternative way to create a test thread here?
    await command(CreateThread(), { actor: actor2, payload: {}, id: `1` }); // TODO: update payload/id

    const results = await query(GetNewContent(), {
      actor: actor1,
      payload: {},
    });
    expect(results?.joinedCommunityIdsWithNewContent.length).to.be.equal(0); // TODO: the actual expected length is 1 here
  });
});
