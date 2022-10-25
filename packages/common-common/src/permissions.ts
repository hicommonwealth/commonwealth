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

export function isPermitted(permission: Permissions, action: Action): boolean {
  const actionAsBigInt: bigint = BigInt(1 << action);
  const hasAction: boolean = (permission & actionAsBigInt) == actionAsBigInt;
  return hasAction;
}

export function computePermissions(
  base: Permissions,
  assignments: Array<{ allow: Permissions; deny: Permissions }>
): Permissions {
  let permission: Permissions = base;
  let allow: Permissions = BigInt(0);
  let deny: Permissions = BigInt(0);
  for (const assignment of assignments) {
    if (assignment.allow === assignment.deny) {
      continue;
    }
    if (assignment.allow > 0) allow |= assignment.allow;
    if (assignment.deny > 0) deny |= assignment.deny;
  }
  permission &= ~deny;
  permission |= allow;

  return permission;
}
