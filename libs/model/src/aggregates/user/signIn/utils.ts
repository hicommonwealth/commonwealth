import { InvalidActor, logger } from '@hicommonwealth/core';
import { SignIn } from '@hicommonwealth/schemas';
import {
  BalanceSourceType,
  bumpUserTier,
  UserTierMap,
} from '@hicommonwealth/shared';
import { User as PrivyUser } from '@privy-io/server-auth';
import { Transaction } from 'sequelize';
import { z } from 'zod';
import { config } from '../../../config';
import { models } from '../../../database';
import { AddressAttributes } from '../../../models/address';
import { UserAttributes } from '../../../models/user';
import { getBalances } from '../../../services/tokenBalanceCache';
import { VerifiedUserInfo } from '../../../utils/oauth/types';
import { emitSignInEvents } from './emitSignInEvents';

const log = logger(import.meta);

export function constructFindAddressBySsoQueryFilter(
  ssoInfo: VerifiedUserInfo,
) {
  let query = `
    WHERE user_id IS NOT NULL
      AND oauth_provider = :oauthProvider
      AND
  `;

  if (['github', 'discord', 'twitter'].includes(ssoInfo.provider)) {
    query += ` oauth_username = :oauthUsername`;
  } else if (['google', 'email', 'apple'].includes(ssoInfo.provider)) {
    query += `oauth_email = :oauthEmail`;
  } else if (['SMS'].includes(ssoInfo.provider)) {
    query += `oauth_phone_number = :oauthPhoneNumber`;
  } else {
    throw new Error(`Unsupported OAuth provider: '${ssoInfo.provider}'`);
  }

  return query;
}

export async function findUserByAddressOrHex(
  searchTerm: { address: string } | { hex: string },
  transaction: Transaction,
): Promise<UserAttributes | null> {
  log.trace(`findUserByAddressOrHex: ${JSON.stringify(searchTerm)}`);
  const users = await models.sequelize.query(
    `
      WITH user_ids AS (SELECT DISTINCT(user_id) as user_id
                        FROM "Addresses"
                        WHERE user_id IS NOT NULL
                          AND ${'address' in searchTerm ? 'address=:address' : 'hex=:hex'})
      SELECT U.*
      FROM "Users" U
      WHERE U.id IN (SELECT user_id FROM user_ids)
    `,
    {
      model: models.User,
      replacements: searchTerm,
      transaction,
    },
  );

  if (users.length > 1)
    throw new Error(
      `Multiple users with the same ${Object.keys(searchTerm)[0]} found!`,
    );
  if (users.length === 0) return null;
  return users[0];
}

export async function findUserBySso(
  ssoInfo: VerifiedUserInfo,
  transaction: Transaction,
): Promise<UserAttributes | null> {
  log.trace(`findAddressesBySso: ${JSON.stringify(ssoInfo)}`);
  const users = await models.sequelize.query(
    `
      WITH user_ids AS (SELECT DISTINCT(user_id) as user_id
                        FROM "Addresses" ${constructFindAddressBySsoQueryFilter(ssoInfo)})
      SELECT U.*
      FROM "Users" U
      WHERE U.id IN (SELECT user_id FROM user_ids);
    `,
    {
      model: models.User,
      replacements: {
        oauthProvider: ssoInfo.provider,
        oauthUsername: ssoInfo.username,
        oauthEmail: ssoInfo.email,
        oauthPhoneNumber: ssoInfo.phoneNumber,
      },
      transaction,
    },
  );

  if (users.length > 1)
    throw new Error('Multiple users with the same oauth info found!');
  if (users.length === 0) return null;
  return users[0];
}

/*
 Check minimum balance requirement for new or existing users
 signing in with native wallets that are below SocialVerified tier
*/
async function checkNativeWalletBalance(
  address: string,
  foundUser: UserAttributes | null,
  ethChainId?: number,
): Promise<UserTierMap> {
  const tier = foundUser?.tier || UserTierMap.NewlyVerifiedWallet;
  if (tier < UserTierMap.SocialVerified) {
    const balances = ethChainId
      ? await getBalances({
          addresses: [address],
          balanceSourceType: BalanceSourceType.ETHNative,
          sourceOptions: { evmChainId: ethChainId },
        })
      : { [address]: '0' };
    const balance = BigInt(balances[address] || '0');
    const minBalance = BigInt(config.TIER.SOCIAL_VERIFIED_MIN_ETH * 1e18);
    if (balance >= minBalance) return UserTierMap.SocialVerified;
  }
  return tier;
}

