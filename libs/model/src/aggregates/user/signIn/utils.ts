import { logger } from '@hicommonwealth/core';
import { SignIn } from '@hicommonwealth/schemas';
import { User as PrivyUser } from '@privy-io/server-auth';
import { Transaction } from 'sequelize';
import { z } from 'zod';
import { models } from '../../../database';
import { AddressAttributes } from '../../../models/address';
import { UserAttributes } from '../../../models/user';
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
  } else if (['phone_number'].includes(ssoInfo.provider)) {
    query += `oauth_phone_number = :oauthPhoneNumber`;
  } else {
    throw new Error(`Unsupported OAuth provider: ${ssoInfo.provider}`);
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

export async function findOrCreateUser({
  address,
  transaction,
  ssoInfo,
  referrer_address,
  privyUserId,
  hex,
  signedInUser,
}: {
  address: string;
  transaction: Transaction;
  ssoInfo?: VerifiedUserInfo;
  referrer_address?: string | null;
  privyUserId?: string;
  hex?: string;
  signedInUser?: UserAttributes | null;
}): Promise<{
  newUser: boolean;
  user: UserAttributes;
}> {
  let foundUser: UserAttributes | null;
  if (ssoInfo) {
    foundUser = await findUserBySso(ssoInfo, transaction);
  } else {
    foundUser = await findUserByAddressOrHex(
      hex ? { hex } : { address },
      transaction,
    );
  }

  if (!foundUser) {
    // New user signing in (Privy or native wallet)
    const user = await models.User.create(
      {
        email: null,
        profile: {},
        referred_by_address: referrer_address ?? null,
        privy_id: privyUserId ?? null,
        tier: 1,
      },
      { transaction },
    );
    log.trace(`Created new user: ${user.id}`);
    return { newUser: true, user };
  } else if (privyUserId && !foundUser.privy_id && !signedInUser?.privy_id) {
    // Existing user signing in with Privy for the first time
    await models.User.update(
      {
        privy_id: privyUserId,
      },
      {
        where: {
          id: foundUser.id!,
        },
        transaction,
      },
    );
    log.trace(`Updated user privy id: ${foundUser.id}`);
  } else if (privyUserId && foundUser && !foundUser.privy_id) {
    // Signed in Privy user connecting an address owned by another user
    // sanity check
    if (privyUserId !== signedInUser?.privy_id) {
      throw new Error('Invalid Privy user id');
    }
    return {
      newUser: false,
      user: foundUser,
    };
  }

  return {
    newUser: false,
    user: foundUser,
  };
}

async function transferAddressOwnership({
  foundUser,
  newUser,
  ssoInfo,
  address,
  signedInUser,
  transaction,
}: {
  foundUser: UserAttributes;
  newUser: boolean;
  address?: string;
  ssoInfo?: VerifiedUserInfo;
  signedInUser?: UserAttributes | null;
  transaction: Transaction;
}) {
  if (signedInUser && !newUser && signedInUser?.id !== foundUser.id) {
    if (ssoInfo) {
      await models.sequelize.query(
        `
          WITH addresses AS (SELECT id
                             FROM "Addresses" ${constructFindAddressBySsoQueryFilter(ssoInfo)})
          UPDATE "Addresses"
          SET user_id = :signedInUserId
          FROM addresses
          WHERE addresses.id = "Addresses".id
        `,
        {
          transaction,
          replacements: {
            signedInUserId: signedInUser.id!,
            oauthProvider: ssoInfo.provider,
            oauthUsername: ssoInfo.username,
            oauthEmail: ssoInfo.email,
            oauthPhoneNumber: ssoInfo.phoneNumber,
          },
        },
      );
    } else {
      await models.Address.update(
        {
          user_id: signedInUser.id!,
        },
        {
          where: {
            address,
          },
          transaction,
        },
      );
    }
    log.trace(
      `Addresses ${address} transferred from user ${foundUser.id} to user ${signedInUser.id}`,
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
}: {
  payload: z.infer<(typeof SignIn)['input']> & { hex?: string };
  verificationData: {
    verification_token: string;
    verification_token_expires: Date;
  };
  privyUser?: PrivyUser;
  verifiedSsoInfo?: VerifiedUserInfo;
  signedInUser?: UserAttributes | null;
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
    });
    foundOrCreatedUser = userRes.user;
    newUser = userRes.newUser;

    // if signed-in user is not the same as user derived from address/hex/sso
    // and the user is not new then transfer ownership to the signed-in user
    transferredUser = await transferAddressOwnership({
      foundUser: foundOrCreatedUser,
      address: payload.address,
      ssoInfo: verifiedSsoInfo,
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
        is_user_default: false,
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
