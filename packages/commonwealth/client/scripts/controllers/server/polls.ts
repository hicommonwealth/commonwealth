/* eslint-disable no-restricted-globals */
import $ from 'jquery';
import moment from 'moment';
import app from 'state';
import { updateThreadInAllCaches } from 'state/api/threads/helpers/cache';
import PollStore from 'stores/PollStore';
import Poll from '../../models/Poll';
import Vote from '../../models/Vote';

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
      url: `${app.serverUrl()}/threads/${threadId}/polls`,
      type: 'GET',
      data: {
        chain: chainId,
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
      url: `${app.serverUrl()}/threads/${threadId}/polls`,
      type: 'POST',
      data: {
        chain: app.activeChainId(),
        author_chain: authorChain,
        address,
        jwt: app.user.jwt,
        prompt,
        options,
        custom_duration: customDuration?.split(' ')[0],
      },
      success: (response) => {
        const modeledPoll = modelFromServer(response.result);
        // TODO: updateThreadInAllCaches should not be used anywhere outside of the /api/state folder
        // This is an exception until polls get migrated to react query
        updateThreadInAllCaches(app.activeChainId(), threadId, {
          hasPoll: true,
        });
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

  public async deletePoll(args: {
    authorChain: string;
    address: string;
    threadId: number;
    pollId: number;
  }) {
    const { authorChain, address, threadId, pollId } = args;
    await $.ajax({
      url: `${app.serverUrl()}/polls/${pollId}`,
      type: 'DELETE',
      data: {
        chain_id: app.activeChainId(),
        author_chain: authorChain,
        address,
        jwt: app.user.jwt,
        poll_id: pollId,
      },
      success: (response) => {
        // TODO: updateThreadInAllCaches should not be used anywhere outside of the /api/state folder
        // This is an exception until polls get migrated to react query
        updateThreadInAllCaches(app.activeChainId(), threadId, {
          hasPoll: false,
        });
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
