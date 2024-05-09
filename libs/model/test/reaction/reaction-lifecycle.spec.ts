import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { expect } from 'chai';
import { bootstrap_testing, seed } from 'model/src/tester';

describe('Reactions lifecycle', () => {
  const addressId = 555;
  const communityId = 'eee';
  const threadId = 999;

  before(async () => {
    await bootstrap_testing();
    const [chain] = await seed('ChainNode', { contracts: [] });
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
        Addresses: [
          {
            id: addressId,
            user_id: user?.id,
            role: 'admin',
            profile_id: undefined,
          },
        ],
        // CommunityStakes: [],
        topics: [],
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
        topic_id: undefined,
        deleted_at: undefined, // so we can find it!
      },
      //{ mock: true, log: true },
    );
  });
  after(async () => {
    await dispose()();
  });

  it('should create an outbox entry when a thread is liked', async () => {
    await models.Reaction.create({
      community_id: communityId,
      address_id: addressId,
      thread_id: threadId,
      reaction: 'like',
      canvas_action: '',
      canvas_session: '',
      canvas_hash: '',
      calculated_voting_weight: 0,
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