export async function findOrCreateUser({
  address,
  transaction,
  ssoInfo,
  referrer_address,
  privyUserId,
  hex,
  signedInUser,
  ethChainId,
}: {
  address: string;
  transaction: Transaction;
  ssoInfo?: VerifiedUserInfo;
  referrer_address?: string | null;
  privyUserId?: string;
  hex?: string;
  signedInUser?: UserAttributes | null;
  ethChainId?: number;
}): Promise<{
  newUser: boolean;
  user: UserAttributes;
}> {
  const foundUser = ssoInfo
    ? await findUserBySso(ssoInfo, transaction)
    : await findUserByAddressOrHex(hex ? { hex } : { address }, transaction);

  const tier =
    privyUserId &&
    ssoInfo &&
    (!('emailVerified' in ssoInfo) || ssoInfo.emailVerified)
      ? UserTierMap.SocialVerified
      : await checkNativeWalletBalance(address, foundUser, ethChainId);

  const updateUser = async (id: number, values: Partial<UserAttributes>) => {
    if (Object.keys(values).length)
      await models.User.update(values, { where: { id }, transaction });
  };

  if (signedInUser?.id) {
    const values: Partial<UserAttributes> = {};
    if (!signedInUser.privy_id && privyUserId) values.privy_id = privyUserId;
    bumpUserTier({
      oldTier: signedInUser.tier,
      newTier: tier,
      targetObject: values,
    });
    await updateUser(signedInUser.id, values);
  } else if (foundUser?.id) {
    const values: Partial<UserAttributes> = {};
    if (!foundUser.privy_id && privyUserId) values.privy_id = privyUserId;
    bumpUserTier({
      oldTier: foundUser.tier,
      newTier: tier,
      targetObject: values,
    });
    await updateUser(foundUser.id, values);
  }

  // Signed-in user signing in with another users address (address transfer) OR
  // Signed-out user signing in with an address they own
  if (
    foundUser &&
    ((signedInUser && foundUser.id !== signedInUser.id) || !signedInUser)
  ) {
    return {
      newUser: false,
      user: foundUser,
    };
  }

  // Signed-in user signing in with an address they already own OR
  // Signed-in user signing in with a new address
  if (
    signedInUser &&
    ((foundUser && foundUser.id === signedInUser.id) || !foundUser)
  ) {
    return {
      newUser: false,
      user: signedInUser,
    };
  }

  // New user signing in (Privy or native wallet)
  // if (!foundUser && !signedInUser)
  const user = await models.User.create(
    {
      email: null,
      profile: {},
      referred_by_address: referrer_address ?? null,
      privy_id: privyUserId ?? null,
      tier,
    },
    { transaction },
  );
  log.trace(`Created new user: ${user.id}`);
  return { newUser: true, user };
}

type BaseOpts = {
  foundUser: UserAttributes;
  newUser: boolean;
  signedInUser?: UserAttributes | null;
  transaction: Transaction;
};

/**
 * Transferring ownership of Cosmos is done via Hex i.e. "wallet account" since
 * we use hex rather than address for sign in. This is because the Cosmos
 * address is different depending on the Cosmos community you join even though
 * the hex is still the same. If we don't transfer all addresses with the same
 * hex then we can't pick which user to sign in to on next sign in.
 */
