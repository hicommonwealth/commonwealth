/* eslint-disable no-restricted-globals */
import $ from 'jquery';
import { Poll, Vote } from 'models';
import moment from 'moment';
import app from 'state';
import { atom } from 'jotai'
import { atomsWithQuery, atomsWithMutation } from 'jotai-tanstack-query'
import { paramsAtom } from 'views/layout';

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

const threadIdAtom = atom(
  (get) => {
    const params = get(paramsAtom);
    // POLLS PAGE (dummy page)
    if (params.thread_id) return params?.thread_id;

    // view thread page (not dummy page)
    // TODO: this value should be accessible from the thread store
    //   as an atom defining the current thread loaded. However, in the
    //   interim, we can parse it out directly.
    if (params.identifier) {
      return params.identifier.split('-')[0];
    }
  }
);

export const [pollAtom] = atomsWithQuery<Poll[]>((get) => ({
  queryKey: ['polls', get(threadIdAtom)],
  queryFn: async ({ queryKey: [, thread_id] }) => {
    if (!thread_id) return [];
    const response = await $.get(
      `${app.serverUrl()}/getPolls`,
      {
        chain: app.activeChainId(),
        thread_id,
      }
    );
    return response.result.map(modelFromServer);
  },
}));

// TODO: this needs to trigger an invalidation/redraw of the queried proposals atom above
export const [, createPollAtom] = atomsWithMutation((get) => ({
  mutationKey: ['createPoll'],
  mutationFn: async (args: {
    threadId: number;
    prompt: string;
    options: string[];
    customDuration?: string;
    authorChain: string;
    address: string;
  }) => {
    const { threadId, prompt, options, customDuration, authorChain, address } = args;

    const response = await $.ajax({
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
      }
    });
    if (response?.status !== 'Success') {
      throw new Error(response?.error || 'Failed to initialize polling');
    }
    return modelFromServer(response.result);
  },
}));
