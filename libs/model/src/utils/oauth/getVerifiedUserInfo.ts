import {
  DiscordUser,
  GetTwitterUserResponse,
  GitHubUser,
  GoogleUser,
} from '@hicommonwealth/schemas';
import { WalletSsoSource } from '@hicommonwealth/shared';
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
function getAppleUser(magicData: MagicUserMetadata): VerifiedUserInfo {
  if (!magicData.email) {
    throw new Error('No email found in magic metadata');
  }

  return {
    provider: WalletSsoSource.Apple,
    email: magicData.email,
    emailVerified: false,
  };
}

function getSmsUser(magicData: MagicUserMetadata): VerifiedUserInfo {
  if (!magicData.phoneNumber) {
    throw new Error('No phone number found in magic metadata');
  }
  return {
    provider: WalletSsoSource.SMS,
    phoneNumber: magicData.phoneNumber,
  };
}

function getFarcasterUser(): VerifiedUserInfo {
  return {
    provider: WalletSsoSource.Farcaster,
  };
}

function getEmailUser(magicData: MagicUserMetadata): VerifiedUserInfo {
  if (!magicData.email) {
    throw new Error('No email found in magic metadata');
  }

  return {
    provider: WalletSsoSource.Email,
    email: magicData.email,
    emailVerified: true,
  };
}

export async function getVerifiedUserInfo({
  magicMetadata,
  token,
  walletSsoSource,
}: {
  magicMetadata: MagicUserMetadata;
  // magicMetadata.oauthProvider is not set for email and some others
  walletSsoSource: WalletSsoSource;
  token?: string;
}): Promise<VerifiedUserInfo> {
  const provider: WalletSsoSource =
    (magicMetadata.oauthProvider?.toLowerCase() as WalletSsoSource) ||
    walletSsoSource;

  if (
    magicMetadata.oauthProvider &&
    magicMetadata.oauthProvider?.toLowerCase() !== walletSsoSource
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
      return Promise.resolve(getAppleUser(magicMetadata));
    case WalletSsoSource.SMS:
      return Promise.resolve(getSmsUser(magicMetadata));
    case WalletSsoSource.Farcaster:
      return Promise.resolve(getFarcasterUser());
    case WalletSsoSource.Email:
      return Promise.resolve(getEmailUser(magicMetadata));
    default:
      throw new Error(
        `Unsupported SSO provider: ${magicMetadata.oauthProvider}`,
      );
  }
}
