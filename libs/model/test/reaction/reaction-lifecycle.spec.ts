import { dispose } from '@hicommonwealth/core';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { models } from '../../src/database';
import { seed } from '../../src/tester';

describe('Reactions lifecycle', () => {
  const addressId = 555;
  const communityId = 'eee';
  const threadId = 999;

  beforeAll(async () => {
    const [chain] = await seed('ChainNode');
    const [user] = await seed(
      'User',
      {
        isAdmin: false,
        selected_community_id: undefined,
      },
      //{ mock: true, log: true },
    );
    const [community] = await seed(
      'Community',
      {
        id: communityId,
        chain_node_id: chain!.id,
        discord_config_id: undefined,
        lifetime_thread_count: 0,
        profile_count: 1,
        Addresses: [
          {
            id: addressId,
            user_id: user?.id,
            role: 'admin',
          },
        ],
        // CommunityStakes: [],
        topics: [{}],
        // groups: [],
        // contest_managers: [],
      },
      //{ mock: true, log: true },
    );
    await seed(
      'Thread',
      {
        community_id: community?.id,
        Address: community?.Addresses?.at(0),
        id: threadId,
        address_id: community?.Addresses?.at(0)?.id,
        topic_id: community!.topics!.at(0)!.id!,
        deleted_at: undefined, // so we can find it!
        pinned: false,
        read_only: false,
        reaction_weights_sum: '0',
      },
      //{ mock: true, log: true },
    );
  });
  afterAll(async () => {
    await dispose()();
  });

  test('should create an outbox entry when a thread is liked', async () => {
    await models.Reaction.create({
      address_id: addressId,
      thread_id: threadId,
      reaction: 'like',
      canvas_signed_data: '',
      canvas_msg_id: '',
      calculated_voting_weight: '0',
    });

    const lastOutboxEntry = await models.Outbox.findOne({
      order: [['created_at', 'DESC']],
    });
    expect(lastOutboxEntry!.event_name).to.eq('ThreadUpvoted');
    expect(lastOutboxEntry!.event_payload).to.contain({
      community_id: communityId,
      address_id: addressId,
      thread_id: threadId,
      reaction: 'like',
    });
  });
});
