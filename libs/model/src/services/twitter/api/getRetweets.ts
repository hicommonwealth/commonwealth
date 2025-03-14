import { GetRetweetsResponse } from '@hicommonwealth/schemas';
import { TwitterBotConfig } from '../types';
import { getFromTwitterWrapper } from '../utils';

// https://docs.x.com/x-api/users/returns-user-objects-that-have-retweeted-the-provided-post-id
export async function getRetweets({
  twitterBotConfig,
  tweetId,
}: {
  twitterBotConfig: TwitterBotConfig;
  tweetId: string;
}) {
  return await getFromTwitterWrapper({
    twitterBotConfig,
    url: `https://api.x.com/2/tweets/${tweetId}/retweeted_by`,
    queryParams: {
      'tweet.fields': 'id,created_at',
    },
    oauthMethod: 'oauth2',
    responseSchema: GetRetweetsResponse,
    paginate: true,
    retryOnRateLimit: true,
  });
}
