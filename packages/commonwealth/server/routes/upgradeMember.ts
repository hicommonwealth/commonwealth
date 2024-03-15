import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { isRole } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { validateOwner } from 'server/util/validateOwner';

export const Errors = {
  InvalidAddress: 'Invalid address',
  InvalidRole: 'Invalid role',
  NotLoggedIn: 'Not signed in',
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
  next: NextFunction,
) => {
  const { user } = req;
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return next(new AppError(errors[0].msg));
  }

  const { community } = req;
  const { address, new_role } = req.body;

  const isAdmin = await validateOwner({
    models,
    user,
    communityId: community.id,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    return next(new AppError(Errors.MustBeAdmin));
  }

  // check if address provided exists
  const targetAddress = await models.Address.findOne({
    where: {
      community_id: community.id,
      address: address,
    },
  });

  if (!targetAddress) return next(new AppError(Errors.NoMember));

  if (new_role === targetAddress.role) {
    return next(new AppError(Errors.InvalidRole));
  }

  // if demoting from admin ensure at least 1 other admin remains
  if (
    targetAddress.role === 'admin' &&
    (new_role === 'moderator' || new_role === 'member')
  ) {
    const otherExistingAdmin = await models.Address.findOne({
      where: {
        community_id: community.id,
        role: 'admin',
        id: {
          [Op.ne]: targetAddress.id,
        },
      },
    });

    if (!otherExistingAdmin && !req.user.isAdmin) {
      return next(new AppError(Errors.MustHaveAdmin));
    }
  }

  // If all validations pass, update role;
  targetAddress.role = new_role;
  await targetAddress.save();

  return res.json({
    status: 'Success',
    result: {
      is_user_default: targetAddress.is_user_default,
      id: targetAddress.id,
      address: targetAddress.address,
      address_id: targetAddress.id,
      updated_at: targetAddress.updated_at,
      created_at: targetAddress.created_at,
      community_id: targetAddress.community_id,
      permission: targetAddress.role,
      allow: '0',
      deny: '0',
    },
  });
};

export default upgradeMember;
