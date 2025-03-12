import { GetRetweetsResponse } from '@hicommonwealth/schemas';
import { TwitterBotConfig } from '../types';
import { getFromTwitterWrapper } from '../utils';

type Retweet = { id: string; username: string };

/**
 * Fetches users who liked a specific tweet
 */
export async function getRetweets({
  twitterBotConfig,
  tweetId,
}: {
  twitterBotConfig: TwitterBotConfig;
  tweetId: string;
}): Promise<Retweet[]> {
  return await getFromTwitterWrapper({
    twitterBotConfig,
    url: `https://api.x.com/2/tweets/${tweetId}/liking_users`,
    queryParams: {},
    oauthMethod: 'oauth1',
    responseSchema: GetRetweetsResponse,
    paginate: true,
    retryOnRateLimit: true,
  });
}
