import Sinon from 'sinon';

import { dispose, EventNames, handleEvent } from '@hicommonwealth/core';
import {
  commonProtocol,
  ContestWorker,
  emitEvent,
  models,
} from '@hicommonwealth/model';
import { expect } from 'chai';
import { Contests } from 'model/src/contest';
import { literal } from 'sequelize';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { seed } from '../../src/tester';
import { drainOutbox } from '../utils';

describe('Check Contests', () => {
  const addressId = 444;
  const address = '0x0';
  const communityId = 'ethhh';
  const threadId = 888;
  const threadTitle = 'Hello There';
  const contestAddress = '0x1';
  const contestId = 0;
  const topicId: number = 0;

  beforeAll(async () => {
    const [chainNode] = await seed('ChainNode', { contracts: [] });
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
    Sinon.restore();
    await dispose()();
  });

  test('Should add onchain vote to unvoted contest', async () => {
    const addContentStub = Sinon.stub(
      commonProtocol.contestHelper,
      'addContentBatch',
    ).resolves([]);

    await emitEvent(models.Outbox, [
      {
        event_name: EventNames.ThreadCreated,
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

    expect(addContentStub.called, 'addContent was not called').to.be.true;

    await emitEvent(models.Outbox, [
      {
        event_name: EventNames.ContestContentAdded,
        event_payload: {
          content_id: 0,
          content_url: '/ethhh/discussion/888',
          contest_address: contestAddress,
          creator_address: address,
        },
      },
    ]);

    await drainOutbox(['ContestContentAdded'], Contests);

    const voteContentStub = Sinon.stub(
      commonProtocol.contestHelper,
      'voteContentBatch',
    ).resolves([]);

    // simulate contest will end in 2 hours
    await models.Contest.update(
      {
        end_time: literal(`NOW() + INTERVAL '2 hours'`),
      },
      {
        where: {
          contest_address: contestAddress,
          contest_id: contestId,
        },
      },
    );

    await handleEvent(ContestWorker(), {
      name: EventNames.ContestRolloverTimerTicked,
      payload: {},
    });

    expect(voteContentStub.called, 'vote should not be cast yet').to.be.false;

    // simulate contest will end in less than 1 hour
    await models.Contest.update(
      {
        end_time: literal(`NOW() + INTERVAL '50 minutes'`),
      },
      {
        where: {
          contest_address: contestAddress,
          contest_id: contestId,
        },
      },
    );

    await handleEvent(ContestWorker(), {
      name: EventNames.ContestRolloverTimerTicked,
      payload: {},
    });

    expect(voteContentStub.called, 'vote should have been cast').to.be.true;
    expect(
      voteContentStub.args[0][1].startsWith('0x'),
      'using valid wallet address',
    ).to.be.true;
    expect(voteContentStub.args[0][1]).has.length(
      42,
      'using valid wallet address',
    );
  });
});
