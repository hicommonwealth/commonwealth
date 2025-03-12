import crypto from 'crypto';
import fetch from 'node-fetch';
import { RequiredTwitterBotConfig, TwitterBotConfig } from './types';

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
      value instanceof Date ? value.toISOString() : value.toString(),
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
    throw new Error(
      `Request failed with status ${response.status}: ${response.statusText}`,
    );
  }

  return {
    jsonBody: await response.json(),
    requestsRemaining: Number(response.headers.get('x-rate-limit-remaining')),
  };
}
