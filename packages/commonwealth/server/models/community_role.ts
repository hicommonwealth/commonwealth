import type { ChainAttributes } from './chain';
import type { Role } from './role';
import type { RoleAssignmentAttributes } from './role_assignment';

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
