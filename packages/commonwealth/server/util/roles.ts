import { Model, Transaction, Op, FindOptions } from 'sequelize';
import { DB } from '../models';
import {
  CommunityRoleAttributes,
  CommunityRoleInstance,
} from '../models/community_role';
import { Permission } from '../models/role';
import { RoleAssignmentAttributes } from '../models/role_assignment';

export class RoleInstanceWithPermission {
  _roleAssignmentAttributes: RoleAssignmentAttributes;
  chain_id: string;
  permission: Permission;
  allow: bigint;
  deny: bigint;

  constructor(
    _roleAssignmentInstance: RoleAssignmentAttributes,
    chain_id: string,
    permission: Permission,
    allow: bigint,
    deny: bigint
  ) {
    this._roleAssignmentAttributes = _roleAssignmentInstance;
    this.chain_id = chain_id;
    this.permission = permission;
    this.allow = allow;
    this.deny = deny;
  }

  public toJSON(): RoleAssignmentAttributes & {
    chain_id: string;
    permission: Permission;
    allow: bigint;
    deny: bigint;
  } {
    return {
      ...this._roleAssignmentAttributes,
      chain_id: this.chain_id,
      permission: this.permission,
      allow: this.allow,
      deny: this.deny,
    };
  }
}

export async function getHighestRole(
  roles: CommunityRoleAttributes[]
): Promise<CommunityRoleAttributes> {
  if (roles.findIndex((r) => r.name === 'admin') !== -1) {
    return roles[roles.findIndex((r) => r.name === 'admin')];
  } else if (roles.findIndex((r) => r.name === 'moderator') !== -1) {
    return roles[roles.findIndex((r) => r.name === 'moderator')];
  } else {
    return roles[roles.findIndex((r) => r.name === 'member')];
  }
}

export async function findAllCommunityRolesWithRoleAssignments(
  models: DB,
  findOptions: FindOptions<RoleAssignmentAttributes>,
  chain_id?: string,
  permissions?: Permission[]
): Promise<CommunityRoleAttributes[]> {
  let roleFindOptions: any;
  const whereCondition = {};
  if (chain_id) {
    whereCondition['chain_id'] = chain_id;
  }
  if (permissions) {
    roleFindOptions = {
      where: {
        [Op.and]: [
          { chain_id },
          {
            name: {
              [Op.or]: permissions,
            },
          },
        ],
      },
      include: [
        {
          model: models.RoleAssignment,
          ...findOptions,
        },
      ],
    };
  } else {
    roleFindOptions = {
      where: whereCondition,
      include: [
        {
          model: models.RoleAssignment,
          ...findOptions,
        },
      ],
    };
  }
  const communityRoles = await models.CommunityRole.findAll(roleFindOptions);
  return communityRoles.map((communityRole) => communityRole.toJSON());
}

export async function findAllRoles(
  models: DB,
  findOptions: FindOptions<RoleAssignmentAttributes>,
  chain_id?: string,
  permissions?: Permission[]
): Promise<RoleInstanceWithPermission[]> {
  // find all CommunityRoles with chain id, permissions and find options given
  const communityRoles: CommunityRoleAttributes[] =
    await findAllCommunityRolesWithRoleAssignments(
      models,
      findOptions,
      chain_id,
      permissions
    );
  const roles: RoleInstanceWithPermission[] = [];
  if (communityRoles) {
    for (const communityRole of communityRoles) {
      const roleAssignments = communityRole.RoleAssignments;
      if (roleAssignments && roleAssignments.length > 0) {
        for (const roleAssignment of roleAssignments) {
          const role = new RoleInstanceWithPermission(
            roleAssignment,
            communityRole.chain_id,
            communityRole.name,
            communityRole.allow,
            communityRole.deny
          );
          roles.push(role);
        }
      }
    }
  }
  return roles;
}

export async function findOneRole(
  models: DB,
  findOptions: FindOptions<RoleAssignmentAttributes>,
  chain_id: string,
  permissions?: Permission[]
): Promise<RoleInstanceWithPermission> {
  const communityRoles: CommunityRoleAttributes[] =
    await findAllCommunityRolesWithRoleAssignments(
      models,
      findOptions,
      chain_id,
      permissions
    );
  let communityRole: CommunityRoleAttributes;
  if (communityRoles) {
    // find the highest role
    communityRole = await getHighestRole(communityRoles);
  } else {
    throw new Error("Couldn't find any community roles");
  }

  let role: RoleInstanceWithPermission = null;
  if (
    communityRole &&
    communityRole.RoleAssignments &&
    communityRole.RoleAssignments.length > 0
  ) {
    const roleAssignment = communityRole.RoleAssignments[0];
    role = new RoleInstanceWithPermission(
      roleAssignment,
      chain_id,
      communityRole.name,
      communityRole.allow,
      communityRole.deny
    );
  }
  return role;
}

export async function createDefaultCommunityRoles(
  models: DB,
  chain_id: string
): Promise<void> {
  // Create default roles
  try {
    await models.CommunityRole.create({
      chain_id,
      name: 'member',
      allow: BigInt(0),
      deny: BigInt(0),
    });
    await models.CommunityRole.create({
      chain_id,
      name: 'moderator',
      allow: BigInt(0),
      deny: BigInt(0),
    });
    await models.CommunityRole.create({
      chain_id,
      name: 'admin',
      allow: BigInt(0),
      deny: BigInt(0),
    });
  } catch (error) {
    throw new Error(`Couldn't create default community roles ${error}`);
  }
}

export async function createRole(
  models: DB,
  address_id: number,
  chain_id: string,
  role_name?: Permission,
  is_user_default?: boolean,
  transaction?: Transaction
): Promise<RoleInstanceWithPermission> {
  if (role_name === undefined) {
    role_name = 'member';
  }

  // check if role is already assigned to address
  const communityRoles = await findAllCommunityRolesWithRoleAssignments(
    models,
    { where: { address_id } },
    chain_id
  );
  if (communityRoles.findIndex((r) => r.name === role_name) !== -1) {
    // if role is already assigned to address, return current highest role this address has on that chain
    const highestCommunityRole: CommunityRoleAttributes = await getHighestRole(
      communityRoles
    );
    if (
      highestCommunityRole.RoleAssignments &&
      highestCommunityRole.RoleAssignments.length > 0
    ) {
      const roleAssignment = highestCommunityRole.RoleAssignments[0];
      const role = new RoleInstanceWithPermission(
        roleAssignment,
        chain_id,
        highestCommunityRole.name,
        highestCommunityRole.allow,
        highestCommunityRole.deny
      );
      return role;
    } else {
      throw new Error('No role found');
    }
  }

  // Get the community role that has given chain_id and name if exists
  let community_role;
  community_role = await models.CommunityRole.findOne({
    where: { chain_id, name: role_name },
  });

  // If the community role doesn't exist, create it
  if (!community_role) {
    community_role = await models.CommunityRole.create({
      name: role_name,
      chain_id,
      allow: BigInt(0),
      deny: BigInt(0),
    });
  }

  // Create role assignment
  const role_assignment = await models.RoleAssignment.create(
    {
      community_role_id: community_role.id,
      address_id,
      is_user_default,
    },
    { transaction }
  );
  if (!role_assignment) {
    throw new Error('Failed to create new role');
  }
  return new RoleInstanceWithPermission(
    role_assignment.toJSON(),
    chain_id,
    role_name,
    community_role.allow,
    community_role.deny
  );
}
