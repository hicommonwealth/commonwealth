import { Tweet, TwitterMentionsTimeline } from '@hicommonwealth/schemas';
import fetch from 'node-fetch';
import z from 'zod';
import { TwitterBotConfig } from './utils';

async function getFromTwitter({
  twitterBotConfig,
  url,
  queryParams,
}: {
  twitterBotConfig: TwitterBotConfig;
  url: string;
  queryParams: Record<string, string | Date | number>;
}): Promise<Record<string, unknown>> {
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

  return await response.json();
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
}) {
  const allMentions: z.infer<typeof Tweet>[] = [];
  let paginationToken: string | undefined;
  do {
    const res = await getFromTwitter({
      twitterBotConfig,
      url: `https://api.x.com/2/users/${twitterBotConfig.twitterUserId}/mentions`,
      queryParams: {
        start_time: startTime,
        end_time: endTime,
      },
    });
    const parsedRes = TwitterMentionsTimeline.parse(res);
    paginationToken = parsedRes.meta?.next_token;

    for (const error of parsedRes.errors) {
      // TODO: what should we do for requests that respond with 200 but include errors?
      console.error(error);
    }
    allMentions.push(...parsedRes.data);
  } while (paginationToken);

  return allMentions;
}
