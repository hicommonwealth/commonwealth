export type Role = 'member' | 'moderator' | 'admin';

export function isRole(role: string): role is Role {
  return ['member', 'moderator', 'admin'].includes(role);
}
