import { AppError } from 'common-common/src/errors';
import type { NextFunction, Response } from 'express';
import Sequelize, { Op } from 'sequelize';
import type { DB } from '../models';
import { findOneRole } from '../util/roles';

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
  const chain = req.chain;
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  if (!req.body.address || !req.body.author_chain)
    return next(new AppError(Errors.InvalidAddress));

  const existingRole = await findOneRole(
    models,
    { where: { address: req.body.address } },
    chain.id
  );
  if (!existingRole) return next(new AppError(Errors.RoleDNE));

  const [affectedRows] = await models.Address.update(
    { is_user_default: true },
    {
      where: {
        address: req.body.address,
        chain: req.body.author_chain,
        user_id: req.user.id,
        verified: { [Sequelize.Op.ne]: null },
        is_user_default: false,
      },
      returning: true,
    }
  );

  if (affectedRows === 0) {
    return next(new AppError(Errors.InvalidAddress));
  }

  return res.json({ status: 'Success' });
};

export default setDefaultRole;
