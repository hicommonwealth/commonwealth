import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import validateChain from '../util/validateChain';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../database';
import { AppError, ServerError } from 'common-common/src/errors';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  InvalidAddress: 'Invalid address',
  InvalidRole: 'Invalid role',
  NotLoggedIn: 'Not logged in',
  MustBeAdmin: 'Must be an admin to upgrade member',
  NoMember: 'Cannot find member to upgrade',
  MustHaveAdmin: 'Communities must have at least one admin',
};

const ValidRoles = ['admin', 'moderator', 'member'];

const upgradeMember = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new AppError(error));
  const { address, new_role } = req.body;
  if (!address) return next(new AppError(Errors.InvalidAddress));
  if (!new_role) return next(new AppError(Errors.InvalidRole));
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  const requesterAddresses = await req.user.getAddresses();
  const requesterAddressIds = requesterAddresses.filter((addr) => !!addr.verified).map((addr) => addr.id);
  const requesterAdminRoles = await models.Role.findAll({
    where: {
      chain_id: chain.id,
      address_id: { [Op.in]: requesterAddressIds },
      permission: 'admin',
    },
  });

  if (requesterAdminRoles.length < 1 && !req.user.isAdmin) return next(new AppError(Errors.MustBeAdmin));

  const memberAddress = await models.Address.findOne({
    where: {
      address,
    },
    include: [{
      model: models.Role,
      required: true,
      where: {
        chain_id: chain.id,
      }
    }]
  });
  const roles = memberAddress?.Roles;
  if (!memberAddress || !roles) return next(new AppError(Errors.NoMember));

  // There should only be one role per address per chain/community
  const member = await models.Role.findOne({ where: { id: roles[0].id } });
  if (!member) return next(new AppError(Errors.NoMember));

  const allCommunityAdmin = await models.Role.findAll({
    where: {
      chain_id: chain.id,
      permission: 'admin',
    },
  });
  const requesterAdminAddressIds = requesterAdminRoles.map((r) => r.address_id);
  const isLastAdmin = allCommunityAdmin.length < 2;
  const adminSelfDemoting = requesterAdminAddressIds.includes(memberAddress.id)
    && new_role !== 'admin';
  if (isLastAdmin && adminSelfDemoting) {
    return next(new AppError(Errors.MustHaveAdmin));
  }

  if (ValidRoles.includes(new_role)) {
    member.permission = new_role;
  } else {
    return next(new AppError(Errors.InvalidRole));
  }

  await member.save();

  return res.json({ status: 'Success', result: member.toJSON() });
};

export default upgradeMember;
