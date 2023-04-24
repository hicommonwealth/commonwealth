import { AppError } from 'common-common/src/errors';
import type { NextFunction } from 'express';
import { DB } from 'server/models';
import { AddressInstance } from 'server/models/address';
import { findAllRoles } from './roles';
import { Op } from 'sequelize';

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
  next: NextFunction
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
      ['admin', 'moderator']
    );
    const role = roles.find((r) => {
      return r.chain_id === chain;
    });
    if (!role) return next(new AppError(Errors.NotAdminOrOwner));
  }
};
