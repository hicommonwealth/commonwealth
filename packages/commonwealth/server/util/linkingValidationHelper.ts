import { Op } from 'sequelize';
import { DB } from 'server/models';
import { AddressInstance } from 'server/models/address';

export const Errors = {
  NoThread: 'Cannot find thread',
  NotAdminOrOwner: 'Not an admin or owner of this thread',
  InvalidParameter: 'Missing required parameters',
  LinksExist: 'All provided links already exist',
  InvalidSource: 'Provided Source is invalid',
  LinkDeleted: 'Link already deleted or Doesnt exist',
};

export const isAuthorOrAdmin = async (
  models: DB,
  address: AddressInstance[],
  address_id: number,
  chain: string
) => {
  const userOwnedAddressIds = address
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);

  if (userOwnedAddressIds.includes(address_id)) {
    return true;
  }

  // is not author, check if admin or moderator
  const role = await models.Address.findOne({
    where: { chain: chain, id: { [Op.in]: userOwnedAddressIds } },
    attributes: ['role'],
  });
  return role?.role === 'admin' || role?.role === 'moderator';
};
