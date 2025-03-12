import { logger } from '@hicommonwealth/core';
import { LikingUsersResponse } from '@hicommonwealth/schemas';
import { TwitterBotConfig } from '../types';
import { getFromTwitter } from '../utils';

const log = logger(import.meta);

export type LikingUser = { id: string; username: string };

/**
 * Fetches users who liked a specific tweet
 */
export async function getLikingUsers({
  twitterBotConfig,
  tweetId,
}: {
  twitterBotConfig: TwitterBotConfig;
  tweetId: string;
}): Promise<LikingUser[]> {
  const allUsers: LikingUser[] = [];
  let paginationToken: string | undefined;
  let requestsRemaining: number;
  const maxResults = 100;
  let numResults = 0;
  do {
    const res = await getFromTwitter({
      twitterBotConfig,
      url: `https://api.x.com/2/tweets/${tweetId}/liking_users`,
      queryParams: {
        max_results: maxResults,
        ...(paginationToken ? { pagination_token: paginationToken } : {}),
      },
      oauthMethod: 'oauth1',
    });

    const parsedRes = LikingUsersResponse.parse(res.jsonBody);
    paginationToken = parsedRes.meta?.next_token;
    requestsRemaining = res.requestsRemaining;

    if (parsedRes.errors) {
      for (const error of parsedRes.errors) {
        log.error(
          'Error occurred fetching liking users',
          new Error(JSON.stringify(error)),
          {
            botName: twitterBotConfig.name,
            tweetId,
          },
        );
      }
    }

    if (parsedRes.data) {
      allUsers.push(...parsedRes.data);
      numResults = parsedRes.data.length;
    }

    // If we've hit the rate limit, return what we have so far
    if (requestsRemaining === 0 && paginationToken) {
      log.error('Hit rate limit while fetching liking users', undefined, {
        botName: twitterBotConfig.name,
        tweetId,
        usersCollected: allUsers.length,
      });
      break;
    }
  } while (
    paginationToken &&
    numResults === maxResults &&
    requestsRemaining > 0
  );

  return allUsers;
}
