import Sequelize from 'sequelize';
import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  RoleDNE: 'Role does not exist',
  OtherAdminDNE: 'Must assign another admin',
};

const deleteRole = async (models: DB, req, res: Response, next: NextFunction) => {
  const [chain, error] = await lookupCommunityIsVisibleToUser(models, req.body, req.user);
  if (error) return next(new Error(error));
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.address_id) return next(new Error(Errors.InvalidAddress));

  const validAddress = await models.Address.findOne({
    where: {
      id: req.body.address_id,
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null }
    }
  });
  if (!validAddress) return next(new Error(Errors.InvalidAddress));

  const existingRole = await models.Role.findOne({ where: {
    address_id: req.body.address_id,
    chain_id: chain.id,
  } });
  if (!existingRole) return next(new Error(Errors.RoleDNE));

  if (existingRole.permission === 'admin') {
    const otherExistingAdmin = await models.Role.findOne({ where: {
      address_id: req.body.address_id,
      chain_id: chain.id,
      id: { [Sequelize.Op.ne]: existingRole.id },
      permission: ['admin'],
    }});
    if (!otherExistingAdmin) return next(new Error(Errors.OtherAdminDNE));
  }

  await existingRole.destroy();

  return res.json({ status: 'Success' });
};

export default deleteRole;
