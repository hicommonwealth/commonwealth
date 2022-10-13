import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import validateChain from '../util/validateChain';
import { DB } from '../models';
import { AppError, ServerError } from '../util/errors';
import {
  findAllRoles,
  findOneRole,
  RoleInstanceWithPermission,
} from '../util/roles';

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

const upgradeMember = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.body);
  if (error) return next(new AppError(error));
  const { address, new_role } = req.body;
  if (!address) return next(new AppError(Errors.InvalidAddress));
  if (!new_role) return next(new AppError(Errors.InvalidRole));
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  const requesterAddresses = await req.user.getAddresses();
  const requesterAddressIds = requesterAddresses
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  const requesterAdminRoles = await findAllRoles(
    models,
    { where: { address_id: { [Op.in]: requesterAddressIds } } },
    chain.id,
    ['admin']
  );

  if (requesterAdminRoles.length < 1 && !req.user.isAdmin)
    return next(new AppError(Errors.MustBeAdmin));

  const memberAddress = await models.Address.findOne({
    where: {
      address,
    },
    // include: [
    //   {
    //     model: models.Role,
    //     required: true,
    //     where: {
    //       chain_id: chain.id,
    //     },
    //   },
    // ],
  });
  const roles = await findAllRoles(
    models,
    { where: { address_id: memberAddress.id } },
    chain.id
  );
  if (!memberAddress || !roles) return next(new AppError(Errors.NoMember));

  // There should only be one role per address per chain/community
  const member = await findOneRole(
    models,
    { where: { id: roles[0].toJSON().id } },
    chain.id
  );
  if (!member) return next(new AppError(Errors.NoMember));

  const allCommunityAdmin = await findAllRoles(models, {}, chain.id, ['admin']);
  const requesterAdminAddressIds = requesterAdminRoles.map(
    (r) => r.toJSON().address_id
  );
  const isLastAdmin = allCommunityAdmin.length < 2;
  const adminSelfDemoting =
    requesterAdminAddressIds.includes(memberAddress.id) && new_role !== 'admin';
  if (isLastAdmin && adminSelfDemoting) {
    return next(new AppError(Errors.MustHaveAdmin));
  }
  let newMember: RoleInstanceWithPermission;
  if (ValidRoles.includes(new_role)) {
    // “Demotion” should remove all RoleAssignments above the new role.
    // “Promotion” should create new RoleAssignment above the existing role.
    const currentRole = member.permission;
    if (currentRole === 'member') {
      if (new_role === 'member') {
        return next(new AppError(Errors.InvalidRole));
      } else {
        // Promotion
        const communityRole = await models.CommunityRole.findOne({
          where: {
            chain_id: chain.id,
            name: new_role,
          },
        });
        const newRoleAssignment = await models.RoleAssignment.create({
          address_id: memberAddress.id,
          community_role_id: communityRole.id,
        });
        newMember = new RoleInstanceWithPermission(
          newRoleAssignment.toJSON(),
          chain.id,
          new_role
        );
      }
    } else if (currentRole === 'moderator') {
      if (new_role === 'member') {
        // Demotion
        const communityRole = await models.CommunityRole.findOne({
          where: {
            chain_id: chain.id,
            name: currentRole,
          },
        });
        await models.RoleAssignment.destroy({
          where: {
            address_id: memberAddress.id,
            community_role_id: communityRole.id,
          },
        });
        const newCommunityRole = await models.CommunityRole.findOne({
          where: {
            chain_id: chain.id,
            name: 'member',
          },
        });
        const newRoleAssignment = await models.RoleAssignment.findOne({
          where: {
            address_id: memberAddress.id,
            community_role_id: newCommunityRole.id,
          },
        });
        newMember = new RoleInstanceWithPermission(
          newRoleAssignment.toJSON(),
          chain.id,
          'member'
        );
      } else if (new_role === 'moderator') {
        return next(new AppError(Errors.InvalidRole));
      } else {
        // Promotion
        const communityRole = await models.CommunityRole.findOne({
          where: {
            chain_id: chain.id,
            name: new_role,
          },
        });
        const newRoleAssignment = await models.RoleAssignment.create({
          address_id: memberAddress.id,
          community_role_id: communityRole.id,
        });
        newMember = new RoleInstanceWithPermission(
          newRoleAssignment.toJSON(),
          chain.id,
          new_role
        );
      }
    }
  } else {
    return next(new AppError(Errors.InvalidRole));
  }

  return res.json({ status: 'Success', result: newMember.toJSON() });
};

export default upgradeMember;
