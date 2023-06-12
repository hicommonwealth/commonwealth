import { AppError } from 'common-common/src/errors';
import type { NextFunction, Response } from 'express';
import Sequelize, { Op } from 'sequelize';
import type { DB } from '../models';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  RoleDNE: 'Role does not exist',
};

const setDefaultRole = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  if (!req.body.address || !req.body.author_chain)
    return next(new AppError(Errors.InvalidAddress));

  const validAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      chain: req.body.author_chain,
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null },
    },
  });
  if (!validAddress) return next(new AppError(Errors.InvalidAddress));

  validAddress.last_active = new Date();
  validAddress.is_user_default = true;
  await validAddress.save();

  return res.json({ status: 'Success' });
};

export default setDefaultRole;
