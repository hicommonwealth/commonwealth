import { logger } from '@hicommonwealth/core';
import { Tweet, TwitterMentionsTimeline } from '@hicommonwealth/schemas';
import z from 'zod';
import { TwitterBotConfig } from '../types';
import { getFromTwitter } from '../utils';

const log = logger(import.meta);

// https://docs.x.com/x-api/posts/user-mention-timeline-by-user-id
export async function getMentions({
  twitterBotConfig,
  startTime,
  endTime,
}: {
  twitterBotConfig: TwitterBotConfig;
  startTime: Date;
  endTime: Date;
}): Promise<{ mentions: z.infer<typeof Tweet>[]; endTime: Date }> {
  const allMentions: z.infer<typeof Tweet>[] = [];
  let paginationToken: string | undefined;
  let requestsRemaining: number;
  do {
    const res = await getFromTwitter({
      twitterBotConfig,
      url: `https://api.x.com/2/users/${twitterBotConfig.twitterUserId}/mentions`,
      queryParams: {
        start_time: startTime,
        end_time: endTime,
        'tweet.fields': 'text,created_at',
        expansions: 'author_id',
        'user.fields': 'username',
        ...(paginationToken ? { pagination_token: paginationToken } : {}),
      },
    });
    const parsedRes = TwitterMentionsTimeline.parse(res.jsonBody);
    paginationToken = parsedRes.meta?.next_token;
    requestsRemaining = res.requestsRemaining;

    if (parsedRes.errors) {
      for (const error of parsedRes.errors) {
        log.error(
          'Error occurred polling for Twitter mentions',
          new Error(JSON.stringify(error)),
          {
            botName: twitterBotConfig.name,
          },
        );
      }
    }

    const newTweetMentions =
      parsedRes?.data?.map((t) => {
        const authorUsername = parsedRes?.includes?.users.find(
          (u) => u.id === t.author_id,
        )?.username;
        if (!authorUsername) throw new Error('Author username not found');
        return {
          id: t.id,
          author_id: t.author_id,
          username: authorUsername,
          text: t.text,
          created_at: new Date(t.created_at),
        };
      }) || [];

    allMentions.push(...newTweetMentions);
  } while (paginationToken && requestsRemaining > 0);

  if (paginationToken && requestsRemaining === 0 && allMentions.length > 0) {
    return {
      mentions: allMentions,
      endTime: new Date(allMentions.at(-1)!.created_at),
    };
  }

  return { mentions: allMentions, endTime };
}
