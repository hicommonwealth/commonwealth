import { CustomRetryStrategyError, logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { awardTweetEngagementXp, HttpError } from '../services/twitter';
const log = logger(import.meta);

const inputs = {
  TweetEngagementCapReached: events.TweetEngagementCapReached,
};

export function TwitterEngagementPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      TweetEngagementCapReached: async ({ payload }) => {
        try {
          await awardTweetEngagementXp(payload);
        } catch (error) {
          if (error instanceof HttpError && error.statusCode === 400) {
            log.error('Error awarding tweet engagement xp', error);
            // dead letter immediately since retries will not help
            throw new CustomRetryStrategyError(
              'Error awarding tweet engagement xp',
              { strategy: 'nack' },
            );
          } else if (error instanceof HttpError && error.statusCode === 429) {
            // rate limit exceeded
            throw new CustomRetryStrategyError('Rate limit exceeded', [
              { strategy: 'republish', defer: 60_000 * 5, attempts: 3 },
              { strategy: 'nack' },
            ]);
          } else {
            throw error;
          }
        }
      },
    },
  };
}
