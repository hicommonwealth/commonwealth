import { GetLikingUsersResponse } from '@hicommonwealth/schemas';
import { TwitterBotConfig } from '../types';
import { getFromTwitterWrapper } from '../utils';

// https://docs.x.com/x-api/users/returns-user-objects-that-have-liked-the-provided-post-id
export async function getLikingUsers({
  twitterBotConfig,
  tweetId,
}: {
  twitterBotConfig: TwitterBotConfig;
  tweetId: string;
}) {
  return await getFromTwitterWrapper({
    twitterBotConfig,
    url: `https://api.x.com/2/tweets/${tweetId}/liking_users`,
    queryParams: {},
    oauthMethod: 'oauth1',
    responseSchema: GetLikingUsersResponse,
    paginate: true,
    retryOnRateLimit: true,
  });
}
