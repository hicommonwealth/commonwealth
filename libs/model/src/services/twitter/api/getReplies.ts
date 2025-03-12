import { GetRepliesResponse } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { TwitterBotConfig } from '../types';
import { getFromTwitterWrapper } from '../utils';

/**
 * Fetches users who replied to a specific tweet
 */
export async function getReplies({
  twitterBotConfig,
  tweetId,
}: {
  twitterBotConfig: TwitterBotConfig;
  tweetId: string;
}): Promise<z.infer<typeof GetRepliesResponse>['data']> {
  return await getFromTwitterWrapper({
    twitterBotConfig,
    url: `https://api.x.com/2/tweets/search/recent`,
    queryParams: {
      query: `conversation_id:${tweetId}`,
      'tweet.fields': 'author_id,created_at,conversation_id',
      expansions: 'author_id',
      'user.fields': 'id,name,username,profile_image_url',
    },
    oauthMethod: 'oauth2',
    responseSchema: GetRepliesResponse,
    paginate: true,
    retryOnRateLimit: true,
  });
}
