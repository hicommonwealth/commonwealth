import type { AddressAttributes } from './address';
import type { CommunityRoleAttributes } from './community_role';

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
