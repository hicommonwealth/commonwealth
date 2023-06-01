import type * as Sequelize from 'sequelize';
import type { AddressAttributes, AddressInstance } from './address';
import type {
  CommunityRoleAttributes,
  CommunityRoleInstance,
} from './community_role';
import type { ModelInstance, ModelStatic } from './types';

export type RoleAssignmentAttributes = {
  id?: number;
  community_role_id: number;
  address_id: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
  is_user_default?: boolean;

  // associations
  CommunityRole?: CommunityRoleAttributes;
  Address?: AddressAttributes;
};

export type RoleAssignmentInstance = ModelInstance<RoleAssignmentAttributes> & {
  getCommunityRole: Sequelize.BelongsToGetAssociationMixin<CommunityRoleInstance>;
  getAddress: Sequelize.BelongsToGetAssociationMixin<AddressInstance>;
};
