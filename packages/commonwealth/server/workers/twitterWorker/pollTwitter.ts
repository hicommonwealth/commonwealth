import fetch from 'node-fetch';
import { TwitterBotConfig } from './utils';

async function pollTwitter({
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

async function getMentions({
  twitterBotConfig,
  startTime,
  endTime,
}: {
  twitterBotConfig: TwitterBotConfig;
  startTime: Date;
  endTime: Date;
}) {
  const mentions = await pollTwitter({
    twitterBotConfig,
    url: `https://api.x.com/2/users/${twitterBotConfig.twitterUserId}/mentions`,
    queryParams: {
      start_time: startTime,
      end_time: endTime,
    },
  });
}
