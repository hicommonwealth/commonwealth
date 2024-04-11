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
import { Contests } from '../../src/contest/Contests.projection';
import { GetAllContests } from '../../src/contest/GetAllContests.query';
import { bootstrap_testing, seed } from '../../src/tester';

chai.use(chaiAsPromised);

describe('Contests projection lifecycle', () => {
  const actor: Actor = { user: { email: '' } };
  const namespace = 'test-namespace';
  const recurring = 'test-recurring-contest';
  const oneoff = 'test-oneoff-contest';
  const contestId = 1;
  const contentId = 1;
  const contentUrl = 'http://content-1';
  const creator = 'creator-address';
  const voter1 = 'voter-address1';
  const voter2 = 'voter-address2';
  const voter3 = 'voter-address3';
  const votingPower1 = 1;
  const votingPower2 = 2;
  const votingPower3 = 3;
  const createdAt = new Date();

  before(async () => {
    await bootstrap_testing();
    const [chain] = await seed('ChainNode', { contracts: [] });
    await seed('Community', {
      name: 'test-community',
      namespace,
      chain_node_id: chain!.id,
      discord_config_id: undefined,
      Addresses: [],
      CommunityStakes: [],
      topics: [],
      groups: [],
    });
  });

  after(async () => {
    await dispose()();
  });

  it('should project events on multiple contests', async () => {
    await handleEvent(Contests(), {
      name: schemas.EventNames.RecurringContestManagerDeployed,
      payload: {
        namespace,
        contest: recurring,
        interval: 10,
        createdAt,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestStarted,
      payload: {
        contest: recurring,
        contestId,
        startTime: new Date(),
        endTime: new Date(),
        createdAt,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.OneOffContestManagerDeployed,
      payload: {
        namespace,
        contest: oneoff,
        length: 1,
        createdAt,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestStarted,
      payload: {
        contest: oneoff,
        startTime: new Date(),
        endTime: new Date(),
        createdAt,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestContentAdded,
      payload: {
        contest: oneoff,
        contentId,
        creator,
        url: contentUrl,
        createdAt,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestContentAdded,
      payload: {
        contest: recurring,
        contestId,
        contentId,
        creator,
        url: contentUrl,
        createdAt,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestContentUpvoted,
      payload: {
        contest: recurring,
        contestId,
        contentId,
        address: voter1,
        weight: votingPower1,
        createdAt,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestContentUpvoted,
      payload: {
        contest: recurring,
        contestId,
        contentId,
        address: voter2,
        weight: votingPower2,
        createdAt,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestContentUpvoted,
      payload: {
        contest: oneoff,
        contentId,
        address: voter3,
        weight: votingPower3,
        createdAt,
      },
    });

    const all = await query(GetAllContests(), {
      actor,
      payload: {},
    });
    expect(all?.length).to.eq(2);

    const result = await query(GetAllContests(), {
      actor,
      payload: { contest: recurring },
    });
    expect(result).to.deep.eq([
      {
        contest: recurring,
        contestId,
        startTime: result?.at(0)?.startTime, // sql date
        endTime: result?.at(0)?.endTime, // sql date
        winners: null,
        ContestActions: [
          {
            action: 'added',
            address: creator,
            contentId,
            contentUrl,
            weight: 0,
            createdAt,
          },
          {
            action: 'upvoted',
            address: voter1,
            contentId,
            contentUrl: '',
            weight: 1,
            createdAt,
          },
          {
            action: 'upvoted',
            address: voter2,
            contentId,
            contentUrl: '',
            weight: 2,
            createdAt,
          },
        ],
      },
    ]);
  });

  it('should raise invalid state when community with namespace not found', async () => {
    expect(
      handleEvent(Contests(), {
        name: schemas.EventNames.RecurringContestManagerDeployed,
        payload: {
          namespace: 'not-found',
          contest: recurring,
          interval: 10,
          createdAt,
        },
      }),
    ).to.eventually.be.rejectedWith(InvalidState);
  });
});
