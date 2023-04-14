import type { DB } from '../models';
// Helper function to look up an (address, author_chain) pair of parameters,
// and check that it's owned by the current user. Only for POST requests.

import { Op } from 'sequelize';
import type { AddressInstance } from '../models/address';
import type { UserInstance } from '../models/user';

type AddressChainReq = {
  body?: { author_chain: string; address: string };
  user?: UserInstance;
};

type UnownedAddresses = { address: string } | { addressId: number };
// returns a list of addresses owned and not owned by user
export const filterAddressOwnedByUser = async (
  models: DB,
  user_id: number,
  chains: string[],
  addresses: string[],
  addressIds: number[]
): Promise<{ owned: AddressInstance[]; unowned: UnownedAddresses[] }> => {
  const where = {
    chain: { [Op.in]: chains },
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
  req: AddressChainReq
): Promise<[AddressInstance | null, string | null]> => {
  if (!req.user?.id) {
    return [null, 'Not logged in'];
  }

  if (!req.body?.author_chain || !req.body?.address) {
    return [null, 'Invalid public key/chain'];
  }

  const author = await models.Address.findOne({
    where: {
      chain: req.body.author_chain,
      address: req.body.address,
      user_id: req.user.id,
    },
  });
  if (!author || !author.verified || author.user_id !== req.user.id) {
    return [null, 'Invalid public key/chain'];
  }
  return [author, null];
};

export default lookupAddressIsOwnedByUser;
