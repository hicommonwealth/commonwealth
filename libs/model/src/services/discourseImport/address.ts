import { models } from '@hicommonwealth/model';
import { Address, User } from '@hicommonwealth/schemas';
import crypto from 'crypto';
import { Transaction } from 'sequelize';
import Web3 from 'web3';
import { z } from 'zod';
import { BASES } from './constants';
import { createCosmosAddress } from './utils';

const createOrFindAddress = async (
  {
    userId,
    address,
    communityId,
    isAdmin,
    isModerator,
  }: {
    userId: number;
    address: string;
    communityId: string;
    isAdmin: boolean;
    isModerator: boolean;
  },
  { transaction }: { transaction: Transaction },
) => {
  return models.Address.findOrCreate({
    where: {
      address: address,
      user_id: userId,
      community_id: communityId,
    },
    defaults: {
      address,
      community_id: communityId,
      user_id: userId,
      verification_token: crypto.randomBytes(18).toString('hex'),
      verification_token_expires: new Date(
        +new Date() + 7 * 24 * 60 * 60 * 1000,
      ),
      verified: new Date(),
      last_active: null,
      is_councillor: false,
      is_validator: false,
      ghost_address: true,
      role: isAdmin ? 'admin' : isModerator ? 'moderator' : 'member',
    },
    transaction,
  });
};

export const createAllAddressesInCW = async (
  {
    users,
    admins,
    moderators,
    communityId,
    base,
  }: {
    users: Array<z.infer<typeof User>>;
    admins: Record<number, boolean>;
    moderators: Record<number, boolean>;
    communityId: string;
    base: string;
  },
  { transaction }: { transaction: Transaction },
): Promise<Array<z.infer<typeof Address>>> => {
  const addressPromises = users.map((user) => {
    let ghostAddress;
    if (base.toUpperCase() === BASES.COSMOS) {
      ghostAddress = createCosmosAddress();
    } else if (base.toUpperCase() === BASES.NEAR) {
      const parsedName = user.profile.name
        ?.toLowerCase()
        .replace(/[\W_]+/g, '-');
      if (!parsedName) {
        throw new Error(`failed to generate parsed name for user: ${user.id}`);
      }
      ghostAddress = `${parsedName}.ghost`;
    } else {
      // default to ETH ghost address creation
      const web3 = new Web3();
      ghostAddress = web3.eth.accounts.create().address;
    }

    return createOrFindAddress(
      {
        userId: user.id!,
        address: ghostAddress,
        communityId,
        isAdmin: admins[user.id!],
        isModerator: moderators[user.id!],
      },
      { transaction },
    );
  });

  return Promise.all(addressPromises);
};
