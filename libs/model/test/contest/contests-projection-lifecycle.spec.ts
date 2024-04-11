import {
  Actor,
  dispose,
  handleEvent,
  query,
  schemas,
} from '@hicommonwealth/core';
import { expect } from 'chai';
import { Contests } from '../../src/contest/Contests.projection';
import { GetAllContests } from '../../src/contest/GetAllContests.query';
import { bootstrap_testing, seed } from '../../src/tester';

describe('Contests projection lifecycle', () => {
  const actor: Actor = { user: { email: '' } };
  const namespace = 'test-namespace';
  const contest = 'test-contest';
  const contestId = 1;
  const contentId = 1;
  const contentUrl = 'http://content-1';
  const creator = 'creator-address';
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

  it('should project events', async () => {
    await handleEvent(Contests(), {
      name: schemas.EventNames.RecurringContestManagerDeployed,
      payload: {
        namespace,
        contest,
        interval: 10,
        createdAt,
      },
    });
    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestStarted,
      payload: {
        contest,
        contestId,
        startTime: new Date(),
        endTime: new Date(),
        createdAt,
      },
    });
    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestContentAdded,
      payload: {
        contest,
        contestId,
        contentId,
        creator,
        url: contentUrl,
        createdAt,
      },
    });

    const result = await query(GetAllContests(), {
      actor,
      payload: { contest },
    });
    //console.log(result);

    expect(result).to.deep.eq([
      {
        action: 'added',
        address: creator,
        contentId,
        contentUrl,
        contest,
        contestId,
        weight: 0,
        createdAt,
      },
    ]);
  });
});
