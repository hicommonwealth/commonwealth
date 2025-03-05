import { config, dispose, handleEvent } from '@hicommonwealth/core';
import * as evm from '@hicommonwealth/evm-protocols';
import { literal } from 'sequelize';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { emitEvent, models } from '../../src';
import { Contests } from '../../src/contest';
import { ContestWorker } from '../../src/policies';
import { seed } from '../../src/tester';
import { drainOutbox } from '../utils/outbox-drain';

describe('Contest Worker Policy Lifecycle', () => {
  const addressId = 444;
  const address = '0x0';
  const communityId = 'ethhh';
  const threadId = 888;
  const threadTitle = 'Hello There';
  const contestAddress = '0x1';
  const contestId = 0;
  const topicId: number = 0;

  beforeAll(async () => {
    const [chainNode] = await seed('ChainNode');
    const [user] = await seed(
      'User',
      {
        isAdmin: false,
        selected_community_id: undefined,
      },
      //{ mock: true, log: true },
    );
    await seed('Community', {
      id: communityId,
      chain_node_id: chainNode!.id,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          id: addressId,
          user_id: user!.id,
          address,
          role: 'member',
        },
      ],
      topics: [
        {
          id: topicId,
          name: 'hello',
          community_id: communityId,
          group_ids: [],
        },
      ],
      contest_managers: [
        {
          contest_address: contestAddress,
          cancelled: false,
          ended: false,
          is_farcaster_contest: false,
          topic_id: topicId,
          interval: 0,
          contests: [
            {
              contest_address: contestAddress,
              contest_id: contestId,
              start_time: new Date(),
              end_time: new Date(new Date().getTime() + 60 * 60 * 1000),
              score: [],
            },
          ],
          environment: config.APP_ENV,
        },
      ],
    });
    await seed('Thread', {
      id: threadId,
      community_id: communityId,
      address_id: addressId,
      topic_id: topicId,
      deleted_at: undefined,
      pinned: false,
      read_only: false,
      reaction_weights_sum: '0',
    });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await dispose()();
  });

  test('Handle ThreadCreated, ThreadUpvoted and Rollover', async () => {
    const addContentStub = vi
      .spyOn(evm, 'addContentBatch')
      .mockResolvedValue([]);

    const rolloverContestStub = vi
      .spyOn(evm, 'rollOverContest')
      .mockResolvedValue(true);

    const getContestScoreStub = vi
      .spyOn(evm, 'getContestScore')
      .mockResolvedValue({ contestBalance: '0', scores: [] });

    await emitEvent(models.Outbox, [
      {
        event_name: 'ThreadCreated',
        event_payload: {
          id: threadId,
          community_id: communityId,
          address_id: addressId,
          title: threadTitle,
          created_by: address,
          canvas_signed_data: '',
          canvas_msg_id: '',
          kind: '',
          stage: '',
          body: '',
          view_count: 0,
          reaction_count: 0,
          reaction_weights_sum: '0',
          comment_count: 0,
          deleted_at: undefined,
          pinned: false,
          read_only: false,
          topic_id: topicId,
          contestManagers: [
            {
              contest_address: contestAddress,
            },
          ],
        },
      },
    ]);

    await drainOutbox(['ThreadCreated'], ContestWorker);

    expect(addContentStub).toHaveBeenCalled();

    const voteContentStub = vi
      .spyOn(evm, 'voteContentBatch')
      .mockResolvedValue([]);

    await emitEvent(models.Outbox, [
      {
        event_name: 'ContestContentAdded',
        event_payload: {
          content_id: 0,
          content_url: '/ethhh/discussion/888',
          contest_address: contestAddress,
          creator_address: address,
        },
      },
    ]);

    await drainOutbox(['ContestContentAdded'], Contests);

    const contentProjection = await models.ContestAction.findOne({
      where: {
        action: 'added',
        contest_address: contestAddress,
        contest_id: contestId,
        content_url: '/ethhh/discussion/888',
      },
    });

    expect(contentProjection).to.exist;

    await emitEvent(models.Outbox, [
      {
        event_name: 'ThreadUpvoted',
        event_payload: {
          community_id: communityId,
          address_id: addressId,
          reaction: 'like',
          thread_id: threadId,
          topic_id: topicId,
          contestManagers: [{ contest_address: contestAddress }],
        },
      },
    ]);

    await drainOutbox(['ThreadUpvoted'], ContestWorker);

    expect(voteContentStub).toHaveBeenCalled();

    await handleEvent(ContestWorker(), {
      name: 'ContestRolloverTimerTicked',
      payload: {},
    });

    const contestManagerBeforeContestEnded =
      await models.ContestManager.findByPk(contestAddress);
    expect(
      contestManagerBeforeContestEnded!.ended,
      'contest should not be rolled over yet',
    ).to.be.false;

    // @rbennettcw how to simulate an ending contest to validate
    // that the ending flag is set and ContestEnding event is emitted?

    // simulate contest has ended
    await models.Contest.update(
      {
        start_time: literal(`NOW() - INTERVAL '10 seconds'`),
        end_time: literal(`NOW() - INTERVAL '5 seconds'`),
      },
      {
        where: {
          contest_address: contestAddress,
          contest_id: contestId,
        },
      },
    );

    await handleEvent(ContestWorker(), {
      name: 'ContestRolloverTimerTicked',
      payload: {},
    });

    expect(rolloverContestStub, 'contest rolled over').toHaveBeenCalledOnce();
    // score is fetched for upvote and rollover
    expect(getContestScoreStub, 'get final score').toHaveBeenCalledTimes(2);

    const contestManagerAfterContestEnded =
      await models.ContestManager.findByPk(contestAddress);

    expect(
      contestManagerAfterContestEnded!.ended,
      'contest should have rolled over',
    ).toBeTruthy();
    expect(
      contestManagerAfterContestEnded?.ending,
      'ending flag reset',
    ).toBeFalsy();

    const events = await drainOutbox(['ContestEnded']);
    expect(events.length, 'contest ended emitted').toBeGreaterThan(0);
  });
});
