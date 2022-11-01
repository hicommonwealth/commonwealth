

export enum Action {
  INVITE_MEMBERS = 0,
  BAN_MEMBERS = 1,
  MANAGE_COMMUNITY = 2,
  ADMINISTRATOR = 3,
  MANAGE_ROLES = 4,
  MANAGE_WEBHOOKS = 5,
  MANAGE_TOPICS = 6,
  MANAGE_CHAT_CHANNELS = 7,
  VIEW_COMMUNITY_INSIGHTS = 8,
  MANAGE_INVITES = 9,
  VIEW_TOPIC = 10,
  VIEW_CHAT_CHANNELS = 11,
  CREATE_THREAD = 12,
  MANAGE_THREADS = 13,
  CREATE_CHAT = 14,
  CREATE_REACTION = 15,
  CREATE_COMMENT = 16,
  CREATE_POLL = 17,
  VOTE_ON_POLLS = 18,
  MANAGE_POLLS = 19,
}

export type Permissions = bigint;

export enum PermissionError {
  NOT_PERMITTED = 'Action not permitted',
}

export function addPermission(
  permission: Permissions,
  actionNumber: number
): Permissions {
  // eslint-disable-next-line no-bitwise
  permission |= BigInt(1) << BigInt(actionNumber);
  return permission;
}

export function removePermission(
  permission: Permissions,
  actionNumber: number
): Permissions {
  // eslint-disable-next-line no-bitwise
  permission &= ~(BigInt(1) << BigInt(actionNumber));
  return permission;
}

export const BASE_PERMISSIONS: Permissions =
  addPermission(BigInt(0), Action.CREATE_THREAD) |
  addPermission(BigInt(0), Action.VIEW_CHAT_CHANNELS)

export function isPermitted(permission: Permissions, action: Action): boolean {
  const actionAsBigInt: bigint = BigInt(1) << BigInt(action);
  const hasAction: boolean = (permission & actionAsBigInt) == actionAsBigInt;
  return hasAction;
}

export function computePermissions(
  base: Permissions,
  assignments: Array<{ allow: Permissions; deny: Permissions }>
): Permissions {
  let permission: Permissions = base;
  let allow: bigint = BigInt(0);
  let deny: bigint = BigInt(0);
  for (const assignment of assignments) {
    if (assignment.allow === assignment.deny) {
      continue;
    }
    if (assignment.allow > 0) {
      const assignmentAllow: bigint = BigInt(assignment.allow);
      allow |= assignmentAllow;
    }
    if (assignment.deny > 0) {
      const assignmentDeny: bigint = BigInt(assignment.deny);
      deny |= assignmentDeny;
    }
  }
  permission &= ~deny;
  permission |= allow;

  return permission;
}
