import Sequelize from 'sequelize';
import { Response, NextFunction } from 'express';
import validateChain from '../util/validateChain';
import { DB } from '../database';

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
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new Error(error));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.address || !req.body.author_chain)
    return next(new Error(Errors.InvalidAddress));

  const validAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      chain: req.body.author_chain,
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null },
    },
  });
  if (!validAddress) return next(new Error(Errors.InvalidAddress));

  const existingRole = await models.Role.findOne({
    where: {
      address_id: validAddress.id,
      chain_id: chain.id,
    },
  });
  if (!existingRole) return next(new Error(Errors.RoleDNE));

  validAddress.last_active = new Date();
  await validAddress.save();

  const otherAddresses = await models.Address.findAll({
    where: {
      id: { [Sequelize.Op.ne]: validAddress.id },
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null },
    },
  });

  await models.Role.update(
    { is_user_default: false },
    {
      where: {
        address_id: { [Sequelize.Op.in]: otherAddresses.map((a) => a.id) },
        chain_id: chain.id,
      },
    }
  );
  existingRole.is_user_default = true;
  await existingRole.save();

  return res.json({ status: 'Success' });
};

export default setDefaultRole;
