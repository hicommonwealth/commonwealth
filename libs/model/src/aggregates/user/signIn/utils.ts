import { logger } from '@hicommonwealth/core';
import { SignIn } from '@hicommonwealth/schemas';
import { WalletId } from '@hicommonwealth/shared';
import { User as PrivyUser } from '@privy-io/server-auth';
import { Op, Transaction } from 'sequelize';
import { z } from 'zod';
import { models } from '../../../database';
import { AddressAttributes } from '../../../models/address';
import { UserAttributes } from '../../../models/user';
import { VerifiedUserInfo } from '../../../utils/oauth/types';
import { emitSignInEvents } from './emitSignInEvents';

const log = logger(import.meta);

/**
 * Finds or creates a user by address. If the address already belongs to a user, it may
 * update the users privy id and return the user. If the address does not belong to a user,
 * it creates and returns a new user.
 */
export async function findAddressesByAddressOrHex(
  searchTerm: { address: string } | { hex: string },
  transaction: Transaction,
): Promise<AddressAttributes[]> {
  console.log(`findAddressesByAddressOrHex: ${JSON.stringify(searchTerm)}`);
  return await models.Address.findAll({
    where: {
      user_id: { [Op.not]: null },
      ...searchTerm,
    },
    include: [
      {
        model: models.User,
        required: true,
      },
    ],
    transaction,
  });
}

/**
 * Similar to findOrCreateUserIdByAddress, but uses oauth info to find a user. This is used
 * to link new Privy users to existing Magic users.
 */
export async function findAddressesBySso(
  ssoInfo: VerifiedUserInfo,
  transaction: Transaction,
): Promise<AddressAttributes[]> {
  console.log(`findAddressesBySso: ${JSON.stringify(ssoInfo)}`);
  let query = `
    SELECT *
    FROM "Addresses"
           JOIN "Users" ON "Addresses"."user_id" = "Users"."id"
    WHERE user_id IS NOT NULL
      AND oauth_provider = :oauthProvider
      AND
  `;

  if (['github', 'discord', 'twitter'].includes(ssoInfo.provider)) {
    query += `
      oauth_username = :oauthUsername;
    `;
  } else if (['google', 'email', 'apple'].includes(ssoInfo.provider)) {
    query += `
      oauth_email = :oauthEmail;
    `;
  } else if (['phone_number'].includes(ssoInfo.provider)) {
    query += `
      oauth_phone_number = :oauthPhoneNumber;
    `;
  } else {
    throw new Error(`Unsupported OAuth provider: ${ssoInfo.provider}`);
  }

  return await models.sequelize.query(query, {
    replacements: {
      oauthProvider: ssoInfo.provider,
      oauthUsername: ssoInfo.username,
      oauthEmail: ssoInfo.email,
      oauthPhoneNumber: ssoInfo.phoneNumber,
    },
    model: models.Address,
    transaction,
  });
}

export async function findOrCreateUser({
  user,
  address,
  transaction,
  ssoInfo,
  referrer_address,
  privyUserId,
  hex,
}: {
  user?: UserAttributes;
  address: string;
  transaction: Transaction;
  ssoInfo?: VerifiedUserInfo;
  referrer_address?: string | null;
  privyUserId?: string;
  hex?: string;
}): Promise<{
  newUser: boolean;
  user: UserAttributes;
  addresses: AddressAttributes[];
}> {
  // Used to simplify signIn flow for Privy
  if (user) {
    if (!Array.isArray(user.Addresses))
      throw new Error('Must join with addresses');
    return {
      newUser: false,
      user,
      addresses: user.Addresses as AddressAttributes[],
    };
  }

  let addresses: AddressAttributes[];
  if (ssoInfo) {
    addresses = await findAddressesBySso(ssoInfo, transaction);
  } else {
    addresses = await findAddressesByAddressOrHex(
      hex ? { hex } : { address },
      transaction,
    );
  }

  const userIds = new Set(addresses.map((a) => a.user_id));
  if (userIds.size > 1) {
    throw new Error(
      `Multiple users found (userIds: ${Array.from(userIds).join(', ')})`,
    );
  }

  if (addresses.length === 0) {
    const user = await models.User.create(
      {
        email: null,
        profile: {},
        referred_by_address: referrer_address ?? null,
        privy_id: privyUserId ?? null,
      },
      { transaction },
    );
    console.log(`Created new user: ${user.id}`);
    return { newUser: true, user, addresses };
  } else if (privyUserId && !addresses[0].User!.privy_id) {
    await models.User.update(
      {
        privy_id: privyUserId,
      },
      {
        where: {
          id: addresses[0].user_id!,
        },
        transaction,
      },
    );
    console.log(`Updated user privy id: ${addresses[0].user_id}`);
  }

  console.log(`Address user object: ${JSON.stringify(addresses[0].User)}`);
  return {
    newUser: false,
    user: addresses[0].User!,
    addresses,
  };
}

