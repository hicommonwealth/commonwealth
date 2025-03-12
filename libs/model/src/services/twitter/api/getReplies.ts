import { logger } from '@hicommonwealth/core';
import { RepliesResponse } from '@hicommonwealth/schemas';
import { TwitterBotConfig } from '../types';
import { getFromTwitter } from '../utils';

const log = logger(import.meta);

/**
 * Fetches users who replied to a specific tweet
 */
export async function getReplies({
  twitterBotConfig,
  tweetId,
}: {
  twitterBotConfig: TwitterBotConfig;
  tweetId: string;
}): Promise<any[]> {
  const allReplies: any[] = [];
  let paginationToken: string | undefined;
  let requestsRemaining: number;
  const maxResults = 100;
  let numResults = 0;

  do {
    const res = await getFromTwitter({
      twitterBotConfig,
      url: `https://api.x.com/2/tweets/search/recent`,
      queryParams: {
        query: `conversation_id:${tweetId}`,
        max_results: maxResults,
        'tweet.fields': 'author_id,created_at,conversation_id',
        expansions: 'author_id',
        'user.fields': 'id,name,username,profile_image_url',
        ...(paginationToken ? { next_token: paginationToken } : {}),
      },
      oauthMethod: 'oauth2',
    });

    requestsRemaining = 0;
    const parsedRes = RepliesResponse.parse(res.jsonBody);
    paginationToken = parsedRes.meta?.next_token;
    requestsRemaining = res.requestsRemaining;

    if (parsedRes.errors) {
      for (const error of parsedRes.errors) {
        log.error(
          'Error occurred fetching replies',
          new Error(JSON.stringify(error)),
          {
            botName: twitterBotConfig.name,
            tweetId,
          },
        );
      }
    }

    if (parsedRes.data) {
      allReplies.push(...parsedRes.data);
      numResults = parsedRes.data.length;
    }

    // If we've hit the rate limit, return what we have so far
    if (requestsRemaining === 0 && paginationToken) {
      log.error('Hit rate limit while fetching replies', undefined, {
        botName: twitterBotConfig.name,
        tweetId,
        repliesCollected: allReplies.length,
      });
      break;
    }
  } while (
    paginationToken &&
    numResults === maxResults &&
    requestsRemaining > 0
  );

  return allReplies;
}
