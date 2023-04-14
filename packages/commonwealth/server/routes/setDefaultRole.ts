import type { DB } from '../models';
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Response } from 'express';
import Sequelize, { Op } from 'sequelize';
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

  const validAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      chain: req.body.author_chain,
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null },
    },
  });
  if (!validAddress) return next(new AppError(Errors.InvalidAddress));

  const existingRole = await findOneRole(
    models,
    { where: { address_id: validAddress.id } },
    chain.id
  );
  if (!existingRole) return next(new AppError(Errors.RoleDNE));

  const existingRoleInstanceToUpdate = await models.RoleAssignment.findOne({
    where: {
      address_id: validAddress.id,
      community_role_id: existingRole.toJSON().community_role_id,
    },
  });

  validAddress.last_active = new Date();
  await validAddress.save();

  const otherAddresses = await models.Address.findAll({
    where: {
      id: { [Sequelize.Op.ne]: validAddress.id },
      user_id: req.user.id,
      verified: { [Sequelize.Op.ne]: null },
    },
  });

  const communityRolesToUpdate = await models.CommunityRole.findAll({
    where: {
      chain_id: chain.id,
    },
  });

  await models.RoleAssignment.update(
    { is_user_default: false },
    {
      where: {
        address_id: { [Op.in]: otherAddresses.map((a) => a.id) },
        community_role_id: { [Op.in]: communityRolesToUpdate.map((r) => r.id) },
      },
    }
  );

  existingRoleInstanceToUpdate.is_user_default = true;

  await existingRoleInstanceToUpdate.save();

  return res.json({ status: 'Success' });
};

export default setDefaultRole;
