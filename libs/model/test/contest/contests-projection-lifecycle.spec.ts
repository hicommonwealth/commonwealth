import {
  Actor,
  InvalidState,
  dispose,
  handleEvent,
  query,
  schemas,
} from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/shared';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import Sinon from 'sinon';
import { z } from 'zod';
import { Contests } from '../../src/contest/Contests.projection';
import { GetAllContests } from '../../src/contest/GetAllContests.query';
import { contractHelpers } from '../../src/services/commonProtocol';
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
  const start_time = created_at;
  const end_time = new Date(start_time.getTime() + 1000);
  const cancelled = false;
  const payout_structure = [90, 10];
  const prize_percentage = 1;
  const funding_token_address = 'funding-address';
  const image_url = 'url';
  const interval = 10;
  const winners = [
    { creator_address: creator1, prize: 1 },
    { creator_address: creator2, prize: 2 },
  ];
  const community_id = 'community-with-contests';
  const thread_id = 1;
  const thread_title = 'thread-in-contest';
  const ticker = commonProtocol.Denominations.ETH;
  const decimals = commonProtocol.WeiDecimals[commonProtocol.Denominations.ETH];
  const getTokenAttributes = Sinon.stub(contractHelpers, 'getTokenAttributes');
  getTokenAttributes.resolves({
    ticker,
    decimals,
  });

  before(async () => {
    await bootstrap_testing();
    const [chain] = await seed('ChainNode', { contracts: [], url: 'test' });
    const [user] = await seed(
      'User',
      {
        isAdmin: true,
        selected_community_id: undefined,
      },
      //{ mock: true, log: true },
    );
    const [community] = await seed(
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
            contest_address: recurring,
            name: recurring,
            interval,
            topics: [],
            contests: [],
            image_url,
            payout_structure,
            prize_percentage,
            funding_token_address,
            created_at,
            cancelled,
          },
          {
            contest_address: oneoff,
            name: oneoff,
            interval: 0,
            topics: [],
            contests: [],
            image_url,
            payout_structure,
            prize_percentage,
            funding_token_address,
            created_at,
            cancelled,
          },
        ],
      },
      //{ mock: true, log: true },
    );
    await seed(
      'Thread',
      {
        community_id: community?.id,
        Address: community?.Addresses?.at(0),
        id: thread_id,
        title: thread_title,
        address_id: community?.Addresses?.at(0)?.id,
        url: content_url,
        topic_id: undefined,
        view_count: 1,
        reaction_count: 1,
        reaction_weights_sum: 1,
        comment_count: 1,
        max_notif_id: 1,
        discord_meta: undefined,
        deleted_at: undefined, // so we can find it!
      },
      //{ mock: true, log: true },
    );
  });

  after(async () => {
    Sinon.restore();
    await dispose()();
  });

  it('should project events on multiple contests', async () => {
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
        start_time,
        end_time,
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
        start_time,
        end_time,
        created_at,
      },
    });

    await handleEvent(Contests(), {
      name: schemas.EventNames.ContestContentAdded,
      payload: {
        contest_address: oneoff,
        content_id,
        creator_address: creator1,
        content_url,
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
        content_url,
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
      payload: { community_id },
    });
    expect(all?.length).to.eq(2);

    const result = await query(GetAllContests(), {
      actor,
      payload: { community_id, contest_id },
    });
    expect(result).to.deep.eq([
      {
        community_id,
        contest_address: recurring,
        name: recurring,
        prize_percentage,
        payout_structure,
        funding_token_address,
        image_url,
        interval,
        ticker,
        decimals,
        cancelled,
        created_at,
        topics: [],
        contests: [
          {
            contest_id,
            start_time,
            end_time,
            winners: winners.map((w) => ({
              ...w,
              prize: w.prize / 10 ** decimals,
            })),
            actions: [
              {
                action: 'added',
                actor_address: creator2,
                content_id,
                content_url,
                voting_power: 0,
                created_at,
                thread_id,
                thread_title,
              },
              {
                action: 'upvoted',
                actor_address: voter1,
                content_id,
                content_url: null,
                voting_power: 1,
                created_at,
                thread_id,
                thread_title,
              },
              {
                action: 'upvoted',
                actor_address: voter2,
                content_id,
                content_url: null,
                voting_power: 2,
                created_at,
                thread_id,
                thread_title,
              },
            ],
          },
        ],
      },
    ] as Array<z.infer<typeof schemas.queries.ContestResults>>);
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

  it('should raise retryable error when protocol helper fails', async () => {
    // TODO: define retryable error @rbennettcw
    getTokenAttributes.rejects(new Error());
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
    ).to.eventually.be.rejectedWith(Error);
    getTokenAttributes.reset();
  });
});
