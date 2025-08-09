import { InvalidActor, logger } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import {
  LinkedAccountWithMetadata,
  User as PrivyUser,
} from '@privy-io/server-auth';
import { z } from 'zod';
import { models } from '../../../database';
import { UserAttributes } from '../../../models/user';
import { getVerifiedUserInfo } from '../../../utils/oauth/getVerifiedUserInfo';
import { VerifiedUserInfo } from '../../../utils/oauth/types';
import { getPrivyUserById, getPrivyUserByIdToken } from './privyUtils';
import { signInUser } from './utils';

const log = logger(import.meta);

const PrivySsoSourceMap: Partial<
  Record<LinkedAccountWithMetadata['type'], WalletSsoSource>
> = {
  apple_oauth: WalletSsoSource.Apple,
  google_oauth: WalletSsoSource.Google,
  twitter_oauth: WalletSsoSource.Twitter,
  discord_oauth: WalletSsoSource.Discord,
  github_oauth: WalletSsoSource.Github,
  phone: WalletSsoSource.SMS,
  farcaster: WalletSsoSource.Farcaster,
  email: WalletSsoSource.Email,
};

export function mapPrivyTypeToWalletSso(
  privyType: LinkedAccountWithMetadata['type'],
): WalletSsoSource {
  const walletSsoSource = PrivySsoSourceMap[privyType];
  if (!walletSsoSource)
    throw new Error(`Unsupported Privy SSO type: ${privyType}`);
  return walletSsoSource;
}

export function requiresAuthToken(ssoProvider: WalletSsoSource) {
  // every other provider, other than SMS and email, provide auth tokens.
  return !['SMS', 'email'].includes(ssoProvider);
}

export async function signInPrivy({
  payload,
  verificationData,
  signedInUser,
  ethChainId,
}: {
  payload: z.infer<(typeof schemas.SignIn)['input']>;
  verificationData: {
    verification_token: string;
    verification_token_expires: Date;
  };
  signedInUser?: UserAttributes | null;
  ethChainId?: number;
}): Promise<{
  newUser: boolean;
  newAddress: boolean;
  addressCount: number;
  user: UserAttributes;
}> {
  if (payload.wallet_id !== WalletId.Privy) throw new Error('Invalid wallet');
  log.trace('Signing in with Privy');

  if (!payload.privy) throw new Error('Missing privy object in payload');

  if (!payload.privy.identityToken)
    throw new InvalidActor(
      { user: { email: '' } },
      'Privy ID token is required',
    );

  let privyUser: PrivyUser;
  try {
    privyUser = await getPrivyUserByIdToken(payload.privy.identityToken);
  } catch (e) {
    console.error(e);
    throw new InvalidActor(
      { user: { email: '' } },
      'Invalid Privy identity token',
    );
  }

  const userOwnsAddress = privyUser.linkedAccounts.some((a) => {
    if (a.type === 'wallet' && a.address === payload.address) return true;
  });

  let user: UserAttributes | undefined | null = signedInUser;
  if (!user) {
    user = await models.User.findOne({
      where: {
        privy_id: privyUser.id,
      },
    });
  }

  log.trace(
    `Privy sign in data: user.privy_id = ${user?.privy_id},` +
      ` userOwnsAddress = ${userOwnsAddress}, privyUser.wallet?.walletClientType = ${privyUser.wallet?.walletClientType}`,
  );
  // First time signing in with Privy SSO (existing or new user)
  // OR transferring old SSO address to new Privy user
  // Over time, only new users will go down this path
  let verifiedSsoInfo: VerifiedUserInfo | undefined = undefined;
  if (
    (!user || !user.privy_id || !userOwnsAddress) &&
    privyUser.wallet?.walletClientType === 'privy'
  ) {
    log.trace(
      'Existing privy user not found, creating new user: ' + privyUser.id,
    );
    // TODO: existing linkedAccounts array may be sufficient to get the verifiedUserInfo and avoid
    //  this extra call to Privy
    const fullPrivyUser = await getPrivyUserById(privyUser.id);

    if (!payload.privy.ssoProvider) throw new Error('Missing OAuth provider');

    const walletSsoSource = mapPrivyTypeToWalletSso(payload.privy.ssoProvider);
    if (requiresAuthToken(walletSsoSource) && !payload.privy.ssoOAuthToken)
      throw new Error('Missing OAuth token');
    verifiedSsoInfo = await getVerifiedUserInfo({
      privyUser: fullPrivyUser,
      walletSsoSource,
      token: payload.privy.ssoOAuthToken,
    });
  }

  return await signInUser({
    payload,
    verificationData,
    privyUser,
    verifiedSsoInfo,
    signedInUser: user,
    ethChainId,
  });
}
