import { logger } from '@hicommonwealth/core';
import { TwitterApiResponses } from '@hicommonwealth/schemas';
import { delay } from '@hicommonwealth/shared';
import crypto from 'crypto';
import fetch from 'node-fetch';
import z from 'zod';
import { RequiredTwitterBotConfig, TwitterBotConfig } from './types';

const log = logger(import.meta);

function mustHaveAuth(
  config: TwitterBotConfig,
): asserts config is TwitterBotConfig & {
  bearerToken: string;
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
} {
  if (
    !config.name ||
    !config.username ||
    !config.twitterUserId ||
    !config.bearerToken ||
    !config.consumerKey ||
    !config.consumerSecret ||
    !config.accessToken ||
    !config.accessTokenSecret
  ) {
    throw new Error('Twitter bot config is missing required fields');
  }
}

/**
 * Generate a random nonce string
 */
export const generateNonce = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Generate current timestamp for OAuth
 */
export const generateTimestamp = (): string => {
  return Math.floor(Date.now() / 1000).toString();
};

/**
 * Generate the user-based OAuth 1.0 signature for a request
 */
export const generateSignature = (
  credentials: RequiredTwitterBotConfig,
  method: string,
  url: string,
  oauthParams: Record<string, string>,
  requestParams: Record<string, string> = {},
): string => {
  const allParams = { ...oauthParams, ...requestParams };

  const paramString = Object.keys(allParams)
    .sort()
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`,
    )
    .join('&');

  const baseUrl = url.split('?')[0];
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(baseUrl),
    encodeURIComponent(paramString),
  ].join('&');

  const signingKey = `${encodeURIComponent(credentials.consumerSecret)}&${encodeURIComponent(credentials.accessTokenSecret)}`;

  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  return signature;
};

/**
 * Generate User-based OAuth 1.0 header for Twitter API requests
 */
export const generateOAuthHeader = ({
  credentials,
  method,
  url,
  params = {},
}: {
  credentials: RequiredTwitterBotConfig;
  method: string;
  url: string;
  params?: Record<string, string>;
}): string => {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.consumerKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: generateTimestamp(),
    oauth_token: credentials.accessToken,
    oauth_version: '1.0',
  };

  const signature = generateSignature(
    credentials,
    method,
    url,
    oauthParams,
    params,
  );
  oauthParams.oauth_signature = signature;

  // Create header string
  return (
    'OAuth ' +
    Object.keys(oauthParams)
      .map((key) => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ')
  );
};

export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;

    // This is necessary in TypeScript to ensure prototype chain works correctly
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        statusCode: this.statusCode,
      },
    };
  }
}

export async function getFromTwitter({
  twitterBotConfig,
  url,
  queryParams,
  oauthMethod = 'oauth2',
}: {
  twitterBotConfig: TwitterBotConfig;
  url: string;
  queryParams: Record<string, string | Date | number>;
  oauthMethod?: 'oauth1' | 'oauth2';
}): Promise<{ jsonBody: Record<string, unknown>; requestsRemaining: number }> {
  mustHaveAuth(twitterBotConfig);

  const parsedQueryParams: Record<string, string> = Object.fromEntries(
    Object.entries(queryParams).map(([key, value]) => [
      key,
      value instanceof Date
        ? value.toISOString().replace(/\.\d{3}Z$/, 'Z')
        : value.toString(),
    ]),
  );

  const queryString = new URLSearchParams(parsedQueryParams).toString();
  const fullUrl = `${url}?${queryString}`;

  let authHeader = `Bearer ${twitterBotConfig.bearerToken}`;
  if (oauthMethod === 'oauth1') {
    authHeader = generateOAuthHeader({
      credentials: twitterBotConfig,
      method: 'GET',
      url,
      params: parsedQueryParams,
    });
  }

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new HttpError(
      `Request failed with status ${response.status}: ${response.statusText}`,
      response.status,
    );
  }

  return {
    jsonBody: await response.json(),
    requestsRemaining: Number(response.headers.get('x-rate-limit-remaining')),
  };
}

export async function getFromTwitterWrapper<
  Schema extends (typeof TwitterApiResponses)[keyof typeof TwitterApiResponses],
>({
  twitterBotConfig,
  url,
  queryParams,
  responseSchema,
  oauthMethod = 'oauth2',
  paginate = true,
  retryOnRateLimit = true,
}: {
  twitterBotConfig: TwitterBotConfig;
  url: string;
  queryParams: Record<string, string | Date | number>;
  responseSchema: Schema;
  oauthMethod?: 'oauth1' | 'oauth2';
  paginate?: boolean;
  retryOnRateLimit?: boolean;
}): Promise<NonNullable<z.infer<Schema>['data']> | readonly []> {
  let paginationToken: string | undefined;
  let requestsRemaining: number;
  const maxResults = 100;
  let numResults = 0;
  let shouldContinueLoop = true;
  let waitTime = 60_000;
  // Max wait time is 16 minutes which would occur after 5 retries
  const maxWaitTime = 960_000;

  const results: NonNullable<z.infer<Schema>['data']> = [];

  const logContext = {
    botName: twitterBotConfig.name,
    url,
    queryParams,
    oauthMethod,
    waitTime,
    maxWaitTime,
  };

  do {
    let res: Awaited<ReturnType<typeof getFromTwitter>>;
    try {
      res = await getFromTwitter({
        twitterBotConfig,
        url,
        queryParams: {
          max_results: maxResults,
          ...queryParams,
          ...(paginationToken ? { pagination_token: paginationToken } : {}),
        },
        oauthMethod,
      });
    } catch (e) {
      if (e instanceof HttpError && e.statusCode === 429) {
        if (retryOnRateLimit && waitTime < maxWaitTime) {
          log.debug(
            `Rate limited. Retrying in ${waitTime / 1000} seconds.`,
            logContext,
          );
          await delay(waitTime);
          waitTime *= 2;
          continue;
        } else if (retryOnRateLimit && waitTime > maxWaitTime) {
          log.error(
            'Rate limited. Max wait time exceeded. Exiting...',
            undefined,
            logContext,
          );
        }
      }
      throw e;
    }

    console.log('>>>>>>>>', res.jsonBody);
    const parsedRes = responseSchema.parse(res.jsonBody);
    paginationToken = parsedRes.meta?.next_token;
    requestsRemaining = res.requestsRemaining;

    if (parsedRes.errors) {
      for (const error of parsedRes.errors) {
        log.error(
          'Error occurred fetching',
          new Error(JSON.stringify(error)),
          logContext,
        );
      }
    }

    if (parsedRes.data) {
      const data: z.infer<Schema>['data'] = parsedRes.data;
      if (Array.isArray(data)) {
        numResults = data.length;
        results.push(...data);
      } else return parsedRes.data;
    }

    shouldContinueLoop =
      paginate && !!paginationToken && numResults === maxResults;

    if (requestsRemaining === 0 && shouldContinueLoop && retryOnRateLimit) {
      if (waitTime > maxWaitTime) {
        log.error(
          'Rate limit exceeded and exponential backoff failed. Returning data already fetched',
          undefined,
          {
            ...logContext,
            numResultsBeforeRateLimit: results.length,
          },
        );
        break;
      }

      await delay(waitTime);
      waitTime *= 2;
    } else if (
      requestsRemaining === 0 &&
      shouldContinueLoop &&
      !retryOnRateLimit
    ) {
      log.error(
        'Ran out of requests. Returning data already fetched.',
        undefined,
        {
          ...logContext,
          numResultsBeforeRateLimit: results.length,
        },
      );
      break;
    }
  } while (shouldContinueLoop);

  return results;
}
