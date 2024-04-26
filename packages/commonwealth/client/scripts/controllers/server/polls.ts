/* eslint-disable no-restricted-globals */
import axios from 'axios';
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
    try {
      const response = await axios.get(
        `${app.serverUrl()}/threads/${threadId}/polls`,
        {
          params: {
            chain: communityId,
          },
        },
      );

      for (const poll of response.data.result) {
        const modeledPoll = modelFromServer(poll);
        const existingPoll = this._store.getById(modeledPoll.id);
        if (existingPoll) {
          this._store.remove(existingPoll);
        }
        this._store.add(modeledPoll);
      }
    } catch (err) {
      console.log('Failed to fetch thread polls');
      throw new Error(
        err.response && err.response.data.error
          ? err.response.data.error
          : 'Failed to fetch thread polls',
      );
    }
  }

  public async setPolling(args: {
    threadId: number;
    prompt: string;
    options: string[];
    customDuration?: string;
    authorCommunity: string;
    address: string;
  }) {
    const {
      threadId,
      prompt,
      options,
      customDuration,
      authorCommunity,
      address,
    } = args;

    const response = await axios.post(
      `${app.serverUrl()}/threads/${threadId}/polls`,
      {
        community_id: app.activeChainId(),
        author_chain: authorCommunity,
        address,
        jwt: app.user.jwt,
        prompt,
        options,
        custom_duration: customDuration?.split(' ')[0],
      },
    );

    const modeledPoll = modelFromServer(response.data.result);
    // TODO: updateThreadInAllCaches should not be used anywhere outside of the /api/state folder
    // This is an exception until polls get migrated to react query
    updateThreadInAllCaches(app.activeChainId(), threadId, {
      hasPoll: true,
    });
    this._store.add(modeledPoll);
  }

  public async deletePoll(args: {
    authorCommunity: string;
    address: string;
    threadId: number;
    pollId: number;
  }) {
    const { authorCommunity, address, threadId, pollId } = args;

    try {
      await axios.delete(`${app.serverUrl()}/polls/${pollId}`, {
        data: {
          community_id: app.activeChainId(),
          author_chain: authorCommunity,
          address,
          jwt: app.user.jwt,
          poll_id: pollId,
        },
      });

      // TODO: updateThreadInAllCaches should not be used anywhere outside of the /api/state folder
      // This is an exception until polls get migrated to react query
      updateThreadInAllCaches(app.activeChainId(), threadId, {
        hasPoll: false,
      });
      this._store.remove(this._store.getById(pollId));
    } catch (err) {
      console.log('Failed to delete poll');
      throw new Error(
        err.response && err.response.data.error
          ? err.response.data.error
          : 'Failed to delete poll',
      );
    }
  }

  public getByThreadId(threadId) {
    return this._store.getByThreadId(threadId);
  }
}

export default PollsController;
