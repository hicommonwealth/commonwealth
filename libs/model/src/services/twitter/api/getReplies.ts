import { GetRepliesResponse } from '@hicommonwealth/schemas';
import { TwitterBotConfig } from '../types';
import { getFromTwitterWrapper } from '../utils';

export async function getReplies({
  twitterBotConfig,
  tweetId,
}: {
  twitterBotConfig: TwitterBotConfig;
  tweetId: string;
}) {
  return await getFromTwitterWrapper({
    twitterBotConfig,
    url: `https://api.x.com/2/tweets/search/recent`,
    queryParams: {
      query: `conversation_id:${tweetId}`,
      'tweet.fields': 'author_id,created_at,conversation_id',
      expansions: 'author_id',
      'user.fields': 'username',
    },
    oauthMethod: 'oauth2',
    responseSchema: GetRepliesResponse,
    paginate: true,
    retryOnRateLimit: true,
  });
}
