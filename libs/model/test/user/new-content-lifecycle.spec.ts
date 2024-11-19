import { Actor, dispose, query } from '@hicommonwealth/core';
import { Address, Topic } from '@hicommonwealth/schemas';

import { GetNewContent } from 'model/src/user';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { z } from 'zod';
import { seed } from '../../src/tester';

describe('New Content lifecycle', () => {
  let actor1: Actor;
  let actor2: Actor;
  let address1: z.infer<typeof Address>;
  let topic: z.infer<typeof Topic>;

  beforeAll(async () => {
    const [node] = await seed('ChainNode', {});
    const [user1] = await seed('User');
    const [user2] = await seed('User');
    const [community] = await seed('Community', {
      chain_node_id: node?.id,
      lifetime_thread_count: 0,
      profile_count: 2,
      Addresses: [
        {
          role: 'member',
          user_id: user1!.id,
          verified: new Date(),
          last_active: new Date().toISOString(),
        },
        {
          role: 'member',
          user_id: user2!.id,
          verified: new Date(),
          last_active: new Date().toISOString(),
        },
      ],
    });
    [topic] = (await seed('Topic', {
      community_id: community!.id,
    })) as [z.infer<typeof Topic>, unknown];

    actor1 = {
      user: {
        id: user1!.id!,
        email: user1!.email!,
        isAdmin: user1?.isAdmin || false,
      },
      address: community!.Addresses!.at(0)!.address!,
    };
    address1 = community!.Addresses!.at(0)!;
    actor2 = {
      user: {
        id: user2!.id!,
        email: user2!.email!,
        isAdmin: user2?.isAdmin || false,
      },
      address: community!.Addresses!.at(1)!.address!,
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
    // create 2 threads in the same community via address 1
    await seed('Thread', {
      address_id: address1.id!,
      community_id: address1.community_id,
      pinned: false,
      read_only: false,
      body: 'Sample 1',
      reaction_weights_sum: '0',
      topic_id: topic.id!,
    });
    await seed('Thread', {
      address_id: address1.id!,
      community_id: address1.community_id,
      pinned: false,
      read_only: false,
      body: 'Sample 2',
      reaction_weights_sum: '0',
      topic_id: topic.id!,
    });

    // now actor 2 should only get 1 entry for that community in new content array
    const results = await query(GetNewContent(), {
      actor: actor2,
      payload: {},
    });
    expect(results?.joinedCommunityIdsWithNewContent.length).to.be.equal(1);
  });
});
