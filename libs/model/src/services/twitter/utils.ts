import fetch from 'node-fetch';
import { TwitterBotConfig } from './types';

export async function getFromTwitter({
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
