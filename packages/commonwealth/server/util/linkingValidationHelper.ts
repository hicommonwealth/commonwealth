import { AddressInstance, DB } from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { findAllRoles } from './roles';

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
  chain: string,
) => {
  const userOwnedAddressIds = address
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  if (!userOwnedAddressIds.includes(address_id)) {
    // is not author
    const roles = await findAllRoles(
      models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      chain,
      ['admin', 'moderator'],
    );
    if (roles.length === 0) return false;
    const role = roles.find((r) => {
      return r.community_id === chain;
    });
    return !!role;
  } else {
    return true;
  }
};