type AddressCrudProperties = {
  community_id: string;
  address: string;
  wallet_id: WalletId;
  verification_token: string;
  verification_token_expires: Date;
  block_info?: string | null | undefined;
  hex?: string | undefined;
};

/**
 * Updates or creates an address for a user in a community. If the address already belongs to
 * another user, it transfers the address to the new user. If the address already exists and
 * the user is the same, it updates the verification data and last active date.
 */
export async function upsertAddress({
  user,
  addresses,
  addressAttributes: {
    community_id,
    address,
    wallet_id,
    verification_token,
    verification_token_expires,
    block_info,
    hex,
  },
  transaction,
}: {
  user: UserAttributes;
  addresses: AddressAttributes[];
  addressAttributes: AddressCrudProperties;
  transaction: Transaction;
}) {
  console.log(
    'Update or create address by community. User:' +
      ` ${user.id}, Community: ${community_id}, Address: ${address},` +
      ` existingAddresses: ${JSON.stringify(addresses.map((a) => [a.address, a.community_id]))}`,
  );
  let addressInstance: AddressAttributes | undefined;
  let lastUserId: number | undefined;
  for (const currentAddress of addresses) {
    if (!lastUserId) lastUserId = currentAddress.user_id!;
    if (currentAddress.user_id !== lastUserId) {
      throw new Error('Multiple users cannot have the same address');
    }

    if (
      currentAddress.community_id === community_id &&
      currentAddress.address === address
    )
      addressInstance = currentAddress;
    lastUserId = currentAddress.user_id!;
  }

  let transferredUser = false;
  if (lastUserId && lastUserId !== user.id!) {
    console.log(
      'Transferring address to user: ' + lastUserId + ' -> ' + user.id,
    );
    await models.Address.update(
      {
        user_id: user.id!,
        wallet_id,
      },
      {
        where: { address, user_id: lastUserId },
        transaction,
      },
    );
    transferredUser = true;
  }

  let newAddress = false;
  if (!addressInstance) {
    addressInstance = await models.Address.create(
      {
        community_id,
        user_id: user.id!,
        address,
        hex,
        wallet_id,
        role: 'member',
        is_user_default: false,
        ghost_address: false,
        is_banned: false,
        last_active: new Date(),
        verified: new Date(),
        verification_token,
        verification_token_expires,
        block_info: block_info ?? null,
      },
      { transaction },
    );
    newAddress = true;
    console.log(`Created new address: ${addressInstance.id}`);
  } else {
    await models.Address.update(
      {
        wallet_id,
        last_active: new Date(),
        verified: new Date(),
        verification_token,
        verification_token_expires,
        block_info,
      },
      {
        where: {
          id: addressInstance.id!,
        },
        transaction,
      },
    );
    console.log(
      `Updated address activity. Address: ${addressInstance.address}, Community: ${addressInstance.community_id}`,
    );
  }

  return {
    address: addressInstance,
    transferredUser,
    newAddress,
    originalUserId: lastUserId,
  };
}

export async function signInUser(
  payload: z.infer<(typeof SignIn)['input']> & { hex?: string },
  verificationData: {
    verification_token: string;
    verification_token_expires: Date;
  },
  privyUser?: PrivyUser,
  verifiedSsoInfo?: VerifiedUserInfo,
  user?: UserAttributes,
) {
  let userData: Awaited<ReturnType<typeof findOrCreateUser>> | undefined,
    addressData: Awaited<ReturnType<typeof upsertAddress>> | undefined;
  let addressCount = 0;
  await models.sequelize.transaction(async (transaction) => {
    userData = await findOrCreateUser({
      user,
      address: payload.address,
      ssoInfo: verifiedSsoInfo,
      referrer_address: payload.referrer_address,
      privyUserId: privyUser?.id,
      hex: payload.hex,
      transaction,
    });
    addressData = await upsertAddress({
      ...userData,
      addressAttributes: {
        ...payload,
        ...verificationData,
      },
      transaction,
    });
    await emitSignInEvents({
      ...userData,
      ...addressData,
      transaction,
    });

    addressCount = await models.Address.count({
      where: {
        address: payload.address,
      },
      transaction,
    });
  });

  if (!userData || !addressData) throw new Error('Failed to sign in user');
  return { ...userData, ...addressData, addressCount };
}
