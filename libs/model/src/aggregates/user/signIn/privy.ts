import { Actor, InvalidActor, logger } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import {
  LinkedAccountWithMetadata,
  PrivyClient,
  User as PrivyUser,
} from '@privy-io/server-auth';
import { z } from 'zod';
import { config } from '../../../config';
import { models } from '../../../database';
import { AddressAttributes } from '../../../models/address';
import { UserAttributes } from '../../../models/user';
import { getVerifiedUserInfo } from '../../../utils/oauth/getVerifiedUserInfo';
import { VerifiedUserInfo } from '../../../utils/oauth/types';
import { addressUpdatesAndEmitEvents, signInUser } from './utils';

const log = logger(import.meta);

export const privyClient = new PrivyClient(
  config.PRIVY.APP_ID!,
  config.PRIVY.APP_SECRET!,
);

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

export async function signInPrivy(
  payload: z.infer<(typeof schemas.SignIn)['input']>,
  verificationData: {
    verification_token: string;
    verification_token_expires: Date;
  },
  actor: Actor,
): Promise<{
  newUser: boolean;
  newAddress: boolean;
  firstCommunity: boolean;
  user: UserAttributes;
}> {
  if (payload.wallet_id !== WalletId.Privy) throw new Error('Invalid wallet');
  log.trace('Signing in with Privy');

  if (!payload.privyIdentityToken)
    throw new InvalidActor(actor, 'Privy ID token is required');

  let privyUser: PrivyUser;
  try {
    privyUser = await privyClient.getUser({
      idToken: payload.privyIdentityToken,
    });
    console.log('Full privy user:', privyUser);
  } catch (e) {
    throw new InvalidActor(actor, 'Invalid Privy identity token');
  }

  const user = await models.User.findOne({
    where: {
      privy_id: privyUser.id,
    },
    include: [
      {
        model: models.Address,
        required: false,
        where: {
          address: payload.address,
        },
      },
    ],
  });

  // First time signing in with Privy (existing or new user)
  // Over time, only new users will go down this path
  if (!user) {
    log.trace(
      'Existing privy user not found, creating new user: ' + privyUser.id,
    );
    let verifiedSsoInfo: VerifiedUserInfo | undefined;
    if (privyUser.wallet?.walletClientType === 'privy') {
      const fullPrivyUser = await privyClient.getUserById(privyUser.id);
      const linkedAccount = fullPrivyUser.linkedAccounts.find(
        (a) => a.type === 'wallet' && a.address === payload.address,
      );
      if (!linkedAccount) throw new Error('No linked account found');
      verifiedSsoInfo = await getVerifiedUserInfo({
        privyUser: fullPrivyUser,
        walletSsoSource: mapPrivyTypeToWalletSso(linkedAccount.type),
        token: '', // TODO: how to get token from Privy?
      });
    }
    return await signInUser(
      payload,
      verificationData,
      privyUser,
      verifiedSsoInfo,
    );
  }
  // User has signed in with Privy before
  else {
    log.trace('Existing privy user found: ' + privyUser.id);
    let addressData:
      | Awaited<ReturnType<typeof addressUpdatesAndEmitEvents>>
      | undefined;
    await models.sequelize.transaction(async (transaction) => {
      addressData = await addressUpdatesAndEmitEvents(
        payload,
        verificationData,
        {
          newUser: false,
          user,
          addresses: user.Addresses as AddressAttributes[],
        },
        transaction,
      );
    });
    if (!addressData) throw new Error('Address not found');
    return {
      newAddress: addressData.newAddress,
      newUser: false,
      firstCommunity:
        (user.Addresses as AddressAttributes[])?.filter(
          (a) => a.address === payload.address,
        ).length === 0,
      user,
    };
  }
}
