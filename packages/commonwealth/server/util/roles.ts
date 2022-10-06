import { Transaction } from 'sequelize/types';
import { DB } from '../database';
import { Permission } from '../models/role';
import { RoleAssignmentInstance } from '../models/role_assignment';

export type RoleInstanceWithPermission = RoleAssignmentInstance & {
  permission: Permission;
  chain_id: string;
};

export async function createDefaultCommunityRoles(
  models: DB,
  chain_id: string
): Promise<void> {
  // Create default roles
  try {
    await models.CommunityRole.create({
      chain_id,
      name: 'member',
      permissions: BigInt(0),
    });
    await models.CommunityRole.create({
      chain_id,
      name: 'moderator',
      permissions: BigInt(0),
    });
    await models.CommunityRole.create({
      chain_id,
      name: 'admin',
      permissions: BigInt(0),
    });
  } catch (error) {
    throw new Error(`Couldn't create default community roles ${error}`);
  }
}

export async function createRole(
  models: DB,
  address_id: number,
  chain_id: string,
  role_name: Permission,
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

export async function findAllRoles(): Promise<RoleInstanceWithPermission> {
  return;
}
