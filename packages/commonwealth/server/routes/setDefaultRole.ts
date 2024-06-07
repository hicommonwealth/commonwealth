import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Response } from 'express';
import Sequelize from 'sequelize';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  InvalidAddress: 'Invalid address',
  RoleDNE: 'Role does not exist',
};

const setDefaultRole = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  if (!req.body.address || !req.body.author_community_id)
    return next(new AppError(Errors.InvalidAddress));

  const validAddress = await models.Address.findOne({
    // @ts-expect-error StrictNullChecks
    where: {
      address: req.body.address,
      community_id: req.body.author_community_id,
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null },
    },
  });
  if (!validAddress) return next(new AppError(Errors.InvalidAddress));

  validAddress.last_active = new Date();
  validAddress.is_user_default = true;
  await validAddress.save();

  await models.Address.update(
    { is_user_default: false },
    {
      // @ts-expect-error StrictNullChecks
      where: {
        address: { [Sequelize.Op.ne]: req.body.address },
        community_id: req.body.author_community_id,
        user_id: req.user.id,
        verified: { [Sequelize.Op.ne]: null },
      },
    },
  );

  return res.json({ status: 'Success' });
};

export default setDefaultRole;
