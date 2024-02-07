// Helper function to look up an (address, author_community_id) pair of parameters,
// and check that it's owned by the current user. Only for POST requests.

import type {
  AddressAttributes,
  AddressInstance,
  DB,
  UserInstance,
} from '@hicommonwealth/model';
import { Op, WhereOptions } from 'sequelize';

type AddressCommunityRequest = {
  body?: {
    author_chain?: string; // obsolete
    author_community_id?: string;
    address: string;
  };
  user?: UserInstance;
};

type UnownedAddresses = { address: string } | { addressId: number };
// returns a list of addresses owned and not owned by user
export const filterAddressOwnedByUser = async (
  models: DB,
  user_id: number,
  communityIds: string[],
  addresses: string[],
  addressIds: number[],
): Promise<{ owned: AddressInstance[]; unowned: UnownedAddresses[] }> => {
  const where: WhereOptions<AddressAttributes> = {
    community_id: { [Op.in]: communityIds },
    user_id,
  };

  // filter out undefined nad null
  const addressesClean = addresses.filter((a) => a != null);
  const addressIdsClean = addressIds.filter((a) => a != null);

  if (addressesClean.length !== 0) where['address'] = { [Op.in]: addresses };
  if (addressIdsClean.length !== 0) where['id'] = { [Op.in]: addressIds };

  // get the list of addresses owned by user
  let addressesOwnedByUser: AddressInstance[] = await models.Address.findAll({
    where,
  });
  addressesOwnedByUser = addressesOwnedByUser.filter((a) => a.verified);

  // cast to set to reduce access runtime
  const unownedAddressesSet = new Set(addressesClean);
  const unownedAddressIdsSet = new Set(addressIdsClean);

  // for each address owned by user, remove it from the unownedAddresses
  addressesOwnedByUser.forEach((author) => {
    unownedAddressesSet.delete(author.address);
    unownedAddressIdsSet.delete(author.id);
  });

  const unowned: UnownedAddresses[] = [];
  unownedAddressesSet.forEach((address) => unowned.push({ address }));
  unownedAddressIdsSet.forEach((addressId) => unowned.push({ addressId }));

  return { owned: addressesOwnedByUser, unowned };
};

const lookupAddressIsOwnedByUser = async (
  models: DB,
  req: AddressCommunityRequest,
): Promise<[AddressInstance | null, string | null]> => {
  if (!req.user?.id) {
    return [null, 'Not signed in'];
  }
  const authorCommunityId =
    req.body?.author_chain || req.body?.author_community_id;
  if (!authorCommunityId) {
    return [null, 'Must provide author community ID'];
  }

  if (!req.body?.address) {
    return [null, 'Must provide an address'];
  }

  const query: WhereOptions<AddressAttributes> = {
    community_id: authorCommunityId,
    address: req.body.address,
  };

  if (!req.user.isAdmin) {
    query.user_id = req.user.id;
  }

  const author = await models.Address.findOne({
    where: query,
  });

  if (!author) {
    return [null, 'Could not find author'];
  }

  if (!author.verified) {
    return [null, 'Author is not verified'];
  }

  if (author.user_id !== req.user.id) {
    return [null, 'Author is not owned by user'];
  }

  return [author, null];
};

export default lookupAddressIsOwnedByUser;
