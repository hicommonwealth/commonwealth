import Sequelize from 'sequelize';
import { Response, NextFunction } from 'express';
import validateChain from '../util/validateChain';
import { NotificationCategories } from '../../shared/types';
import { DB } from '../database';

export const Errors = {
  InvalidChainComm: 'Invalid chain or community',
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  RoleAlreadyExists: 'Role already exists',
};

const createRole = async (
  models: DB,
  req,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);

  if (error) return next(new Error(error));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.address_id) return next(new Error(Errors.InvalidAddress));

  const validAddress = await models.Address.findOne({
    where: {
      id: req.body.address_id,
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null },
    },
  });
  if (!validAddress) return next(new Error(Errors.InvalidAddress));

  const [role] = await models.Role.findOrCreate({
    where: {
      address_id: validAddress.id,
      chain_id: chain.id,
    },
  });

  const [subscription] = await models.Subscription.findOrCreate({
    where: {
      subscriber_id: req.user.id,
      category_id: NotificationCategories.NewThread,
      chain_id: chain.id,
      object_id: chain.id,
      is_active: true,
    },
  });

  return res.json({
    status: 'Success',
    result: { role: role.toJSON(), subscription: subscription.toJSON() },
  });
};

export default createRole;
