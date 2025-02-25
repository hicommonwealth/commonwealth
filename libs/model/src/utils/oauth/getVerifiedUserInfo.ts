import {
  DiscordUser,
  GitHubUser,
  GoogleUser,
  TwitterUser,
} from '@hicommonwealth/schemas';
import { MagicUserMetadata } from '@magic-sdk/admin';
import fetch from 'node-fetch';
import { VerifiedUserInfo } from './types';

async function get(token: string, url: string) {
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

async function getTwitterUser(token: string): Promise<VerifiedUserInfo> {
  const res = await get(token, 'https://api.twitter.com/2/users/me');
  const userData = TwitterUser.parse(res);
  return {
    provider: 'twitter',
    username: userData.data.username,
  };
}

async function getDiscordUser(token: string): Promise<VerifiedUserInfo> {
  const res = await get(token, 'https://discord.com/api/users/@me');
  const userData = DiscordUser.parse(res);
  return {
    provider: 'discord',
    email: userData.email,
    emailVerified: userData.verified,
    username: userData.username,
  };
}

async function getGithubUser(token: string): Promise<VerifiedUserInfo> {
  const res = await get(token, 'https://api.github.com/user');
  const userData = GitHubUser.parse(res);
  return {
    provider: 'github',
    username: userData.login,
  };
}

async function getGoogleUser(token: string): Promise<VerifiedUserInfo> {
  const res = await get(token, 'https://www.googleapis.com/oauth2/v3/userinfo');
  const userData = GoogleUser.parse(res);
  return {
    provider: 'google',
    email: userData.email,
    emailVerified: userData.email_verified,
  };
}

// Assume email returned by magic is unverified
// Apple doesn't have an endpoint from which we can fetch user info to check email
function getAppleUser(magicData: MagicUserMetadata): VerifiedUserInfo {
  if (!magicData.email) {
    throw new Error('No email found in magic metadata');
  }

  return {
    provider: 'apple',
    email: magicData.email,
    emailVerified: false,
  };
}

function getSmsUser(magicData: MagicUserMetadata): VerifiedUserInfo {
  if (!magicData.phoneNumber) {
    throw new Error('No phone number found in magic metadata');
  }
  return {
    provider: 'sms',
    phoneNumber: magicData.phoneNumber,
  };
}

function getFarcasterUser(): VerifiedUserInfo {
  return {
    provider: 'farcaster',
  };
}

function getEmailUser(magicData: MagicUserMetadata): VerifiedUserInfo {
  if (!magicData.email) {
    throw new Error('No email found in magic metadata');
  }

  return {
    provider: 'email',
    email: magicData.email,
    emailVerified: true,
  };
}

export async function getVerifiedUserInfo(
  magicMetadata: MagicUserMetadata,
  token?: string,
): Promise<VerifiedUserInfo> {
  if (!magicMetadata.oauthProvider) {
    throw new Error('No oauth provider found in magic metadata');
  }

  if (
    !token &&
    ['twitter', 'discord', 'github', 'google'].includes(
      magicMetadata.oauthProvider.toLowerCase(),
    )
  )
    throw new Error('Email verification requires a token to be passed in');

  switch (magicMetadata.oauthProvider) {
    case 'twitter':
      return getTwitterUser(token!);
    case 'discord':
      return getDiscordUser(token!);
    case 'github':
      return getGithubUser(token!);
    case 'google':
      return getGoogleUser(token!);
    case 'apple':
      return Promise.resolve(getAppleUser(magicMetadata));
    case 'sms':
      return Promise.resolve(getSmsUser(magicMetadata));
    case 'farcaster':
      return Promise.resolve(getFarcasterUser());
    case 'email':
      return Promise.resolve(getEmailUser(magicMetadata));
    default:
      throw new Error(
        `Unsupported SSO provider: ${magicMetadata.oauthProvider}`,
      );
  }
}
