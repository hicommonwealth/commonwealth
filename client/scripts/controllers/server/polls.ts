/* eslint-disable no-restricted-globals */
import _ from 'lodash';
import $ from 'jquery';

import app from 'state';
import PollStore from 'client/scripts/stores/PollStore';
import OffchainPoll from 'client/scripts/models/OffchainPoll';

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
  private _store = new PollStore();

  public get store() {
    return this._store;
  }

  public async setPolling(args: {
    threadId: number;
    prompt: string;
    options: string[];
    customDuration?: string;
  }) {
    const { threadId, prompt, options, customDuration } = args;
    await $.post({
      url: `${app.serverUrl()}/createPoll`,
      type: 'POST',
      data: {
        chain: app.activeChainId(),
        thread_id: threadId,
        prompt,
        'options[]': options,
        custom_duration: customDuration?.split(' ')[0],
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
            : 'Failed to start polling'
        );
      },
    });
  }

  public getByThreadId(threadId) {
    return this._store.getByThreadId(threadId);
  }
}

export default PollsController;
