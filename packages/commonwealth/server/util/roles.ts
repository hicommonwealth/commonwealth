import type { Transaction, FindOptions } from 'sequelize';
import { Op } from 'sequelize';
import { aggregatePermissions } from 'commonwealth/shared/utils';
import type { Action } from 'commonwealth/shared/permissions';
import {
  PermissionManager,
  PermissionError,
  ToCheck,
  everyonePermissions,
} from 'commonwealth/shared/permissions';
import type { DB } from '../models';
import type { MemberClassAttributes } from '../models/member_class';
import type { Permission } from '../models/role';
import type { MembershipAttributes } from '../models/membership';
import type { AddressInstance } from '../models/address';
import type { RoleObject } from '../../shared/types';

export type RoleInstanceWithPermissionAttributes = MembershipAttributes & {
  chain_id: string;
  permission: Permission;
  allow: bigint;
  deny: bigint;
};

export class RoleInstanceWithPermission {
  _membershipAttributes: MembershipAttributes;
  chain_id: string;
  permission: Permission;
  allow: bigint;
  deny: bigint;

  constructor(
    _membershipInstance: MembershipAttributes,
    chain_id: string,
    permission: Permission,
    allow: bigint,
    deny: bigint
  ) {
    this._membershipAttributes = _membershipInstance;
    this.chain_id = chain_id;
    this.permission = permission;
    this.allow = allow;
    this.deny = deny;
  }

  public toJSON(): RoleInstanceWithPermissionAttributes {
    return {
      ...this._membershipAttributes,
      chain_id: this.chain_id,
      permission: this.permission,
      allow: this.allow,
      deny: this.deny,
    };
  }
}

export async function getHighestRoleFromMemberClasses(
  roles: MemberClassAttributes[]
): Promise<MemberClassAttributes> {
  if (roles.findIndex((r) => r.name === 'admin') !== -1) {
    return roles[roles.findIndex((r) => r.name === 'admin')];
  } else if (roles.findIndex((r) => r.name === 'moderator') !== -1) {
    return roles[roles.findIndex((r) => r.name === 'moderator')];
  } else {
    return roles[roles.findIndex((r) => r.name === 'member')];
  }
}

// Server side helpers
export async function findAllMemberClassesWithMemberships(
  models: DB,
  findOptions: FindOptions<MembershipAttributes>,
  chain_id?: string,
  permissions?: Permission[]
): Promise<MemberClassAttributes[]> {
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
          model: models.Membership,
          ...findOptions,
        },
      ],
    };
  } else {
    roleFindOptions = {
      where: whereCondition,
      include: [
        {
          model: models.Membership,
          ...findOptions,
        },
      ],
    };
  }

  const memberClasses = await models.MemberClass.findAll(roleFindOptions);
  return memberClasses.map((memberClass) => memberClass.toJSON());
}

export async function findAllRoles(
  models: DB,
  findOptions: FindOptions<MembershipAttributes>,
  chain_id?: string,
  permissions?: Permission[]
): Promise<RoleInstanceWithPermission[]> {
  // find all MemberClasses with chain id, permissions and find options given
  const memberClasses: MemberClassAttributes[] =
    await findAllMemberClassesWithMemberships(
      models,
      findOptions,
      chain_id,
      permissions
    );
  const roles: RoleInstanceWithPermission[] = [];
  if (memberClasses) {
    for (const memberClass of memberClasses) {
      const memberships = memberClass.Memberships;
      if (memberships && memberships.length > 0) {
        for (const membership of memberships) {
          const role = new RoleInstanceWithPermission(
            membership,
            memberClass.chain_id,
            memberClass.name,
            memberClass.allow,
            memberClass.deny
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
  findOptions: FindOptions<MembershipAttributes>,
  chain_id: string,
  permissions?: Permission[]
): Promise<RoleInstanceWithPermission> {
  const memberClasses: MemberClassAttributes[] =
    await findAllMemberClassesWithMemberships(
      models,
      findOptions,
      chain_id,
      permissions
    );
  let memberClass: MemberClassAttributes;
  if (memberClasses) {
    // find the highest role
    memberClass = await getHighestRoleFromMemberClasses(memberClasses);
  } else {
    throw new Error("Couldn't find any community roles");
  }

  let role: RoleInstanceWithPermission = null;
  if (
    memberClass &&
    memberClass.Memberships &&
    memberClass.Memberships.length > 0
  ) {
    const membership = memberClass.Memberships[0];
    role = new RoleInstanceWithPermission(
      membership,
      chain_id,
      memberClass.name,
      memberClass.allow,
      memberClass.deny
    );
  }
  return role;
}

export async function createDefaultMemberClasses(
  models: DB,
  chain_id: string
): Promise<void> {
  // Create default roles
  try {
    await models.MemberClass.create({
      chain_id,
      name: 'member',
      allow: BigInt(0),
      deny: BigInt(0),
    });
    await models.MemberClass.create({
      chain_id,
      name: 'moderator',
      allow: BigInt(0),
      deny: BigInt(0),
    });
    await models.MemberClass.create({
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
  const memberClasses = await findAllMemberClassesWithMemberships(
    models,
    { where: { address_id } },
    chain_id
  );
  if (memberClasses.findIndex((r) => r.name === role_name) !== -1) {
    // if role is already assigned to address, return current highest role this address has on that chain
    const highestMemberClass: MemberClassAttributes =
      await getHighestRoleFromMemberClasses(memberClasses);
    if (
      highestMemberClass.Memberships &&
      highestMemberClass.Memberships.length > 0
    ) {
      const membership = highestMemberClass.Memberships[0];
      const role = new RoleInstanceWithPermission(
        membership,
        chain_id,
        highestMemberClass.name,
        highestMemberClass.allow,
        highestMemberClass.deny
      );
      return role;
    } else {
      throw new Error('No role found');
    }
  }

  // Get the community role that has given chain_id and name if exists
  let member_class;
  member_class = await models.MemberClass.findOne({
    where: { chain_id, name: role_name },
  });

  // If the community role doesn't exist, create it
  if (!member_class) {
    member_class = await models.MemberClass.create({
      name: role_name,
      chain_id,
      allow: BigInt(0),
      deny: BigInt(0),
    });
  }

  // Create role assignment
  const membership = await models.Membership.create(
    {
      member_class_id: member_class.id,
      address_id,
      is_user_default,
    },
    { transaction }
  );
  if (!membership) {
    throw new Error('Failed to create new role');
  }
  return new RoleInstanceWithPermission(
    membership.toJSON(),
    chain_id,
    role_name,
    member_class.allow,
    member_class.deny
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
        model: models.Membership,
      },
    ],
  });
  if (!addressInstances) {
    return undefined;
  }
  /* check if any of the addresses has a role assignment that is_user_default is true
  and if true return that address instance */
  const activeAddress = addressInstances.find((a) => {
    if (a.Memberships && a.Memberships.length > 0) {
      if (a.Memberships.some((r) => r.is_user_default)) return a;
    }
    return undefined;
  });
  return activeAddress;
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
