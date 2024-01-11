import { AppError } from '@hicommonwealth/adapters';
import type { NextFunction, Response } from 'express';
import Sequelize from 'sequelize';
import type { DB } from '../models';

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
  if (!req.body.address || !req.body.author_chain)
    return next(new AppError(Errors.InvalidAddress));

  const validAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      community_id: req.body.author_chain,
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
      where: {
        address: { [Sequelize.Op.ne]: req.body.address },
        community_id: req.body.author_chain,
        user_id: req.user.id,
        verified: { [Sequelize.Op.ne]: null },
      },
    },
  );

  return res.json({ status: 'Success' });
};

export default setDefaultRole;
