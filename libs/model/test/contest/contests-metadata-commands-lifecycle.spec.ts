import { Actor, command, dispose, schemas } from '@hicommonwealth/core';
import { Contest } from '@hicommonwealth/model';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import z from 'zod';
import { bootstrap_testing, seed } from '../../src/tester';

chai.use(chaiAsPromised);

describe('Contests metadata commands lifecycle', () => {
  const community_id = 'community';
  const namespace = 'test-namespace';

  const name = 'My Contest';
  const payout_structure = [0.9, 0.1];
  const prize_percentage = 1;
  const funding_token_address = 'funding-address';
  const image_url = 'url';
  const interval = 10;
  const created_at = new Date();
  const paused = false;

  let community: [
    z.infer<typeof schemas.entities['Community']> | undefined,
    Record<string, any>[],
  ];

  let communityAdminActor: Actor | null = null;
  let memberActor: Actor | null = null;

  before(async () => {
    await bootstrap_testing();
    const [chain] = await seed('ChainNode', { contracts: [] });

    const [communityAdminUser] = await seed(
      'User',
      {
        isAdmin: false, // will be community admin, not super admin
        selected_community_id: undefined,
      },
      //{ mock: true, log: true },
    );

    const [memberUser] = await seed(
      'User',
      {
        isAdmin: false,
        selected_community_id: undefined,
      },
      //{ mock: true, log: true },
    );

    community = await seed(
      'Community',
      {
        id: community_id,
        namespace,
        chain_node_id: chain!.id,
        discord_config_id: undefined,
        Addresses: [
          {
            community_id,
            user_id: communityAdminUser!.id,
            role: 'admin',
            profile_id: undefined,
          },
          {
            community_id,
            user_id: memberUser!.id,
            role: 'member',
            profile_id: undefined,
          },
        ],
        CommunityStakes: [],
        topics: [],
        groups: [],
        contest_managers: [
          {
            contest_address: '0x1',
            name,
            interval,
            topics: [],
            contests: [],
            image_url,
            payout_structure,
            prize_percentage,
            funding_token_address,
            created_at,
            paused,
          },
          {
            contest_address: '0x2',
            name,
            interval,
            topics: [],
            contests: [],
            image_url,
            payout_structure,
            prize_percentage,
            funding_token_address,
            created_at,
            paused,
          },
        ],
      },
      // { mock: true, log: true },
    );

    communityAdminActor = {
      user: {
        id: communityAdminUser!.id,
        email: communityAdminUser!.email!,
      },
      address_id: community[0]!.Addresses![0].address,
    };

    expect(communityAdminActor.address_id).to.not.be.empty;

    memberActor = {
      user: {
        id: memberUser!.id,
        email: memberUser!.email!,
      },
      address_id: community[0]!.Addresses![1].address,
    };

    expect(memberActor.address_id).to.not.be.empty;
  });

  after(async () => {
    await dispose()();
  });

  describe('create contest metadata', () => {
    it('should fail to create if not community admin', async () => {
      const promise = command(Contest.CreateContestManagerMetadata(), {
        actor: memberActor!,
        id: community_id,
        payload: {
          name,
          contest_address: '0x123',
          image_url,
          funding_token_address,
          prize_percentage,
          payout_structure,
          interval,
          paused,
          created_at,
        },
      });
      expect(promise).to.be.rejectedWith('User is not admin in the community');
    });

    it('should fail to create if community does not exist', async () => {
      const promise = command(Contest.CreateContestManagerMetadata(), {
        actor: communityAdminActor!,
        id: 'does-not-exist',
        payload: {
          name,
          contest_address: '0x123',
          image_url,
          funding_token_address,
          prize_percentage,
          payout_structure,
          interval,
          paused,
          created_at,
        },
      });
      expect(promise).to.be.rejectedWith('Community must exist');
    });

    it(`should create contest manager metadata`, async () => {
      const contest_address = '0xContestAddress';

      const createResult = await command(
        Contest.CreateContestManagerMetadata(),
        {
          actor: communityAdminActor!,
          id: community_id,
          payload: {
            contest_address,
            name,
            image_url,
            funding_token_address,
            prize_percentage,
            payout_structure,
            interval,
            paused,
            created_at,
          },
        },
      );

      expect(createResult).to.deep.eq({
        contest_managers: [
          {
            contest_address,
            name,
            community_id,
            image_url,
            funding_token_address,
            prize_percentage,
            payout_structure,
            interval,
            paused,
            created_at,
          },
        ],
      });
    });
  });

  describe.skip('update contest metadata', () => {
    it('should fail to update if contest manager does not exist', async () => {
      const promise = command(Contest.UpdateContestManagerMetadata(), {
        actor: communityAdminActor!,
        id: 'does-not-exist',
        payload: {
          name: 'xxx',
        },
      });
      expect(promise).to.be.rejectedWith('ContestManager must exist');
    });

    it('should update contest manager metadata', async () => {
      const { contest_address } = community[0]!.contest_managers![0];

      const updateResult = await command(
        Contest.UpdateContestManagerMetadata(),
        {
          actor: communityAdminActor!,
          id: contest_address,
          payload: {
            name: 'xxx',
          },
        },
      );

      expect(updateResult).to.deep.eq({
        contest_address,
        name: 'xxx',
        community_id,
        image_url,
        funding_token_address,
        prize_percentage,
        payout_structure,
        interval,
        paused,
        created_at,
      });
    });
  });

  describe.skip('pause/resume contest metadata', () => {
    it('should fail to pause if contest manager does not exist', async () => {
      const promise = command(Contest.PauseContestManagerMetadata(), {
        actor: communityAdminActor!,
        id: 'does-not-exist',
        payload: {},
      });
      expect(promise).to.be.rejectedWith('ContestManager must exist');
    });

    it('should fail to resume if contest manager does not exist', async () => {
      const promise = command(Contest.ResumeContestManagerMetadata(), {
        actor: communityAdminActor!,
        id: 'does-not-exist',
        payload: {},
      });
      expect(promise).to.be.rejectedWith('ContestManager must exist');
    });

    it('should pause and resume contest manager metadata', async () => {
      const { contest_address, paused } = community[0]!.contest_managers![1];

      expect(paused).to.eq(false);

      const pausedResult = await command(
        Contest.PauseContestManagerMetadata(),
        {
          actor: communityAdminActor!,
          id: contest_address,
          payload: {},
        },
      );

      expect(pausedResult).to.deep.eq({
        contest_address,
        name,
        community_id,
        image_url,
        funding_token_address,
        prize_percentage,
        payout_structure,
        interval,
        paused: true,
        created_at,
      });

      const resumedResult = await command(
        Contest.ResumeContestManagerMetadata(),
        {
          actor: communityAdminActor!,
          id: contest_address,
          payload: {},
        },
      );

      expect(resumedResult).to.deep.eq({
        contest_address,
        name,
        community_id,
        image_url,
        funding_token_address,
        prize_percentage,
        payout_structure,
        interval,
        paused: false,
        created_at,
      });
    });
  });
});
