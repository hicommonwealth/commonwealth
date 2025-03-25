import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { awardTweetEngagementXp } from '../services/twitter';

const inputs = {
  TweetEngagementCapReached: events.TweetEngagementCapReached,
};

export function TwitterEngagementPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      TweetEngagementCapReached: async ({ payload }) => {
        await awardTweetEngagementXp(payload);
      },
    },
  };
}
