/* eslint-disable no-restricted-globals */
import $ from 'jquery';
import Poll from '../../models/Poll';
import Vote from '../../models/Vote';
import Thread from '../../models/Thread';
import moment from 'moment';
import app from 'state';

import PollStore from 'stores/PollStore';

export const modelFromServer = (poll) => {
  const {
    id,
    thread_id,
    chain_id,
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
    chainId: chain_id,
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

  public async fetchPolls(chainId: string, threadId: number) {
    await $.ajax({
      url: `${app.serverUrl()}/getPolls`,
      type: 'GET',
      data: {
        chain: chainId,
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
        const thread = app.threads.getById(threadId);
        const updatedThread = new Thread({ ...thread, hasPoll: true });
        app.threads.updateThreadInStore(updatedThread);
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

  public async deletePoll(args: { threadId: number; pollId: number }) {
    const { threadId, pollId } = args;
    await $.ajax({
      url: `${app.serverUrl()}/deletePoll`,
      type: 'DELETE',
      data: {
        thread_id: threadId,
        poll_id: pollId,
        chain_id: app.activeChainId(),
        jwt: app.user.jwt,
      },
      success: (response) => {
        const thread = app.threads.getById(threadId);
        const updatedThread = new Thread({ ...thread, hasPoll: false });
        app.threads.updateThreadInStore(updatedThread);
        this._store.remove(this._store.getById(pollId));
      },
      error: (err) => {
        console.log('Failed to delete poll');
        throw new Error(
          err.responseJSON && err.responseJSON.error
            ? err.responseJSON.error
            : 'Failed to delete poll'
        );
      },
    });
  }

  public getByThreadId(threadId) {
    return this._store.getByThreadId(threadId);
  }
}

export default PollsController;
