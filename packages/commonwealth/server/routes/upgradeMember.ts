import { AppError } from 'common-common/src/errors';
import { isRole } from 'common-common/src/roles';
import type { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import type { DB } from '../models';
import { failure } from '../types';

export const Errors = {
  InvalidAddress: 'Invalid address',
  InvalidRole: 'Invalid role',
  NotLoggedIn: 'Not logged in',
  MustBeAdmin: 'Must be an admin to upgrade member',
  NoMember: 'Cannot find member to upgrade',
  MustHaveAdmin: 'Communities must have at least one admin',
};

export const upgradeMemberValidation = [
  body('new_role').custom(async (new_role) => {
    if (!new_role || !isRole(new_role)) throw new AppError(Errors.InvalidRole);
  }),
  body('address').isString().withMessage(Errors.InvalidAddress),
];

const upgradeMember = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return next(new AppError(errors[0].msg));
  }

  if (!req.user) return next(new AppError(Errors.NotLoggedIn));

  const chain = req.chain;
  const { address, new_role } = req.body;

  // Get address ids of user making request to assert admin status
  const requesterAddresses = await req.user.getAddresses();
  const requesterAddressIds = requesterAddresses
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);

  const addresses = await models.Address.findAll({
    where: {
      chain: chain.id,
      [Op.or]: {
        id: { [Op.in]: requesterAddressIds },
        address: address,
      },
    },
  });

  const targetAddress = addresses.find((a) => address === a.address);

  // check if address provided exists
  if (!targetAddress) return next(new AppError(Errors.NoMember));

  const allCommunityAdmin = addresses.filter((m) => m.role === 'admin');
  const requesterAdminRoles = allCommunityAdmin.filter((a) =>
    requesterAddressIds.includes(a.id)
  );

  if (requesterAdminRoles.length < 1 && !req.user.isAdmin)
    return next(new AppError(Errors.MustBeAdmin));

  const requesterAdminAddressIds = requesterAdminRoles.map(
    (r) => r.toJSON().id
  );
  const isLastAdmin = allCommunityAdmin.length < 2;
  const adminSelfDemoting =
    requesterAdminAddressIds.includes(address.id) && new_role !== 'admin';

  if (isLastAdmin && adminSelfDemoting) {
    return next(new AppError(Errors.MustHaveAdmin));
  }

  if (new_role === targetAddress.role) {
    return next(new AppError(Errors.InvalidRole));
  }

  // If all validations pass, update role;
  targetAddress.role = new_role;
  await targetAddress.save();

  return res.json({ status: 'Success', result: targetAddress.toJSON() });
};

export default upgradeMember;
