import { BigNumber } from '@ethersproject/bignumber';
import {
  Actor,
  DeepPartial,
  dispose,
  handleEvent,
  query,
} from '@hicommonwealth/core';
import * as evm from '@hicommonwealth/evm-protocols';
import { createEventRegistryChainNodes, models } from '@hicommonwealth/model';
import { ContestResults } from '@hicommonwealth/schemas';
import { CONTEST_FEE_PERCENT, delay } from '@hicommonwealth/shared';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { z } from 'zod';
import { Contests } from '../../src/contest/Contests.projection';
import { GetAllContests } from '../../src/contest/GetAllContests.query';
import { seed } from '../../src/tester';

chai.use(chaiAsPromised);

const { commonProtocol } = evm;

// TODO: re-enable test
describe('Contests projection lifecycle', () => {
  const actor: Actor = { user: { email: '' } };
  const namespace = 'test-namespace';
  const recurring = '0x0000000000000000000000000000000000000000';
  const oneoff = 'test-oneoff-contest';
  const contest_id = 1;
  const content_id = 1;
  const content_url = 'http://discussion/1';
  const creator1 = 'creator-address1';
  const creator2 = 'creator-address2';
  const voter1 = 'voter-address1';
  const voter2 = 'voter-address2';
  const voter3 = 'voter-address3';
  const voting_power1 = '1';
  const voting_power2 = '2';
  const voting_power3 = '3';
  const created_at = new Date();
  const start_time = created_at;
  const end_time = new Date(start_time.getTime() + 1000);
  const cancelled = false;
  const payout_structure = [90, 10];
  const prize_percentage = 12;
  const funding_token_address = 'funding-address';
  const image_url = 'url';
  const interval = 10;
  const community_id = 'community-with-contests';
  const thread_id = 1;
  const thread_title = 'thread-in-contest';
  const ticker = commonProtocol.Denominations.ETH;
  const decimals = commonProtocol.WeiDecimals[commonProtocol.Denominations.ETH];
  const topic_id = 100;

  const getTokenAttributes = vi.spyOn(evm, 'getTokenAttributes');
  const getContestScore = vi.spyOn(evm, 'getContestScore');
  const getContestStatus = vi.spyOn(evm, 'getContestStatus');

  beforeAll(async () => {
    try {
      const chainNodes = await createEventRegistryChainNodes();
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
          namespace_address: namespace,
          chain_node_id: chainNodes[0]!.id,
          discord_config_id: undefined,
          lifetime_thread_count: 0,
          profile_count: 1,
          Addresses: [
            {
              user_id: user?.id,
              role: 'admin',
            },
          ],
          CommunityStakes: [],
          topics: [{ id: topic_id, name: 'test-topic' }],
          groups: [],
          contest_managers: [
            {
              contest_address: recurring,
              name: recurring,
              interval,
              contests: [],
              image_url,
              payout_structure,
              prize_percentage,
              funding_token_address,
              created_at,
              cancelled,
              topic_id,
              is_farcaster_contest: true,
            },
            {
              contest_address: oneoff,
              name: oneoff,
              interval: 0,
              contests: [],
              image_url,
              payout_structure,
              prize_percentage,
              funding_token_address,
              created_at,
              cancelled,
              topics: [],
              is_farcaster_contest: false,
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
          topic_id: topic_id,
          view_count: 1,
          reaction_count: 1,
          reaction_weights_sum: '1',
          comment_count: 1,
          discord_meta: undefined,
          deleted_at: undefined, // so we can find it!
          pinned: false,
          read_only: false,
        },
        //{ mock: true, log: true },
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  });

  afterAll(async () => {
    await dispose()();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  test('should project events on multiple contests', async () => {
    const contestBalance = 10000000000;
    const multiplier = (100 - CONTEST_FEE_PERCENT) / 100;
    const prizePool =
      ((Number(contestBalance) * Number(prize_percentage)) / 100) * multiplier;
    const score = [
      {
        creator_address: creator1,
        content_id: content_id.toString(),
        votes: 1,
        prize: ((prizePool * Number(payout_structure[0])) / 100).toString(),
      },
      {
        creator_address: creator2,
        content_id: content_id.toString(),
        votes: 2,
        prize: ((prizePool * Number(payout_structure[1])) / 100).toString(),
      },
    ];
    getTokenAttributes.mockResolvedValue({ ticker, decimals });
    getContestScore.mockResolvedValue([
      {
        creator_address: creator1,
        content_id: content_id.toString(),
        votes: '1',
        prize: '972000000',
      },
      {
        creator_address: creator2,
        content_id: content_id.toString(),
        votes: '2',
        prize: '108000000',
      },
    ]);
    getContestStatus.mockResolvedValue({
      startTime: 1,
      endTime: 100,
      contestInterval: 50,
      lastContentId: '1',
    });

    await handleEvent(Contests(), {
      name: 'RecurringContestManagerDeployed',
      payload: {
        namespace,
        contest_address: recurring,
        interval: 10,
      },
    });

    await handleEvent(Contests(), {
      name: 'ContestStarted',
      payload: {
        contest_address: recurring,
        contest_id,
        start_time,
        end_time,
        is_one_off: false,
      },
    });

    await handleEvent(Contests(), {
      name: 'OneOffContestManagerDeployed',
      payload: {
        namespace,
        contest_address: oneoff,
        length: 1,
      },
    });

    await handleEvent(Contests(), {
      name: 'ContestStarted',
      payload: {
        contest_id: 1,
        contest_address: oneoff,
        start_time,
        end_time,
        is_one_off: true,
      },
    });

    await handleEvent(Contests(), {
      name: 'ContestContentAdded',
      payload: {
        contest_address: oneoff,
        content_id,
        creator_address: creator1,
        content_url,
      },
    });

    await handleEvent(Contests(), {
      name: 'ContestContentAdded',
      payload: {
        contest_address: recurring,
        contest_id,
        content_id,
        creator_address: creator2,
        content_url,
      },
    });

    await handleEvent(Contests(), {
      name: 'ContestContentUpvoted',
      payload: {
        contest_address: recurring,
        contest_id,
        content_id,
        voter_address: voter1,
        voting_power: voting_power1,
      },
    });

    await handleEvent(Contests(), {
      name: 'ContestContentUpvoted',
      payload: {
        contest_address: recurring,
        contest_id,
        content_id,
        voter_address: voter2,
        voting_power: voting_power2,
      },
    });

    await handleEvent(Contests(), {
      name: 'ContestContentUpvoted',
      payload: {
        contest_address: oneoff,
        content_id,
        voter_address: voter3,
        voting_power: voting_power3,
      },
    });

    // wait for projection
    await delay(100);

    const all = await query(GetAllContests(), {
      actor,
      payload: { community_id },
    });
    expect(all?.length).to.eq(2);

    const result = await query(GetAllContests(), {
      actor,
      payload: { community_id, contest_address: recurring, contest_id },
    });

    const recurringActions = await models.ContestAction.findAll({
      where: {
        contest_address: recurring,
      },
    });
    expect(recurringActions.length).to.eq(3);

    expect(result).to.deep.eq([
      {
        community_id,
        contest_address: recurring,
        name: recurring,
        prize_percentage,
        payout_structure,
        funding_token_address,
        image_url,
        description: null,
        interval,
        ticker,
        decimals,
        cancelled,
        created_at,
        topic_id: topic_id,
        topics: [{ id: topic_id, name: 'test-topic' }],
        is_farcaster_contest: true,
        contests: [
          {
            contest_id,
            start_time,
            end_time,
            score_updated_at: result?.at(0)?.contests.at(0)?.score_updated_at,
            score: score.map((s) => ({
              ...s,
              tickerPrize: Number(BigInt(s.prize)) / 10 ** decimals,
              votes: BigNumber.from(s.votes).toString(),
            })),
            // actions: [
            //   {
            //     action: 'added',
            //     actor_address: creator2,
            //     content_id,
            //     content_url,
            //     voting_power: 0,
            //     thread_id,
            //     thread_title,
            //     created_at: recurringActions[0].created_at,
            //   },
            //   {
            //     action: 'upvoted',
            //     actor_address: voter1,
            //     content_id,
            //     content_url: null,
            //     voting_power: 1,
            //     thread_id,
            //     thread_title,
            //     created_at: recurringActions[1].created_at,
            //   },
            //   {
            //     action: 'upvoted',
            //     actor_address: voter2,
            //     content_id,
            //     content_url: null,
            //     voting_power: 2,
            //     thread_id,
            //     thread_title,
            //     created_at: recurringActions[2].created_at,
            //   },
            // ],
          },
        ],
      },
    ] as Array<DeepPartial<z.infer<typeof ContestResults>>>);
  });
});
