import type { FindOptions, Transaction } from 'sequelize';
import { Op } from 'sequelize';
import type { DB } from '../models';
import type { AddressInstance } from '../models/address';
import type { CommunityRoleAttributes } from '../models/community_role';
import type { Role } from '../models/role';
import type { RoleAssignmentAttributes } from '../models/role_assignment';

export type RoleInstanceWithPermissionAttributes = RoleAssignmentAttributes & {
  chain_id: string;
  permission: Role;
  allow: number;
  deny: number;
};

export class RoleInstanceWithPermission {
  _roleAssignmentAttributes: RoleAssignmentAttributes;
  chain_id: string;
  permission: Role;
  allow: number;
  deny: number;

  constructor(
    _roleAssignmentInstance: RoleAssignmentAttributes,
    chain_id: string,
    permission: Role,
    allow: number,
    deny: number
  ) {
    this._roleAssignmentAttributes = _roleAssignmentInstance;
    this.chain_id = chain_id;
    this.permission = permission;
    this.allow = allow;
    this.deny = deny;
  }

  public toJSON(): RoleInstanceWithPermissionAttributes {
    return {
      ...this._roleAssignmentAttributes,
      chain_id: this.chain_id,
      permission: this.permission,
      allow: this.allow,
      deny: this.deny,
    };
  }
}

export async function getHighestRoleFromCommunityRoles(
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

function convertToAddressQuery(findOptions: FindOptions) {
  if (findOptions.where['address_id']) {
    findOptions.where['id'] = findOptions.where['address_id'];
    delete findOptions.where['address_id'];
  }

  return findOptions;
}

// Server side helpers
export async function findAllCommunityRolesWithRoleAssignments(
  models: DB,
  findOptions: FindOptions<AddressInstance | { address_id: number }>,
  chain_id?: string,
  permissions?: Role[]
): Promise<CommunityRoleAttributes[]> {
  let roleFindOptions: any;
  if (permissions) {
    roleFindOptions = {
      where: {
        role: { [Op.in]: permissions },
      },
    };
  } else {
    roleFindOptions = {
      where: {},
    };
  }

  if (chain_id) {
    roleFindOptions['where']['chain'] = chain_id;
  }

  // if where exists, replace address_id with id, append it to our where
  if (findOptions.where) {
    findOptions = convertToAddressQuery(findOptions);
    roleFindOptions.where = { ...roleFindOptions.where, ...findOptions.where };
  }

  // we need to take care of includes, if it includes models.Address, we need to remove this from the query
  // but keep the where portion and merge it in with our where portion
  const includeList = {};
  const addressWhere = {};
  if (Array.isArray(findOptions.include)) {
    // if address is included in list of includes, add it to query
    const addressIncludeIndex = findOptions.include.findIndex(
      (i) => i['tableName'] === models.Address.tableName
    );
    includeList['include'] = findOptions.include;
    addressWhere['where'] = findOptions.include[addressIncludeIndex]['where'];
    includeList['include'].splice(addressIncludeIndex, 1); // remove address include from list
  }

  if (addressWhere) {
    roleFindOptions.where = {
      ...addressWhere['where'],
      ...roleFindOptions.where,
    };
  }

  if (includeList['include'] && includeList['include'].length !== 0) {
    roleFindOptions.include = includeList['include'];
  }

  roleFindOptions.attributes = findOptions.attributes;
  roleFindOptions.order = findOptions.order;

  const addresses = await models.Address.findAll(roleFindOptions);
  return addresses.map((a) => {
    const roleAssignments: RoleAssignmentAttributes[] = [
      {
        community_role_id: a.id,
        address_id: a.id,
        is_user_default: a.is_user_default,
        Address: a,
      },
    ];
    const communityRole: CommunityRoleAttributes = {
      id: a.id,
      name: a.role,
      chain_id: a.chain,
      allow: 0 as any,
      deny: 0 as any,
      created_at: a.created_at,
      updated_at: a.updated_at,
      RoleAssignments: roleAssignments,
    };
    return communityRole;
  });
}

export async function findAllRoles(
  models: DB,
  findOptions: FindOptions<AddressInstance | { address_id: number }>,
  chain_id?: string,
  permissions?: Role[]
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

// Returns highest permission role found
export async function findOneRole(
  models: DB,
  findOptions: FindOptions<RoleAssignmentAttributes>,
  chain_id: string,
  permissions?: Role[]
): Promise<RoleInstanceWithPermission> {
  const communityRoles: CommunityRoleAttributes[] =
    await findAllCommunityRolesWithRoleAssignments(
      models,
      findOptions,
      chain_id,
      permissions
    );
  let communityRole: CommunityRoleAttributes;
  if (communityRoles && communityRoles.length > 0) {
    // find the highest role
    communityRole = await getHighestRoleFromCommunityRoles(communityRoles);
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

export async function createRole(
  models: DB,
  address_id: number,
  chain_id: string,
  role_name?: Role,
  is_user_default?: boolean,
  transaction?: Transaction
): Promise<RoleInstanceWithPermission> {
  is_user_default = !!is_user_default;

  // Member is the lowest role, so return early.
  if (!role_name) {
    const attributes: RoleAssignmentAttributes = {
      community_role_id: 1,
      address_id: address_id,
    };
    return new RoleInstanceWithPermission(attributes, chain_id, 'member', 0, 0);
  }

  // update the role to be either the highest role either assigned or called on the address.
  await models.sequelize.query(
    `
    UPDATE "Addresses"
    SET role = CASE
        WHEN '${role_name}' = 'admin' THEN 'admin'
        WHEN '${role_name}' = 'moderator' AND role = 'member' THEN 'moderator'
        ELSE role
        END,
        is_user_default = ${is_user_default}
    WHERE id = ${address_id};
  `,
    transaction ? { transaction } : null
  );

  // for backwards compatibility, should be removed
  const assignment: RoleAssignmentAttributes = {
    community_role_id: -1,
    address_id: address_id,
  };

  return new RoleInstanceWithPermission(assignment, chain_id, role_name, 0, 0);
}
