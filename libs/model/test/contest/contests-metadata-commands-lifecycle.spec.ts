import { Actor, command, dispose, schemas } from '@hicommonwealth/core';
import { Contest } from '@hicommonwealth/model';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import z from 'zod';
import { bootstrap_testing, seed } from '../../src/tester';

chai.use(chaiAsPromised);

describe('Contests metadata commands lifecycle', () => {
  const actor: Actor = {
    user: {
      id: 1,
      email: 'blah',
    },
  };

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

  let seedResult: [
    z.infer<typeof schemas.entities['Community']> | undefined,
    Record<string, any>[],
  ];

  before(async () => {
    await bootstrap_testing();
    const [chain] = await seed('ChainNode', { contracts: [] });
    const [user] = await seed(
      'User',
      {
        isAdmin: true,
        selected_community_id: undefined,
      },
      //{ mock: true, log: true },
    );
    seedResult = await seed(
      'Community',
      {
        id: community_id,
        namespace,
        chain_node_id: chain!.id,
        discord_config_id: undefined,
        Addresses: [
          {
            user_id: user?.id,
            role: 'admin',
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
  });

  after(async () => {
    await dispose()();
  });

  it('should should create contest manager metadata', async () => {
    const contest_address = '0xContestAddress';

    const createResult = await command(Contest.CreateContestManagerMetadata(), {
      actor,
      id: contest_address,
      payload: {
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
    });

    expect(createResult).to.deep.eq({
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
    });
  });

  it('should fail to create if community does not exist', async () => {
    const promise = command(Contest.CreateContestManagerMetadata(), {
      actor,
      id: '0x777',
      payload: {
        name,
        community_id: 'does-not-exist',
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

  it('should update contest manager metadata', async () => {
    const { contest_address } = seedResult[0]!.contest_managers![0];

    const updateResult = await command(Contest.UpdateContestManagerMetadata(), {
      actor,
      id: contest_address,
      payload: {
        name: 'xxx',
      },
    });

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

  it('should fail to update if contest manager does not exist', async () => {
    const promise = command(Contest.UpdateContestManagerMetadata(), {
      actor,
      id: 'does-not-exist',
      payload: {
        name: 'xxx',
      },
    });
    expect(promise).to.be.rejectedWith('ContestManager must exist');
  });

  it('should pause and resume contest manager metadata', async () => {
    const { contest_address, paused } = seedResult[0]!.contest_managers![1];

    expect(paused).to.eq(false);

    const pausedResult = await command(Contest.PauseContestManagerMetadata(), {
      actor,
      id: contest_address,
      payload: {},
    });

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
        actor,
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

  it('should fail to pause if contest manager does not exist', async () => {
    const promise = command(Contest.PauseContestManagerMetadata(), {
      actor,
      id: 'does-not-exist',
      payload: {},
    });
    expect(promise).to.be.rejectedWith('ContestManager must exist');
  });

  it('should fail to resume if contest manager does not exist', async () => {
    const promise = command(Contest.ResumeContestManagerMetadata(), {
      actor,
      id: 'does-not-exist',
      payload: {},
    });
    expect(promise).to.be.rejectedWith('ContestManager must exist');
  });
});