async function transferAddressOwnership({
  foundUser,
  newUser,
  signedInUser,
  transaction,
  ...findByOpts
}:
  | (BaseOpts & { address: string })
  | (BaseOpts & {
      hex: string;
    })
  | (BaseOpts & { ssoInfo: VerifiedUserInfo })) {
  if (signedInUser && !newUser && signedInUser?.id !== foundUser.id) {
    if ('ssoInfo' in findByOpts) {
      await models.sequelize.query(
        `
          WITH addresses AS (SELECT id
                             FROM "Addresses" ${constructFindAddressBySsoQueryFilter(findByOpts.ssoInfo)})
          UPDATE "Addresses"
          SET user_id = :signedInUserId
          FROM addresses
          WHERE addresses.id = "Addresses".id
        `,
        {
          transaction,
          replacements: {
            signedInUserId: signedInUser.id!,
            oauthProvider: findByOpts.ssoInfo.provider,
            oauthUsername: findByOpts.ssoInfo.username,
            oauthEmail: findByOpts.ssoInfo.email,
            oauthPhoneNumber: findByOpts.ssoInfo.phoneNumber,
          },
        },
      );
    } else {
      await models.Address.update(
        {
          user_id: signedInUser.id!,
        },
        {
          where: findByOpts,
          transaction,
        },
      );
    }
    log.trace(
      `Addresses ${
        'hex' in findByOpts
          ? `${findByOpts.hex} (by hex)`
          : `${(findByOpts as { address: string })['address']}`
      } transferred from user ${foundUser.id} to user ${signedInUser.id}`,
    );
    return true;
  }
  return false;
}

export async function signInUser({
  payload,
  verificationData,
  privyUser,
  verifiedSsoInfo,
  signedInUser,
  ethChainId,
}: {
  payload: z.infer<(typeof SignIn)['input']> & { hex?: string };
  verificationData: {
    verification_token: string;
    verification_token_expires: Date;
  };
  privyUser?: PrivyUser;
  verifiedSsoInfo?: VerifiedUserInfo;
  signedInUser?: UserAttributes | null;
  ethChainId?: number;
}) {
  let addressCount = 1;
  let transferredUser = false;
  let address: AddressAttributes | undefined,
    newAddress = false;
  let foundOrCreatedUser: UserAttributes | undefined;
  let newUser = false;

  await models.sequelize.transaction(async (transaction) => {
    const userRes = await findOrCreateUser({
      address: payload.address,
      ssoInfo: verifiedSsoInfo,
      referrer_address: payload.referrer_address,
      privyUserId: privyUser?.id,
      hex: payload.hex,
      transaction,
      signedInUser,
      ethChainId,
    });
    if (userRes.user.tier === UserTierMap.BannedUser) {
      throw new InvalidActor(
        {
          user: {
            email: userRes.user.email || '',
            id: userRes.user.id,
            emailVerified: userRes.user.emailVerified ?? false,
            isAdmin: userRes.user.isAdmin ?? false,
          },
          address: payload.address,
        },
        'User is banned',
      );
    }
    foundOrCreatedUser = userRes.user;
    newUser = userRes.newUser;

    // if signed-in user is not the same as user derived from address/hex/sso
    // and the user is not new then transfer ownership to the signed-in user
    transferredUser = await transferAddressOwnership({
      foundUser: foundOrCreatedUser,
      ...(payload.hex
        ? { hex: payload.hex }
        : verifiedSsoInfo
          ? { ssoInfo: verifiedSsoInfo }
          : { address: payload.address }),
      newUser,
      signedInUser,
      transaction,
    });

    [address, newAddress] = await models.Address.findOrCreate({
      where: { community_id: payload.community_id, address: payload.address },
      defaults: {
        community_id: payload.community_id,
        address: payload.address,
        user_id: signedInUser?.id ?? foundOrCreatedUser.id!,
        hex: payload.hex,
        wallet_id: payload.wallet_id,
        verification_token: verificationData.verification_token,
        verification_token_expires: verificationData.verification_token_expires,
        block_info: payload.block_info ?? null,
        last_active: new Date(),
        verified: new Date(),
        role: 'member',
        ghost_address: false,
        is_banned: false,
      },
      transaction,
    });

    await emitSignInEvents({
      newUser,
      user: signedInUser || foundOrCreatedUser,
      transferredUser,
      address,
      newAddress,
      transaction,
      originalUserId: transferredUser ? foundOrCreatedUser.id : undefined,
      ethChainId,
    });

    addressCount = await models.Address.count({
      where: {
        address: payload.address,
      },
      transaction,
    });
  });

  if (!address || !foundOrCreatedUser)
    throw new Error('Failed to sign in user');

  return {
    user: signedInUser || foundOrCreatedUser,
    newUser,
    address,
    newAddress,
    addressCount,
    transferredUser,
  };
}
