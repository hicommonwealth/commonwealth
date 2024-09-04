import { Role } from '@hicommonwealth/shared';
import { AddressAttributes } from './AddressAttributes';
import type { CommunityAttributes } from './community';

export function isRole(role: Role): boolean {
  return role === 'admin' || role === 'moderator' || role === 'member';
}

export type RoleAttributes = {
  address_id: number;
  permission: Role;
  id?: number;
  community_id: string;
  is_user_default?: boolean;
  created_at?: Date;
  updated_at?: Date;

  // associations
  Address?: AddressAttributes;
  Community?: CommunityAttributes;
};
