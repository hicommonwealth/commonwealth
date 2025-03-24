import { VerifiedUserInfo } from '@hicommonwealth/model';
import { SignIn } from '@hicommonwealth/schemas';
import { WalletId } from '@hicommonwealth/shared';
import { User as PrivyUser } from '@privy-io/server-auth';
import { Op, Transaction } from 'sequelize';
import { z } from 'zod';
import { models } from '../../../database';
import { AddressInstance } from '../../../models/address';
import { UserInstance } from '../../../models/user';
import { emitSignInEvents } from './emitSignInEvents';

/**
 * Finds or creates a user by address. If the address already belongs to a user, it may
 * update the users privy id and return the user. If the address does not belong to a user,
 * it creates and returns a new user.
 */
export async function findAddressesByAddress(
  address: string,
  transaction: Transaction,
): Promise<AddressInstance[]> {
  return await models.Address.findAll({
    where: {
      user_id: { [Op.not]: null },
      address,
    },
    include: [
      {
        model: models.User,
        required: true,
        attributes: ['id', 'privy_id'],
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
): Promise<AddressInstance[]> {
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

export async function findOrCreateUser(
  address: string,
  transaction: Transaction,
  ssoInfo?: VerifiedUserInfo,
  referrer_address?: string | null,
  privyUserId?: string,
): Promise<{
  newUser: boolean;
  user: UserInstance;
  addresses: AddressInstance[];
}> {
  let addresses: AddressInstance[];
  if (ssoInfo) {
    addresses = await findAddressesBySso(ssoInfo, transaction);
  } else {
    addresses = await findAddressesByAddress(address, transaction);
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
  }

  return {
    newUser: false,
    user: models.User.build(addresses[0].User!),
    addresses,
  };
}

/**
 * Updates or creates an address for a user in a community. If the address already belongs to
 * another user, it transfers the address to the new user. If the address already exists and
 * the user is the same, it updates the verification data and last active date.
 */
export async function updateOrCreateAddressByCommunity(
  addresses: AddressInstance[],
  {
    user_id,
    community_id,
    address,
    wallet_id,
    verification_token,
    verification_token_expires,
    block_info,
    hex,
  }: {
    user_id: number;
    community_id: string;
    address: string;
    wallet_id: WalletId;
    verification_token: string;
    verification_token_expires: Date;
    block_info?: string | null | undefined;
    hex?: string | undefined;
  },
  transaction: Transaction,
) {
  let addressInstance: AddressInstance | undefined;
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
  if (lastUserId !== user_id) {
    await models.Address.update(
      {
        user_id,
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
    addressInstance = await models.Address.create({
      community_id,
      user_id,
      address,
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
      hex,
    });
    newAddress = true;
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
  }

  return { address: addressInstance, transferredUser, newAddress };
}

export async function addressUpdatesAndEmitEvents(
  payload: z.infer<(typeof SignIn)['input']>,
  verificationData: {
    verification_token: string;
    verification_token_expires: Date;
  },
  {
    newUser,
    user,
    addresses,
  }: { newUser: boolean; user: UserInstance; addresses: AddressInstance[] },
  transaction: Transaction,
) {
  const { transferredUser, address, newAddress } =
    await updateOrCreateAddressByCommunity(
      addresses,
      {
        user_id: user.id!,
        community_id: payload.community_id,
        address: payload.address,
        wallet_id: WalletId.Privy,
        ...verificationData,
      },
      transaction,
    );
  await emitSignInEvents(
    { newAddress, newUser, transferredUser },
    address,
    user,
    transaction,
  );
  return { transferredUser, newAddress, address };
}

export async function signInUser(
  payload: z.infer<(typeof SignIn)['input']>,
  verificationData: {
    verification_token: string;
    verification_token_expires: Date;
  },
  privyUser?: PrivyUser,
  verifiedSsoInfo?: VerifiedUserInfo,
) {
  let userData: Awaited<ReturnType<typeof findOrCreateUser>> | undefined,
    addressData:
      | Awaited<ReturnType<typeof addressUpdatesAndEmitEvents>>
      | undefined;
  let firstCommunity: boolean = false;
  await models.sequelize.transaction(async (transaction) => {
    userData = await findOrCreateUser(
      payload.address,
      transaction,
      verifiedSsoInfo,
      payload.referrer_address,
      privyUser?.id,
    );
    addressData = await addressUpdatesAndEmitEvents(
      payload,
      verificationData,
      userData,
      transaction,
    );

    // TODO: this does not seem to be used on client?
    firstCommunity = !!(await models.Address.findOne({
      where: {
        community_id: { [Op.ne]: payload.community_id },
        address: payload.address,
      },
      attributes: ['community_d'],
      transaction,
    }));
  });

  if (!userData || !addressData) throw new Error('Failed to sign in user');

  return { ...userData, ...addressData, firstCommunity };
}
