import type { FindOptions, Transaction } from 'sequelize';
import { Op } from 'sequelize';
import CommunityRole from '../../client/scripts/models/CommunityRole';
import type { Action } from '../../shared/permissions';
import {
  everyonePermissions,
  PermissionError,
  PermissionManager,
  ToCheck,
} from '../../shared/permissions';
import type { RoleObject } from '../../shared/types';
import { aggregatePermissions } from '../../shared/utils';
import type { DB } from '../models';
import type { AddressInstance } from '../models/address';
import type { CommunityRoleAttributes } from '../models/community_role';
import type { Permission } from '../models/role';
import type { RoleAssignmentAttributes } from '../models/role_assignment';

export type RoleInstanceWithPermissionAttributes = RoleAssignmentAttributes & {
  chain_id: string;
  permission: Permission;
  allow: bigint;
  deny: bigint;
};

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
  permissions?: Permission[]
): Promise<CommunityRoleAttributes[]> {
  let roleFindOptions: any;
  if (permissions) {
    roleFindOptions = {
      where: {
        chain: chain_id,
        role: { [Op.in]: permissions },
      },
    };
  } else {
    roleFindOptions = {
      where: chain_id,
    };
  }

  // if where exists, replace address_id with id, append it to our where
  if (findOptions.where) {
    findOptions = convertToAddressQuery(findOptions);
    roleFindOptions.where = { ...roleFindOptions.where, ...findOptions.where };
  }

  // we need to take care of includes, if it includes models.Address, we need to remove this from the query
  // but keep the where portion and merge it in with our where portion
  let addressInclude;
  if (Array.isArray(findOptions.include)) {
    // if address is included in list of includes, add it to query
    addressInclude = findOptions.include.find(
      (i) => i['model'] === models.Address
    );
  } else if (findOptions.include['model'] === models.Address) {
    // if address is included as only include, add it to query
    addressInclude = findOptions.include;
  }

  if (addressInclude) {
    roleFindOptions.where = { ...addressInclude.where, ...findOptions.where };
    addressInclude = null; // remove it from the include query
  }

  roleFindOptions.include = findOptions.include;
  roleFindOptions.attributes = findOptions.attributes;

  const addresses = await models.Address.findAll(roleFindOptions);
  return addresses.map(
    (a) =>
      new CommunityRole(a.id, a.role, a.chain, 0, 0, a.created_at, a.updated_at)
  );
}

export async function findAllRoles(
  models: DB,
  findOptions: FindOptions<AddressInstance | { address_id: number }>,
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

// Returns highest permission role found
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
    const highestCommunityRole: CommunityRoleAttributes =
      await getHighestRoleFromCommunityRoles(communityRoles);
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

// Permissions Helpers for Roles

export async function isAddressPermitted(
  models: DB,
  address_id: number,
  chain_id: string,
  action: Action
): Promise<boolean> {
  const roles = await findAllRoles(models, { where: { address_id } }, chain_id);

  const permissionsManager = new PermissionManager();

  const chain = await models.Chain.findOne({ where: { id: chain_id } });
  if (!chain) {
    throw new Error('Chain not found');
  }

  if (roles.length > 0) {
    const rolesWithPermission = roles.map((role) => {
      return {
        permission: role.permission,
        allow: role.allow,
        deny: role.deny,
      } as RoleObject;
    });

    const permission = aggregatePermissions(rolesWithPermission, {
      allow: chain.default_allow_permissions,
      deny: chain.default_deny_permissions,
    });

    const permitted = permissionsManager.hasPermission(
      permission,
      action,
      ToCheck.Deny
    );
    if (!permitted) {
      throw new Error('Not permitted');
    } else {
      return true;
    }
  }
}

export async function getActiveAddress(
  models: DB,
  user_id: number,
  chain: string
): Promise<AddressInstance | undefined> {
  // get address instances for user on chain
  const addressInstances = await models.Address.findAll({
    where: {
      user_id,
      chain,
    },
    include: [
      {
        model: models.RoleAssignment,
      },
    ],
  });
  if (!addressInstances) {
    return undefined;
  }
  /* check if any of the addresses has a role assignment that is_user_default is true
  and if true return that address instance */
  return addressInstances.find((a) => a.is_user_default);
}

export async function isAnyonePermitted(
  models: DB,
  chain_id: string,
  action: Action
): Promise<PermissionError | boolean> {
  const chain = await models.Chain.findOne({ where: { id: chain_id } });
  if (!chain) {
    throw new Error('Chain not found');
  }
  const permissionsManager = new PermissionManager();
  const permission = permissionsManager.computePermissions(
    everyonePermissions,
    [
      {
        allow: chain.default_allow_permissions,
        deny: chain.default_deny_permissions,
      },
    ]
  );

  if (!permissionsManager.hasPermission(permission, action, ToCheck.Allow)) {
    return PermissionError.NOT_PERMITTED;
  }
  return true;
}

export async function checkReadPermitted(
  models: DB,
  chain_id: string,
  action: Action,
  user_id?: number
): Promise<PermissionError | boolean> {
  if (user_id) {
    // get active address
    const activeAddressInstance = await getActiveAddress(
      models,
      user_id,
      chain_id
    );

    if (activeAddressInstance) {
      // check if the user has permission to view the channel
      const permission_error = await isAddressPermitted(
        models,
        activeAddressInstance.id,
        chain_id,
        action
      );
      if (permission_error) {
        return PermissionError.NOT_PERMITTED;
      }
      return true;
    }
  }

  const permission_error = await isAnyonePermitted(models, chain_id, action);
  if (permission_error) {
    return PermissionError.NOT_PERMITTED;
  }
  return true;
}
