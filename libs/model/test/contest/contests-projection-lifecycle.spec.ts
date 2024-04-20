import {
  Actor,
  InvalidState,
  dispose,
  handleEvent,
  query,
  schemas,
} from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { z } from 'zod';
import { Contests } from '../../src/contest/Contests.projection';
import { GetAllContests } from '../../src/contest/GetAllContests.query';
import { bootstrap_testing, seed } from '../../src/tester';

chai.use(chaiAsPromised);

describe('Contests projection lifecycle', () => {
  const actor: Actor = { user: { email: '' } };
  const namespace = 'test-namespace';
  const recurring = 'test-recurring-contest';
  const oneoff = 'test-oneoff-contest';
  const contest_id = 1;
  const content_id = 1;
  const content_url = 'http://content-1';
  const creator1 = 'creator-address1';
  const creator2 = 'creator-address2';
  const voter1 = 'voter-address1';
  const voter2 = 'voter-address2';
  const voter3 = 'voter-address3';
  const voting_power1 = 1;
  const voting_power2 = 2;
  const voting_power3 = 3;
  const created_at = new Date();
  const winners = [
    { creator_address: creator1, prize: 1 },
    { creator_address: creator2, prize: 2 },
  ];
  let community_id: string;

  before(async () => {
    await bootstrap_testing();
    const [chain] = await seed('ChainNode', { contracts: [] });
    const [community] = await seed('Community', {
      name: 'test-community',
      namespace,
      chain_node_id: chain!.id,
      discord_config_id: undefined,
      Addresses: [],
      CommunityStakes: [],
      topics: [],
      groups: [],
    });
    community_id = community?.id!;
  });

  after(async () => {
    await dispose()();
  });

  it('should project events on multiple contests', async () => {
    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestManagerMetadataCreated,
      payload: {
        community_id,
        contest_address: recurring,
        created_at,
        name: recurring,
        topics: [],
        image_url: 'url',
        payout_structure: [0.9, 0.1],
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestManagerMetadataCreated,
      payload: {
        community_id,
        contest_address: oneoff,
        created_at,
        name: oneoff,
        topics: [],
        image_url: 'url',
        payout_structure: [0.9, 0.1],
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.RecurringContestManagerDeployed,
      payload: {
        namespace,
        contest_address: recurring,
        interval: 10,
        created_at,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestStarted,
      payload: {
        contest_address: recurring,
        contest_id,
        start_time: new Date(),
        end_time: new Date(),
        created_at,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.OneOffContestManagerDeployed,
      payload: {
        namespace,
        contest_address: oneoff,
        length: 1,
        created_at,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestStarted,
      payload: {
        contest_address: oneoff,
        start_time: new Date(),
        end_time: new Date(),
        created_at,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestContentAdded,
      payload: {
        contest_address: oneoff,
        content_id,
        creator_address: creator1,
        content_url: content_url,
        created_at,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestContentAdded,
      payload: {
        contest_address: recurring,
        contest_id,
        content_id,
        creator_address: creator2,
        content_url: content_url,
        created_at,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestContentUpvoted,
      payload: {
        contest_address: recurring,
        contest_id,
        content_id,
        voter_address: voter1,
        voting_power: voting_power1,
        created_at,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestContentUpvoted,
      payload: {
        contest_address: recurring,
        contest_id,
        content_id,
        voter_address: voter2,
        voting_power: voting_power2,
        created_at,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestContentUpvoted,
      payload: {
        contest_address: oneoff,
        content_id,
        voter_address: voter3,
        voting_power: voting_power3,
        created_at,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestWinnersRecorded,
      payload: {
        contest_address: recurring,
        contest_id,
        winners,
        created_at,
      },
    });

    const all = await query(GetAllContests(), {
      actor,
      payload: {},
    });
    expect(all?.length).to.eq(2);

    const result = await query(GetAllContests(), {
      actor,
      payload: { contest_address: recurring },
    });
    expect(result).to.deep.eq([
      {
        contest_address: recurring,
        contest_id,
        start_time: result?.at(0)?.start_time, // sql date
        end_time: result?.at(0)?.end_time, // sql date
        winners,
        actions: [
          {
            action: 'added',
            actor_address: creator2,
            content_id,
            content_url,
            voting_power: 0,
            created_at,
          },
          {
            action: 'upvoted',
            actor_address: voter1,
            content_id,
            content_url: null,
            voting_power: 1,
            created_at,
          },
          {
            action: 'upvoted',
            actor_address: voter2,
            content_id,
            content_url: null,
            voting_power: 2,
            created_at,
          },
        ] as Array<z.infer<typeof schemas.projections.ContestAction>>,
      },
    ]);
  });

  it('should raise invalid state when community with namespace not found', async () => {
    expect(
      handleEvent(Contests(), {
        name: schemas.EventNames.RecurringContestManagerDeployed,
        payload: {
          namespace: 'not-found',
          contest_address: 'new-address',
          interval: 10,
          created_at,
        },
      }),
    ).to.eventually.be.rejectedWith(InvalidState);
  });
});
