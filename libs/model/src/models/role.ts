import type { AddressAttributes } from './address';
import type { CommunityAttributes } from './community';

export type Role = 'admin' | 'moderator' | 'member';

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
  Chain?: CommunityAttributes;
};
