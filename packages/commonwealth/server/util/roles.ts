import type {
  AddressAttributes,
  AddressInstance,
  CommunityRoleAttributes,
  DB,
  RoleAssignmentAttributes,
} from '@hicommonwealth/model';
import type { Role } from '@hicommonwealth/shared';
import type { FindOptions, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';

type RoleInstanceWithPermissionAttributes = RoleAssignmentAttributes & {
  community_id: string;
  permission: Role;
  allow: number;
  deny: number;
};

class RoleInstanceWithPermission {
  _roleAssignmentAttributes: RoleAssignmentAttributes;
  community_id: string;
  permission: Role;
  allow: number;
  deny: number;

  constructor(
    _roleAssignmentInstance: RoleAssignmentAttributes,
    community_id: string,
    permission: Role,
    allow: number,
    deny: number,
  ) {
    this._roleAssignmentAttributes = _roleAssignmentInstance;
    this.community_id = community_id;
    this.permission = permission;
    this.allow = allow;
    this.deny = deny;
  }

  public toJSON(): RoleInstanceWithPermissionAttributes {
    return {
      ...this._roleAssignmentAttributes,
      community_id: this.community_id,
      permission: this.permission,
      allow: this.allow,
      deny: this.deny,
    };
  }
}

function convertToAddressQuery(findOptions: FindOptions) {
  // @ts-expect-error StrictNullChecks
  if (findOptions.where['address_id']) {
    // @ts-expect-error StrictNullChecks
    findOptions.where['id'] = findOptions.where['address_id'];
    // @ts-expect-error StrictNullChecks
    delete findOptions.where['address_id'];
  }

  return findOptions;
}

// Server side helpers
export async function findAllCommunityRolesWithRoleAssignments(
  models: DB,
  findOptions: FindOptions<AddressInstance | { address_id: number }>,
  community_id?: string,
  permissions?: Role[],
): Promise<CommunityRoleAttributes[]> {
  const roleWhereOptions: WhereOptions<AddressAttributes> = {};
  const roleFindOptions: FindOptions<AddressAttributes> = {
    where: roleWhereOptions,
  };
  if (permissions) {
    roleWhereOptions.role = { [Op.in]: permissions };
  }

  if (community_id) {
    roleWhereOptions.community_id = community_id;
  }

  // if where exists, replace address_id with id, append it to our where
  if (findOptions.where) {
    findOptions = convertToAddressQuery(findOptions);
    roleFindOptions.where = { ...roleFindOptions.where, ...findOptions.where };
  }

  // we need to take care of includes, if it includes models.Address, we need to remove this from the query
  // but keep the where portion and merge it in with our where portion
  const includeList = {};
  const addressWhere: WhereOptions<AddressAttributes> = {};
  if (Array.isArray(findOptions.include)) {
    // if address is included in list of includes, add it to query
    const addressIncludeIndex = findOptions.include.findIndex(
      (i) => i['tableName'] === models.Address.tableName,
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
        // @ts-expect-error StrictNullChecks
        community_role_id: a.id,
        // @ts-expect-error StrictNullChecks
        address_id: a.id,
        is_user_default: a.is_user_default,
        Address: a,
      },
    ];
    const communityRole: CommunityRoleAttributes = {
      id: a.id,
      name: a.role,
      community_id: a.community_id!,
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
  community_id?: string,
  permissions?: Role[],
): Promise<RoleInstanceWithPermission[]> {
  // find all CommunityRoles with community id, permissions and find options given
  const communityRoles: CommunityRoleAttributes[] =
    await findAllCommunityRolesWithRoleAssignments(
      models,
      findOptions,
      community_id,
      permissions,
    );
  const roles: RoleInstanceWithPermission[] = [];
  if (communityRoles) {
    for (const communityRole of communityRoles) {
      const roleAssignments = communityRole.RoleAssignments;
      if (roleAssignments && roleAssignments.length > 0) {
        for (const roleAssignment of roleAssignments) {
          const role = new RoleInstanceWithPermission(
            roleAssignment,
            communityRole.community_id,
            communityRole.name,
            communityRole.allow,
            communityRole.deny,
          );
          roles.push(role);
        }
      }
    }
  }
  return roles;
}
