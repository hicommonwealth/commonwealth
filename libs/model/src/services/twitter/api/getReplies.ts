import { GetRepliesResponse } from '@hicommonwealth/schemas';
import { TwitterBotConfig } from '../types';
import { getFromTwitterWrapper } from '../utils';

// https://docs.x.com/x-api/posts/recent-search
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
      sort_order: 'recency',
    },
    oauthMethod: 'oauth2',
    responseSchema: GetRepliesResponse,
    paginate: true,
    retryOnRateLimit: true,
  });
}
