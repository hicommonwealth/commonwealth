import { events, Policy } from '@hicommonwealth/core';
import { buildThreadContentUrl } from '../utils';
import {
  createOnchainContestContent,
  createOnchainContestVote,
} from './contest-utils';

const inputs = {
  ThreadCreated: events.ThreadCreated,
  ThreadUpvoted: events.ThreadUpvoted,
};

export function ContestWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      ThreadCreated: async ({ payload }) => {
        const content_url = buildThreadContentUrl(
          payload.community_id,
          payload.id!,
        );
        await createOnchainContestContent({
          community_id: payload.community_id,
          topic_id: payload.topic_id!,
          content_url,
          author_address: payload.address!,
        });
      },
      ThreadUpvoted: async ({ payload }) => {
        const content_url = buildThreadContentUrl(
          payload.community_id,
          payload.thread_id,
        );
        await createOnchainContestVote({
          community_id: payload.community_id,
          topic_id: payload.topic_id!,
          content_url,
          author_address: payload.address!,
        });
      },
    },
  };
}
