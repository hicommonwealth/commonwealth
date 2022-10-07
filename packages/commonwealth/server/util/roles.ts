import { Model, Transaction } from 'sequelize/types';
import { DB } from '../database';
import { Permission } from '../models/role';
import {
  RoleAssignmentAttributes,
  RoleAssignmentInstance,
  RoleAssignmentModelStatic,
} from '../models/role_assignment';

export class RoleInstanceWithPermission {
  _roleAssignmentInstance: RoleAssignmentInstance;
  chain_id: string;
  permission: Permission;

  constructor(
    _roleAssignmentInstance: RoleAssignmentInstance,
    chain_id: string,
    permission: Permission
  ) {
    this._roleAssignmentInstance = _roleAssignmentInstance;
    this.chain_id = chain_id;
    this.permission = permission;
  }

  public toJSON(): RoleAssignmentAttributes & {
    chain_id: string;
    permission: Permission;
  } {
    return {
      ...this._roleAssignmentInstance.toJSON(),
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
    },
    { transaction }
  );
  if (!roleAssignment) {
    throw new Error('Failed to create new role');
  }
  return new RoleInstanceWithPermission(roleAssignment, chain_id, role_name);
}

// const roleAssignmentFindOptions: any = {
//   include: [
//     {
//       model: models.ChainEvent,
//       order: [
//         [ models.ChainEvent, 'id', 'asc' ]
//       ],
//       include: [ models.ChainEventType ],
//     },
//   ],
//   order: [['created_at', 'DESC']],
//   where: {
//     chain: req.query.chain,
//   }
// };

// export async function findAllRoles( models: DB, chain_id: string, permissions?: Permission[]): Promise<RoleInstanceWithPermission[]> {
//   const roleAssignmentModel : RoleAssignmentModelStatic = models.RoleAssignment
//   const roleAssignments = await roleAssignmentModel.findAll({});
//   const roles = [];
//   for (const roleAssignment of roleAssignments) {
//     const community_role = await roleAssignment.CommunityRole();
//   return;
// }

// export async function findOneRole(): Promise<RoleInstanceWithPerission> {
//   return;
// }
