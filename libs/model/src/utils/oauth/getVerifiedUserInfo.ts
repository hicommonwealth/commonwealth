import {
  DiscordUser,
  GetTwitterUserResponse,
  GitHubUser,
  GoogleUser,
} from '@hicommonwealth/schemas';
import { WalletSsoSource } from '@hicommonwealth/shared';
import { MagicUserMetadata } from '@magic-sdk/admin';
import type { User as PrivyUser } from '@privy-io/server-auth';
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
  const userData = GetTwitterUserResponse.parse(res);
  return {
    provider: WalletSsoSource.Twitter,
    username: userData.data.username,
  };
}

async function getDiscordUser(token: string): Promise<VerifiedUserInfo> {
  const res = await get(token, 'https://discord.com/api/users/@me');
  const userData = DiscordUser.parse(res);
  return {
    provider: WalletSsoSource.Discord,
    email: userData.email,
    emailVerified: userData.verified,
    username: userData.username,
  };
}

async function getGithubUser(token: string): Promise<VerifiedUserInfo> {
  const res = await get(token, 'https://api.github.com/user');
  const userData = GitHubUser.parse(res);
  return {
    provider: WalletSsoSource.Github,
    username: userData.login,
  };
}

async function getGoogleUser(token: string): Promise<VerifiedUserInfo> {
  const res = await get(token, 'https://www.googleapis.com/oauth2/v3/userinfo');
  const userData = GoogleUser.parse(res);
  return {
    provider: WalletSsoSource.Google,
    email: userData.email,
    emailVerified: userData.email_verified,
  };
}

// Assume email returned by magic is unverified
// Apple doesn't have an endpoint from which we can fetch user info to check email
function getAppleUser(
  magicData?: MagicUserMetadata,
  privyUser?: PrivyUser,
): VerifiedUserInfo {
  const email = magicData?.email || privyUser?.apple?.email;
  if (!email) {
    throw new Error('Email address associated with Apple account not found');
  }
  return {
    provider: WalletSsoSource.Apple,
    email,
    emailVerified: true,
  };
}

function getSmsUser(
  magicData?: MagicUserMetadata,
  privyUser?: PrivyUser,
): VerifiedUserInfo {
  const phoneNumber = magicData?.phoneNumber || privyUser?.phone?.number;
  if (!phoneNumber) {
    throw new Error('No phone number found in magic metadata');
  }
  return {
    provider: WalletSsoSource.SMS,
    phoneNumber,
  };
}

function getFarcasterUser(privyUser?: PrivyUser): VerifiedUserInfo {
  return {
    provider: WalletSsoSource.Farcaster,
    username: privyUser?.farcaster?.fid
      ? String(privyUser?.farcaster?.fid)
      : undefined,
  };
}

function getEmailUser(
  magicData?: MagicUserMetadata,
  privyUser?: PrivyUser,
): VerifiedUserInfo {
  const email = magicData?.email || privyUser?.email?.address;
  if (!email) {
    throw new Error('Email address not found');
  }
  return {
    provider: WalletSsoSource.Email,
    email,
    emailVerified: true,
  };
}

export async function getVerifiedUserInfo({
  magicMetadata,
  privyUser,
  token,
  walletSsoSource,
}: {
  magicMetadata?: MagicUserMetadata;
  privyUser?: PrivyUser;
  // magicMetadata.oauthProvider is not set for email and some others
  walletSsoSource: WalletSsoSource;
  token?: string;
}): Promise<VerifiedUserInfo> {
  const provider: WalletSsoSource =
    (magicMetadata?.oauthProvider?.toLowerCase() as WalletSsoSource) ||
    walletSsoSource;

  if (
    magicMetadata?.oauthProvider &&
    magicMetadata?.oauthProvider?.toLowerCase() !== walletSsoSource
  ) {
    throw new Error('Invalid oauth provider');
  }

  if (!token && ['twitter', 'discord', 'github', 'google'].includes(provider))
    throw new Error(`${provider} verification requires a bearer token`);

  switch (provider) {
    case WalletSsoSource.Twitter:
      return getTwitterUser(token!);
    case WalletSsoSource.Discord:
      return getDiscordUser(token!);
    case WalletSsoSource.Github:
      return getGithubUser(token!);
    case WalletSsoSource.Google:
      return getGoogleUser(token!);
    case WalletSsoSource.Apple:
      return Promise.resolve(getAppleUser(magicMetadata, privyUser));
    case WalletSsoSource.SMS:
      return Promise.resolve(getSmsUser(magicMetadata, privyUser));
    case WalletSsoSource.Farcaster:
      return Promise.resolve(getFarcasterUser(privyUser));
    case WalletSsoSource.Email:
      return Promise.resolve(getEmailUser(magicMetadata, privyUser));
    default:
      throw new Error(`Unsupported SSO provider: ${provider}`);
  }
}
