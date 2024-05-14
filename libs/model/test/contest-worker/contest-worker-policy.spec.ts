import { expect } from 'chai';
import Sinon from 'sinon';
import Web3 from 'web3';

import { dispose, handleEvent } from '@hicommonwealth/core';
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

  before(async () => {
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
    await seed('Community', {
      id: communityId,
      chain_node_id: chainNode!.id,
      Addresses: [
        {
          id: addressId,
          user_id: user!.id,
          address,
          role: 'member',
          profile_id: undefined,
        },
      ],
      contest_managers: [
        {
          contest_address: contestAddress,
        },
      ],
    });
    await seed('Thread', {
      id: threadId,
      community_id: communityId,
      address_id: addressId,
      topic_id: undefined,
      deleted_at: undefined,
    });
  });
  after(async () => {
    Sinon.restore();
    await dispose()();
  });

  it('Policy should handle ThreadCreated and ThreadUpvoted events', async () => {
    Sinon.stub(commonProtocol.ContestHelper, 'createWeb3Provider').resolves(
      new Web3(),
    );

    {
      const addContentStub = Sinon.stub(
        commonProtocol.ContestHelper,
        'addContent',
      ).resolves({
        txReceipt: 'aaa',
        contentId: 'bbb',
      });

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
            canvas_action: '',
            canvas_session: '',
            canvas_hash: '',
            kind: '',
            stage: '',
            view_count: 0,
            reaction_count: 0,
            reaction_weights_sum: 0,
            comment_count: 0,
            max_notif_id: 0,
            deleted_at: undefined,
          },
        },
        true,
      );

      const fnArgs = addContentStub.args[0];
      expect(fnArgs[1]).to.equal(
        contestAddress,
        'addContent called with wrong contractAddress',
      );
      expect(fnArgs[2]).to.equal(
        address,
        'addContent called with wrong userAddress',
      );
      expect(fnArgs[3]).to.equal(
        '/ethhh/discussion/888-hello-there',
        'addContent called with wrong contentUrl',
      );
    }

    {
      const voteContentStub = Sinon.stub(
        commonProtocol.ContestHelper,
        'voteContent',
      ).resolves('abc');

      const contestId = 2;
      const contentId = 199;

      const contest = await models.Contest.create({
        contest_address: contestAddress,
        contest_id: contestId,
        start_time: new Date(),
        end_time: new Date(),
        winners: [],
      });

      await models.ContestAction.create({
        contest_address: contestAddress,
        contest_id: contest.contest_id,
        content_id: contentId,
        actor_address: address,
        action: 'added',
        content_url: '/ethhh/discussion/888-hello-there',
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
          comment_id: 0,
        },
      });

      const fnArgs = voteContentStub.args[0];
      expect(fnArgs[1]).to.equal(
        contestAddress,
        'voteContent called with wrong contractAddress',
      );
      expect(fnArgs[2]).to.equal(
        address,
        'voteContent called with wrong userAddress',
      );
      expect(fnArgs[3]).to.equal(
        contentId.toString(),
        'voteContent called with wrong contentId',
      );
    }
  });
});
