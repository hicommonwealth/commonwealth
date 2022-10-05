import { Transaction } from 'sequelize/types';
import { RoleName } from 'server/models/community_role';
import { sequelize, DB } from '../database';
import { RoleAssignmentInstance } from '../models/role_assignment';

export async function createDefaultCommunityRoles(
  models: DB,
  chain_id: string
): Promise<void> {
  // Create default roles
  const community_roles = [
    { name: RoleName.Admin, permissions: BigInt(0) },
    { name: RoleName.Moderator, permissions: BigInt(0) },
    { name: RoleName.Member, permissions: BigInt(0) },
  ];
  community_roles.forEach(async (crole) => {
    const role = await models.CommunityRole.create({
      chain_id,
      name: crole.name,
      permissions: crole.permissions,
    });
    if (!role) {
      throw new Error('Failed to create new role');
    }
  });
}

export async function createRole(
  models: DB,
  address_id: number,
  chain_id: string,
  role_name: RoleName,
  transaction?: Transaction
): Promise<RoleAssignmentInstance> {
  // Get the community role that has given chain_id and name
  const community_role = await models.CommunityRole.findOne({
    where: { chain_id, name: role_name },
  });
  if (!community_role) {
    throw new Error('Community role not found');
  }
  // Create role
  const roleAssignment = await models.RoleAssignment.create(
    {
      community_role_id: community_role.id,
      address_id,
    },
    { transaction }
  );
  if (!roleAssignment) {
    throw new Error('Failed to create new role');
  }
  return roleAssignment;
}
