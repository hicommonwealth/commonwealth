import { logger } from '@hicommonwealth/core';
import { GetTweetsWithMetricsResponse } from '@hicommonwealth/schemas';
import z from 'zod/v4';
import { TwitterBotConfig } from '../types';
import { getFromTwitter } from '../utils';

const log = logger(import.meta);

// https://docs.x.com/x-api/posts/post-lookup-by-post-ids
export async function getTweets({
  twitterBotConfig,
  tweetIds,
}: {
  twitterBotConfig: TwitterBotConfig;
  tweetIds: string[];
}): Promise<z.infer<typeof GetTweetsWithMetricsResponse>['data']> {
  const allTweets: z.infer<typeof GetTweetsWithMetricsResponse>['data'] = [];

  // Process ids in chunks of 100
  for (let i = 0; i < tweetIds.length; i += 100) {
    const idChunk = tweetIds.slice(i, i + 100);

    const res = await getFromTwitter({
      twitterBotConfig,
      url: 'https://api.x.com/2/tweets',
      queryParams: {
        'tweet.fields': 'public_metrics',
        ids: idChunk.join(','),
      },
    });

    const parsedRes = GetTweetsWithMetricsResponse.parse(res.jsonBody);

    if (parsedRes.errors) {
      for (const error of parsedRes.errors) {
        log.error(
          'Error occurred fetching tweet metrics',
          new Error(JSON.stringify(error)),
          {
            botName: twitterBotConfig.name,
          },
        );
      }
    }

    allTweets.push(...(parsedRes.data || []));

    // If we've hit the rate limit, return what we have so far
    if (res.requestsRemaining === 0) {
      log.warn('Hit rate limit while fetching tweet metrics', {
        processedIds: allTweets.length,
        totalIds: tweetIds.length,
      });
      break;
    }
  }

  return allTweets;
}
