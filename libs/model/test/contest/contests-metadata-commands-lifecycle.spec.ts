import { Actor, command, dispose } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { afterAll, beforeAll, describe, test } from 'vitest';
import z from 'zod';
import { Contest, TopicAttributes } from '../../src/index';
import { bootstrap_testing, seed } from '../../src/tester';

chai.use(chaiAsPromised);

describe('Contests metadata commands lifecycle', () => {
  const community_id = 'community';
  const namespace = 'test-namespace';

  const name = 'My Contest';
  const payout_structure = [10, 90];
  const prize_percentage = 1;
  const funding_token_address = 'funding-address';
  const image_url = 'url';
  const interval = 10;
  const ticker = 'XYZ';
  const decimals = 18;

  let community: [
    z.infer<typeof schemas.Community> | undefined,
    Record<string, any>[],
  ];
  let topics: z.infer<typeof schemas.Topic>[] = [];
  let communityAdminActor: Actor | null = null;
  let communityMemberActor: Actor | null = null;

  beforeAll(async () => {
    await bootstrap_testing();
    const [chain] = await seed('ChainNode', {});

    const [communityAdminUser] = await seed(
      'User',
      {
        isAdmin: false, // will be community admin, not super admin
      },
      //{ mock: true, log: true },
    );

    const [memberUser] = await seed(
      'User',
      {
        isAdmin: false,
      },
      //{ mock: true, log: true },
    );

    community = await seed(
      'Community',
      {
        id: community_id,
        namespace,
        namespace_address: '0x123',
        chain_node_id: chain!.id,
        lifetime_thread_count: 0,
        profile_count: 2,
        Addresses: [
          {
            community_id,
            user_id: communityAdminUser!.id,
            role: 'admin',
            is_banned: false,
            verified: new Date(),
          },
          {
            community_id,
            user_id: memberUser!.id,
            role: 'member',
            is_banned: false,
            verified: new Date(),
          },
        ],
        topics: [{}, {}, {}],
        contest_managers: [
          {
            contest_address: '0x1',
            name,
            interval,
            image_url,
            payout_structure,
            ticker,
            prize_percentage,
            funding_token_address,
            decimals,
            cancelled: false,
          },
          {
            contest_address: '0x2',
            name,
            interval,
            image_url,
            payout_structure,
            ticker,
            prize_percentage,
            funding_token_address,
            decimals,
            cancelled: false,
          },
        ],
        CommunityStakes: [
          {
            stake_id: 1,
            stake_token: 'XYZ',
            vote_weight: 3,
            stake_enabled: true,
          },
        ],
      },
      // { mock: true, log: true },
    );

    topics = community![0]!.topics as Required<TopicAttributes>[];

    expect(topics).to.not.be.empty;

    communityAdminActor = {
      user: {
        id: communityAdminUser!.id,
        email: communityAdminUser!.email!,
      },
      address: community[0]!.Addresses![0].address,
    };

    expect(communityAdminActor.address).to.not.be.empty;

    communityMemberActor = {
      user: {
        id: memberUser!.id,
        email: memberUser!.email!,
      },
      address: community[0]!.Addresses![1].address,
    };

    expect(communityMemberActor.address).to.not.be.empty;
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('create contest metadata', () => {
    test('should fail to create if not community admin', async () => {
      const promise = command(Contest.CreateContestManagerMetadata(), {
        actor: communityMemberActor!,
        payload: {
          community_id,
          name,
          contest_address: '0x123',
          image_url,
          funding_token_address,
          prize_percentage,
          payout_structure,
          interval,
          ticker,
          decimals,
          topic_id: topics[0].id,
        },
      });
      expect(promise).to.be.rejectedWith('User is not admin in the community');
    });

    test('should fail to create if community does not exist', async () => {
      const promise = command(Contest.CreateContestManagerMetadata(), {
        actor: communityAdminActor!,
        payload: {
          community_id: 'does-not-exist',
          name,
          contest_address: '0x123',
          image_url,
          funding_token_address,
          prize_percentage,
          payout_structure,
          interval,
          ticker,
          decimals,
          topic_id: topics[0].id,
        },
      });
      // the auth middleware fails to find address if community doesn't exist
      expect(promise).to.be.rejectedWith('User is not admin in the community');
    });

    test(`should create contest manager metadata`, async () => {
      const contest_address = '0xContestAddress';

      const createResult = await command(
        Contest.CreateContestManagerMetadata(),
        {
          actor: communityAdminActor!,
          payload: {
            community_id,
            contest_address,
            name,
            image_url,
            funding_token_address,
            prize_percentage,
            payout_structure,
            interval,
            ticker,
            decimals,
            topic_id: topics[0].id,
          },
        },
      );

      expect(createResult!.contest_managers![0]).to.deep.contain({
        contest_address,
        name,
        community_id,
        image_url,
        funding_token_address,
        prize_percentage,
        payout_structure,
        interval,
        ticker,
        decimals,
        cancelled: false,
        topic_id: topics[0].id,
      });
    });
  });

  describe('update contest metadata', () => {
    test('should fail to update if not community admin', async () => {
      const { contest_address } = community[0]!.contest_managers![0];

      const promise = command(Contest.UpdateContestManagerMetadata(), {
        actor: communityMemberActor!,
        payload: {
          community_id,
          contest_address,
          name: 'xxx',
          image_url: 'https://blah',
        },
      });

      expect(promise).to.be.rejectedWith('User is not admin in the community');
    });

    test('should fail to update if contest manager does not exist', async () => {
      const promise = command(Contest.UpdateContestManagerMetadata(), {
        actor: communityAdminActor!,
        payload: {
          community_id,
          contest_address: 'contest-manager-not-exists',
          name: 'xxx',
        },
      });
      expect(promise).to.be.rejectedWith('Contest Manager must exist');
    });

    test('should update contest manager metadata', async () => {
      const { contest_address } = community[0]!.contest_managers![0];

      const updateResult = await command(
        Contest.UpdateContestManagerMetadata(),
        {
          actor: communityAdminActor!,
          payload: {
            community_id,
            contest_address,
            name: 'xxx',
            image_url: 'https://blah',
          },
        },
      );

      const metadata = updateResult!.contest_managers![0];
      expect(metadata).to.deep.contain({
        contest_address,
        name: 'xxx',
        community_id,
        image_url: 'https://blah',
        funding_token_address,
        prize_percentage,
        payout_structure,
        interval,
        ticker,
        decimals,
        cancelled: false,
      });
    });

    test('should update contest manager metadata topics', async () => {
      const { contest_address } = community[0]!.contest_managers![0];

      {
        // empty topic IDs
        const updateResult = await command(
          Contest.UpdateContestManagerMetadata(),
          {
            actor: communityAdminActor!,
            payload: {
              community_id,
              contest_address,
              topic_id: topics[1].id,
            },
          },
        );
        expect(updateResult?.contest_managers[0]!.topic_id).to.eq(
          topics[1].id!,
        );
      }
    });
  });

  describe('cancel contest metadata', () => {
    test('should fail to cancel if not admin', async () => {
      const { contest_address } = community[0]!.contest_managers![1];

      expect(contest_address).to.not.be.empty;

      const promise = command(Contest.CancelContestManagerMetadata(), {
        actor: communityMemberActor!,
        payload: {
          community_id,
          contest_address,
        },
      });
      expect(promise).to.be.rejectedWith('User is not admin in the community');
    });

    test('should fail to cancel if contest manager does not exist', async () => {
      const promise = command(Contest.CancelContestManagerMetadata(), {
        actor: communityAdminActor!,
        payload: {
          community_id,
          contest_address: 'does-not-exist',
        },
      });
      expect(promise).to.be.rejectedWith('Contest Manager must exist');
    });

    test('should cancel contest manager metadata', async () => {
      const { contest_address, cancelled } = community[0]!.contest_managers![1];

      expect(contest_address).to.not.be.empty;
      expect(cancelled).to.eq(false);

      const cancelledResult = await command(
        Contest.CancelContestManagerMetadata(),
        {
          actor: communityAdminActor!,
          payload: {
            community_id,
            contest_address,
          },
        },
      );

      expect(cancelledResult!.contest_managers![0]).to.deep.contain({
        contest_address,
        name,
        community_id,
        image_url,
        funding_token_address,
        prize_percentage,
        payout_structure,
        interval,
        cancelled: true,
      });
    });
  });
});
