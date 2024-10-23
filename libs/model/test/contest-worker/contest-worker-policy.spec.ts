import { expect } from 'chai';
import Sinon from 'sinon';

import { dispose, handleEvent } from '@hicommonwealth/core';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { commonProtocol, models } from '../../src';
import { ContestWorker } from '../../src/policies';
import { bootstrap_testing, seed } from '../../src/tester';

describe('Contest Worker Policy', () => {
  const addressId = 444;
  const address = '0x0';
  const communityId = 'ethhh';
  const threadId = 888;
  const threadTitle = 'Hello There';
  const contestAddress = '0x1';
  let topicId: number = 0;

  beforeAll(async () => {
    await bootstrap_testing();
    const [chainNode] = await seed('ChainNode', { contracts: [] });
    const [user] = await seed(
      'User',
      {
        isAdmin: false,
        selected_community_id: undefined,
      },
      //{ mock: true, log: true },
    );
    const [community] = await seed('Community', {
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
      contest_managers: [
        {
          contest_address: contestAddress,
          cancelled: false,
        },
      ],
      topics: [
        {
          name: 'zzz',
        },
      ],
    });
    topicId = community!.topics![0].id!;
    expect(topicId, 'topicId not assigned').to.exist;
    await models.ContestTopic.create({
      topic_id: topicId,
      contest_address: community!.contest_managers![0].contest_address!,
      created_at: new Date(),
    });
    await seed('Thread', {
      id: threadId,
      community_id: communityId,
      address_id: addressId,
      topic_id: topicId,
      deleted_at: undefined,
      pinned: false,
      read_only: false,
    });
  });

  afterAll(async () => {
    Sinon.restore();
    await dispose()();
  });

  // TODO: fix this test
  test.skip('Policy should handle ThreadCreated and ThreadUpvoted events', async () => {
    {
      const addContentStub = Sinon.stub(
        commonProtocol.contestHelper,
        'addContentBatch',
      ).resolves([]);

      await handleEvent(
        ContestWorker(),
        {
          name: 'ThreadCreated',
          payload: {
            id: threadId,
            community_id: communityId,
            address_id: addressId,
            title: threadTitle,
            created_by: address,
            canvas_signed_data: '',
            canvas_msg_id: '',
            kind: '',
            stage: '',
            view_count: 0,
            reaction_count: 0,
            reaction_weights_sum: '0',
            comment_count: 0,
            deleted_at: undefined,
            pinned: false,
            read_only: false,
            topic_id: topicId,
          },
        },
        true,
      );

      expect(addContentStub.called, 'addContent was not called').to.be.true;
      const fnArgs = addContentStub.args[0];
      expect(fnArgs[1]).to.equal(
        contestAddress,
        'addContent called with wrong contractAddress',
      );
      expect(fnArgs[2]).to.equal(
        [address],
        'addContent called with wrong userAddress',
      );
      expect(fnArgs[3]).to.equal(
        '/ethhh/discussion/888',
        'addContent called with wrong contentUrl',
      );
    }

    {
      const voteContentStub = Sinon.stub(
        commonProtocol.contestHelper,
        'voteContentBatch',
      ).resolves([]);

      const contestId = 2;
      const contentId = 199;

      const contest = await models.Contest.create({
        contest_address: contestAddress,
        contest_id: contestId,
        start_time: new Date(),
        end_time: new Date(),
        score: [],
      });

      await models.ContestAction.create({
        contest_address: contestAddress,
        contest_id: contest.contest_id,
        content_id: contentId,
        actor_address: address,
        action: 'added',
        content_url: '/ethhh/discussion/888',
        thread_id: threadId,
        thread_title: threadTitle,
        voting_power: 10,
        created_at: new Date(),
      });

      await handleEvent(ContestWorker(), {
        name: 'ThreadUpvoted',
        payload: {
          community_id: communityId,
          address_id: addressId,
          reaction: 'like',
          thread_id: threadId,
        },
      });

      const fnArgs = voteContentStub.args[0];
      expect(fnArgs[1]).to.equal(
        contestAddress,
        'voteContent called with wrong contractAddress',
      );
      expect(fnArgs[2]).to.equal(
        [address],
        'voteContent called with wrong userAddress',
      );
      // expect(fnArgs[3]).to.equal(
      //   contentId.toString(),
      //   'voteContent called with wrong contentId',
      // );
    }
  });
});
