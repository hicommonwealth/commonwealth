/* eslint-disable no-restricted-globals */
import _ from 'lodash';
import $ from 'jquery';

import app from 'state';
import PollStore from 'stores/PollStore';
import OffchainPoll from 'models/OffchainPoll';
import { OffchainPollInstance } from 'server/models/offchain_poll';
import { OffchainVote } from 'client/scripts/models';
import moment from 'moment';

export const modelFromServer = (poll: OffchainPollInstance) => {
  const {
    id,
    thread_id,
    chain_id,
    prompt,
    options,
    ends_at,
    votes,
    created_at,
  } = poll;

  return new OffchainPoll({
    id,
    threadId: thread_id,
    chainId: chain_id,
    prompt,
    options: JSON.parse(options),
    endsAt: moment(ends_at),
    votes: votes.map((v) => new OffchainVote(v)),
    createdAt: moment(created_at),
  });
};

class PollsController {
  private _store = new PollStore();

  public get store() {
    return this._store;
  }

  public async fetchPolls(chainId: string, threadId: number) {
    await $.ajax({
      url: `${app.serverUrl()}/getPolls`,
      type: 'GET',
      data: {
        chain: chainId,
        thread_id: threadId,
      },
      success: (response) => {
        console.log(response);
        for (const poll of response.result) {
          console.log(poll);
          const modeledPoll = modelFromServer(response.result);
          this._store.add(modeledPoll);
        }
      },
      error: (err) => {
        console.log('Failed to fetch thread polls');
        throw new Error(
          err.responseJSON && err.responseJSON.error
            ? err.responseJSON.error
            : 'Failed to fetch thread polls'
        );
      },
    });
  }

  public async setPolling(args: {
    threadId: number;
    prompt: string;
    options: string[];
    customDuration?: string;
    authorChain: string;
    address: string;
  }) {
    const { threadId, prompt, options, customDuration, authorChain, address } =
      args;

    await $.ajax({
      url: `${app.serverUrl()}/createPoll`,
      type: 'POST',
      data: {
        chain: app.activeChainId(),
        thread_id: threadId,
        prompt,
        options: JSON.stringify(options),
        custom_duration: customDuration?.split(' ')[0],
        author_chain: authorChain,
        address,
        jwt: app.user.jwt,
      },
      success: (response) => {
        const modeledPoll = modelFromServer(response.result);
        this._store.add(modeledPoll);
      },
      error: (err) => {
        console.log('Failed to initialize polling');
        throw new Error(
          err.responseJSON && err.responseJSON.error
            ? err.responseJSON.error
            : 'Failed to initialize polling'
        );
      },
    });
  }

  public getByThreadId(threadId) {
    return this._store.getByThreadId(threadId);
  }
}

export default PollsController;
