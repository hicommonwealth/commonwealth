import {
  DiscordUser,
  GitHubUser,
  GoogleUser,
  TwitterUser,
} from '@hicommonwealth/schemas';
import fetch from 'node-fetch';
import { SsoProviders, VerifiedUserInfo } from './types';

export async function get(token: string, url: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return await response.json();
}

export async function getTwitterUser(token: string): Promise<VerifiedUserInfo> {
  const res = await get(token, 'https://api.twitter.com/2/users/me');
  const userData = TwitterUser.parse(res);
  return {
    provider: 'twitter',
    username: userData.data.username,
  };
}

export async function getDiscordUser(token: string): Promise<VerifiedUserInfo> {
  const res = await get(token, 'https://discord.com/api/users/@me');
  const userData = DiscordUser.parse(res);
  return {
    provider: 'discord',
    email: userData.email,
    emailVerified: userData.verified,
    username: userData.username,
  };
}

export async function getGithubUser(token: string): Promise<VerifiedUserInfo> {
  const res = await get(token, 'https://api.github.com/user');
  const userData = GitHubUser.parse(res);
  return {
    provider: 'github',
    username: userData.login,
  };
}

export async function getGoogleUser(token: string): Promise<VerifiedUserInfo> {
  const res = await get(token, 'https://www.googleapis.com/oauth2/v3/userinfo');
  const userData = GoogleUser.parse(res);
  return {
    provider: 'google',
    email: userData.email,
    emailVerified: userData.email_verified,
  };
}

export async function getVerifiedUserInfo(
  ssoProvider: SsoProviders,
  token: string,
): Promise<VerifiedUserInfo> {
  switch (ssoProvider) {
    case 'twitter':
      return getTwitterUser(token);
    case 'discord':
      return getDiscordUser(token);
    case 'github':
      return getGithubUser(token);
    case 'google':
      return getGoogleUser(token);
  }
}
