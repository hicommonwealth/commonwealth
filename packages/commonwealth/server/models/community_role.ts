import type * as Sequelize from 'sequelize';
import type { ChainAttributes } from './chain';
import type { Role } from './role';
import type {
  RoleAssignmentAttributes,
  RoleAssignmentInstance,
} from './role_assignment';
import type { ModelInstance } from './types';

export type CommunityRoleAttributes = {
  name: Role;
  id?: number;
  chain_id: string;
  allow: number;
  deny: number;
  created_at?: Date;
  updated_at?: Date;

  // associations
  RoleAssignments?: RoleAssignmentAttributes[];
  Chain?: ChainAttributes;
};

export type CommunityRoleInstance = ModelInstance<CommunityRoleAttributes> & {
  getRoleAssignments: Sequelize.HasManyGetAssociationsMixin<RoleAssignmentInstance>;
};
