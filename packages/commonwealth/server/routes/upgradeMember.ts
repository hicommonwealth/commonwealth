import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import type { DB } from '../models';
import type { RoleInstanceWithPermission } from '../util/roles';
import { createRole, findAllRoles, findOneRole } from '../util/roles';

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
  const chain = req.chain;
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
      chain: chain.id,
    },
  });
  if (!memberAddress) return next(new AppError(Errors.NoMember));
  const roles = await findAllRoles(
    models,
    { where: { address_id: memberAddress.id } },
    chain.id
  );
  if (!roles) return next(new AppError(Errors.NoMember));

  // There should only be one role per address per chain/community
  const member = await findOneRole(
    models,
    { where: { address_id: memberAddress.id } },
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
    // give each permissions a integer ranking
    const roleRanking = {
      admin: 2,
      moderator: 1,
      member: 0,
    };
    const rankingToRole = {
      2: 'admin',
      1: 'moderator',
      0: 'member',
    };
    const newRoleRanking = roleRanking[new_role];
    let currentRoleRanking = roleRanking[currentRole];
    if (newRoleRanking === currentRoleRanking) {
      return next(new AppError(Errors.InvalidRole));
    } else if (newRoleRanking > currentRoleRanking) {
      newMember = await createRole(
        models,
        memberAddress.id,
        chain.id,
        new_role
      );
    } else {
      // handle demotions
      while (newRoleRanking < currentRoleRanking) {
        const roleToRemove = rankingToRole[currentRoleRanking];
        const communityRole = await models.CommunityRole.findOne({
          where: {
            chain_id: chain.id,
            name: roleToRemove,
          },
        });
        await models.RoleAssignment.destroy({
          where: {
            address_id: memberAddress.id,
            community_role_id: communityRole.id,
          },
        });
        currentRoleRanking -= 1;
      }
      newMember = await createRole(
        models,
        memberAddress.id,
        chain.id,
        rankingToRole[newRoleRanking]
      );
    }
  } else {
    return next(new AppError(Errors.InvalidRole));
  }
  return res.json({ status: 'Success', result: newMember.toJSON() });
};

export default upgradeMember;
