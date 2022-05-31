/* eslint-disable no-restricted-globals */
import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import app from 'state';

import PollStore from 'stores/PollStore';
import { Poll, Vote } from 'models';

export const modelFromServer = (poll) => {
  const {
    id,
    thread_id,
    community_id,
    prompt,
    options,
    ends_at,
    votes = [],
    created_at,
  } = poll;

  let pollOptions;
  try {
    pollOptions = JSON.parse(options);
  } catch (e) {
    pollOptions = [];
  }

  return new Poll({
    id,
    threadId: thread_id,
    communityId: community_id,
    prompt,
    options: pollOptions,
    endsAt: moment(ends_at),
    votes: votes.map((v) => new Vote(v)),
    createdAt: moment(created_at),
  });
};

class PollsController {
  private _store = new PollStore();

  public get store() {
    return this._store;
  }

  public async fetchPolls(communityId: string, threadId: number) {
    await $.ajax({
      url: `${app.serverUrl()}/getPolls`,
      type: 'GET',
      data: {
        community_id: communityId,
        thread_id: threadId,
      },
      success: (response) => {
        for (const poll of response.result) {
          const modeledPoll = modelFromServer(poll);
          const existingPoll = this._store.getById(modeledPoll.id);
          if (existingPoll) {
            this._store.remove(existingPoll);
          }
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
        community_id: app.activeChainId(),
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
