import { logger } from '@hicommonwealth/core';
import { Tweet, TwitterMentionsTimeline } from '@hicommonwealth/schemas';
import fetch from 'node-fetch';
import z from 'zod';
import { TwitterBotConfig } from './utils';

const log = logger(import.meta);

async function getFromTwitter({
  twitterBotConfig,
  url,
  queryParams,
}: {
  twitterBotConfig: TwitterBotConfig;
  url: string;
  queryParams: Record<string, string | Date | number>;
}): Promise<{ jsonBody: Record<string, unknown>; requestsRemaining: number }> {
  const parsedQueryParams: Record<string, string> = Object.fromEntries(
    Object.entries(queryParams).map(([key, value]) => [
      key,
      value instanceof Date ? value.toISOString() : value.toString(),
    ]),
  );

  const queryString = new URLSearchParams(parsedQueryParams).toString();
  const fullUrl = `${url}?${queryString}`;

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${twitterBotConfig.bearerToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Request failed with status ${response.status}: ${response.statusText}`,
    );
  }

  return {
    jsonBody: await response.json(),
    requestsRemaining: Number(response.headers.get('x-rate-limit-remaining')),
  };
}

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
      },
    });
    const parsedRes = TwitterMentionsTimeline.parse(res.jsonBody);
    paginationToken = parsedRes.meta?.next_token;
    requestsRemaining = res.requestsRemaining;

    for (const error of parsedRes.errors) {
      log.error(
        'Error occurred polling for Twitter mentions',
        new Error(JSON.stringify(error)),
        {
          botName: twitterBotConfig.name,
        },
      );
    }
    allMentions.push(...parsedRes.data);
  } while (paginationToken && requestsRemaining > 0);

  if (paginationToken && requestsRemaining === 0 && allMentions.length > 0) {
    return {
      mentions: allMentions,
      endTime: new Date(allMentions.at(-1)!.created_at),
    };
  }

  return { mentions: allMentions, endTime };
}
