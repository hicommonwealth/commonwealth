import crypto from 'crypto';
import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import Web3 from 'web3';
import { BASES } from './constants';
import { ProfileObject } from './profiles';
import { UserObject } from './users';
import { createCosmosAddress } from './utils';

const createAddress = async (
  session: Sequelize,
  {
    discourseUserId,
    cwUserId,
    // username,
    address,
    communityId,
    email,
    profileId,
    isAdmin,
    isModerator,
  }: {
    discourseUserId: any;
    cwUserId: number;
    username: string;
    address: string;
    communityId: string;
    email: string;
    profileId: number;
    isAdmin: boolean;
    isModerator: boolean;
  },
  { transaction }: { transaction: Transaction },
) => {
  const verified_token = crypto.randomBytes(18).toString('hex');
  const verification_token_expires = new Date(
    +new Date() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const [createdAddress] = await session.query<{
    id: number;
    address: string;
    community_id: string;
  }>(
    `
    INSERT INTO "Addresses"(id, address, community_id, created_at,
    updated_at, user_id, verification_token,
    verification_token_expires, verified, keytype, last_active,
    is_councillor, is_validator, ghost_address, profile_id, wallet_id, role)
    VALUES (default,
    '${address}',
    '${communityId}',
    NOW(),
    NOW(),
    (SELECT id FROM "Users" WHERE email = '${email}'),
    '${verified_token}',
    '${verification_token_expires}',
    NOW(),
    null,
    null,
    false,
    false,
    true,
    ${profileId}, null, '${
      isAdmin ? 'admin' : isModerator ? 'moderator' : 'member'
    }') RETURNING id, address, community_id;
    `,
    { type: QueryTypes.SELECT, transaction },
  );
  return { createdAddress, discourseUserId, cwUserId };
};

export type AddressObject = {
  id: number;
  address: string;
  discourseUserId: number;
  cwUserId: number;
};

export const createAllAddressesInCW = async (
  discourseConnection: Sequelize,
  cwConnection: Sequelize,
  {
    users,
    profiles,
    communityId,
    base,
  }: {
    users: UserObject[];
    profiles: ProfileObject[];
    communityId: string;
    base: string;
  },
  { transaction }: { transaction: Transaction },
): Promise<AddressObject[]> => {
  const addressPromises = users.map(
    ({
      id: cwUserId,
      discourseUserId,
      username,
      email,
      isAdmin,
      isModerator,
      profile_id,
    }) => {
      let ghostAddress;
      if (base.toUpperCase() === BASES.COSMOS) {
        ghostAddress = createCosmosAddress();
      } else if (base.toUpperCase() === BASES.NEAR) {
        const parsedName = username.toLowerCase().replace(/[\W_]+/g, '-');
        ghostAddress = `${parsedName}.ghost`;
      } else {
        // default to ETH ghost address creation
        const web3 = new Web3();
        ghostAddress = web3.eth.accounts.create().address;
      }
      let profileId = profile_id;
      if (!profileId) {
        profileId = profiles.find((p) => p.user_id === cwUserId)?.profile_id;
        if (!profileId) throw new Error('Profile not found');
      }

      return createAddress(
        cwConnection,
        {
          discourseUserId,
          cwUserId,
          username,
          address: ghostAddress,
          communityId,
          email,
          profileId,
          isAdmin,
          isModerator,
        },
        { transaction },
      );
    },
  );

  const createdAddresses = await Promise.all(addressPromises);
  return createdAddresses.map(
    ({ createdAddress, discourseUserId, cwUserId }) => ({
      id: createdAddress.id,
      address: createdAddress.address,
      discourseUserId,
      cwUserId,
    }),
  );
};
