export enum Action {
  INVITE_MEMBERS = 1 << 0,
  BAN_MEMBERS = 1 << 1,
  MANAGE_COMMUNITY = 1 << 2,
  ADMINISTRATOR = 1 << 3,
  MANAGE_ROLES = 1 << 4,
  MANAGE_WEBHOOKS = 1 << 5,
  MANAGE_TOPICS = 1 << 6,
  MANAGE_CHAT_CHANNELS = 1 << 7,
  VIEW_COMMUNITY_INSIGHTS = 1 << 8,
  MANAGE_INVITES = 1 << 9,
  VIEW_TOPIC = 1 << 10,
  VIEW_CHAT_CHANNELS = 1 << 11,
  CREATE_THREAD = 1 << 12,
  MANAGE_THREADS = 1 << 13,
  CREATE_CHAT = 1 << 14,
  CREATE_REACTION = 1 << 15,
  CREATE_COMMENT = 1 << 16,
  CREATE_POLL = 1 << 17,
  VOTE_ON_POLLS = 1 << 18,
  MANAGE_POLLS = 1 << 19,
}

type Permission = bigint;

export function isPermitted(permission: Permission, action: Action): boolean {
  const actionAsBigInt: bigint = BigInt(action);
  const hasAction: boolean = (permission & actionAsBigInt) == actionAsBigInt
  return hasAction;
}

export function computePermissions(
  base: Permission,
  assignments: Array<{ allow: Permission; deny: Permission }>
): Permission {

    return BigInt(0);
}
