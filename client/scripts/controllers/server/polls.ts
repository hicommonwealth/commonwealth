/* eslint-disable no-restricted-globals */
import _ from 'lodash';
import moment from 'moment';
import $ from 'jquery';

import app from 'state';
import PollStore from 'client/scripts/stores/PollStore';

export const modelFromServer = (poll) => {
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
    options,
    endsAt: ends_at,
    votes,
    createdAt: created_at,
  });
};

class PollsController {
  private _store = new PollStore<OffchainPoll>();

  public get store() {
    return this._store;
  }

  public async setPolling(args: {
    threadId: number;
    name: string;
    choices: string[];
    customDuration?: string;
  }) {
    const { threadId, name, choices, customDuration } = args;
    // start polling
    await $.ajax({
      url: `${app.serverUrl()}/updateThreadPolling`,
      type: 'POST',
      data: {
        chain: app.activeChainId(),
        jwt: app.user.jwt,
        thread_id: threadId,
        content: JSON.stringify({ name, choices }),
        custom_duration: customDuration?.split(' ')[0],
      },
      success: (response) => {
        const thread = this._store.getByIdentifier(threadId);
        if (!thread) {
          // TODO: sometimes the thread may not be in the store
          location.reload();
          return;
        }
        // TODO: This should be handled properly
        // via controller/store & update method
        thread.offchainVotingEnabled = true;
        thread.offchainVotingOptions = { name, choices };
        thread.offchainVotingNumVotes = 0;
        thread.offchainVotingEndsAt = response.result.offchain_voting_ends_at
          ? moment(response.result.offchain_voting_ends_at)
          : null;
      },
      error: (err) => {
        console.log('Failed to start polling');
        throw new Error(
          err.responseJSON && err.responseJSON.error
            ? err.responseJSON.error
            : 'Failed to start polling'
        );
      },
    });
  }

  public getByThread(threadId) {
    return this._store.getByThreadId(threadId);
  }
}

export default PollsController;
