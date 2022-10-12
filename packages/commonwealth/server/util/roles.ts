import { Model, Transaction, Op, FindOptions } from 'sequelize/types';
import { DB, sequelize } from '../database';
import { Permission } from '../models/role';
import { RoleAssignmentAttributes } from '../models/role_assignment';

export class RoleInstanceWithPermission {
  _roleAssignmentAttributes: RoleAssignmentAttributes;
  chain_id: string;
  permission: Permission;

  constructor(
    _roleAssignmentInstance: RoleAssignmentAttributes,
    chain_id: string,
    permission: Permission
  ) {
    this._roleAssignmentAttributes = _roleAssignmentInstance;
    this.chain_id = chain_id;
    this.permission = permission;
  }

  public toJSON(): RoleAssignmentAttributes & {
    chain_id: string;
    permission: Permission;
  } {
    return {
      ...this._roleAssignmentAttributes,
      chain_id: this.chain_id,
      permission: this.permission,
    };
  }
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
  is_user_default?: boolean,
  transaction?: Transaction
): Promise<RoleInstanceWithPermission> {
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
      is_user_default,
    },
    { transaction }
  );
  if (!roleAssignment) {
    throw new Error('Failed to create new role');
  }
  return new RoleInstanceWithPermission(roleAssignment, chain_id, role_name);
}

export async function findAllRoles(
  models: DB,
  findOptions: FindOptions,
  chain_id?: string,
  permissions?: Permission[]
): Promise<RoleInstanceWithPermission[]> {
  let roleFindOptions: any;
  if (chain_id === undefined) {
    roleFindOptions = {
      include: [
        {
          model: models.RoleAssignment,
          findOptions,
        },
      ],
    };
  } else if (permissions === undefined) {
    roleFindOptions = {
      where: {
        chain_id,
      },
      include: {
        model: models.RoleAssignment,
        findOptions,
      },
    };
  } else {
    roleFindOptions = {
      where: {
        [Op.and]: [
          { chain_id },
          {
            permissions: {
              [Op.or]: permissions.map((x) => ({
                name: x,
              })),
            },
          },
        ],
      },
      include: {
        model: models.RoleAssignment,
        findOptions,
      },
    };
  }
  const communityRoles = await models.CommunityRole.findAll(roleFindOptions);
  const roles: RoleInstanceWithPermission[] = [];
  for (const communityRole of communityRoles) {
    const roleAssignments = await communityRole.getRoleAssignments();
    if (roleAssignments.length > 0) {
      for (const roleAssignment of roleAssignments) {
        const role = new RoleInstanceWithPermission(
          roleAssignment,
          chain_id,
          communityRole.name
        );
        roles.push(role);
      }
    }
  }
  return roles;
}

export async function findOneRole(
  models: DB,
  findOptions: FindOptions,
  chain_id: string,
  permissions?: Permission[]
): Promise<RoleInstanceWithPermission> {
  const roleFindOptions = {
    where: {
      [Op.and]: [
        { chain_id },
        {
          permissions: {
            [Op.or]: permissions.map((x) => ({
              name: x,
            })),
          },
        },
      ],
    },
    include: {
      model: models.RoleAssignment,
      findOptions,
    },
    order: sequelize.fn(
      'field',
      sequelize.col('name'),
      'admin',
      'moderator',
      'member'
    ),
  };

  const communityRole = await models.CommunityRole.findOne(roleFindOptions);
  // Retrieve the first role as it will be the highest permission role for the address_id
  const roleAssignment = await communityRole.getRoleAssignments()[0];
  const role: RoleInstanceWithPermission = new RoleInstanceWithPermission(
    roleAssignment,
    chain_id,
    communityRole.name
  );

  return role;
}
