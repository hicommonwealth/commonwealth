import type { CommunityAttributes } from './community';
import type { Role } from './role';
import type { RoleAssignmentAttributes } from './role_assignment';

export type CommunityRoleAttributes = {
  name: Role;
  id?: number;
  community_id: string;
  allow: number;
  deny: number;
  created_at?: Date;
  updated_at?: Date;

  // associations
  RoleAssignments?: RoleAssignmentAttributes[];
  Community?: CommunityAttributes;
};
