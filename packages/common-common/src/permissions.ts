export enum Action {
  CREATE_CHAT = 0,
  VIEW_CHAT_CHANNELS = 1,
  CREATE_REACTION = 2,
  VIEW_REACTIONS = 3,
  CREATE_COMMENT = 4,
  VIEW_COMMENTS = 5,
  EDIT_COMMENT = 6,
  DELETE_COMMENT = 7,
  CREATE_POLL = 8,
  VIEW_POLLS = 9,
  VOTE_ON_POLLS = 10,
  CREATE_THREAD = 11,
  VIEW_THREADS = 12,
  EDIT_THREAD = 13,
  DELETE_THREAD = 14,
}

export type Permissions = bigint;

export enum PermissionError {
  NOT_PERMITTED = 'Action not permitted',
}

export function addPermission(
  permission: Permissions,
  actionNumber: number
): Permissions {
  let result = BigInt(permission);
  // eslint-disable-next-line no-bitwise
  result |= BigInt(1) << BigInt(actionNumber);
  return result;
}

export function removePermission(
  permission: Permissions,
  actionNumber: number
): Permissions {
  let result = BigInt(permission);
  // eslint-disable-next-line no-bitwise
  result &= ~(BigInt(1) << BigInt(actionNumber));
  return result;
}

export const BASE_PERMISSIONS: Permissions =
  addPermission(BigInt(0), Action.CREATE_THREAD) |
  addPermission(BigInt(0), Action.VIEW_CHAT_CHANNELS) |
  addPermission(BigInt(0), Action.VIEW_THREADS);

const IMPLICIT_PERMISSIONS_BY_ACTION = new Map<Action, Action[]>([
  [Action.CREATE_CHAT, [Action.VIEW_CHAT_CHANNELS]],
  [Action.VIEW_REACTIONS, [Action.VIEW_COMMENTS, Action.VIEW_POLLS, Action.VIEW_THREADS]],
  [Action.CREATE_REACTION, [Action.VIEW_REACTIONS, Action.VIEW_COMMENTS, Action.VIEW_POLLS, Action.VIEW_THREADS]],
  [Action.VIEW_COMMENTS, [Action.VIEW_REACTIONS, Action.VIEW_POLLS, Action.VIEW_THREADS]],
  [Action.CREATE_COMMENT, [Action.CREATE_REACTION, Action.VIEW_REACTIONS, Action.VIEW_COMMENTS, Action.EDIT_COMMENT, Action.DELETE_COMMENT, Action.VIEW_POLLS, Action.VIEW_THREADS]],
  [Action.EDIT_COMMENT, [Action.CREATE_REACTION, Action.VIEW_REACTIONS, Action.VIEW_COMMENTS, Action.CREATE_COMMENT, Action.DELETE_COMMENT, Action.VIEW_POLLS, Action.VIEW_THREADS]],
  [Action.DELETE_COMMENT, [Action.CREATE_REACTION, Action.VIEW_REACTIONS, Action.CREATE_COMMENT, Action.VIEW_COMMENTS, Action.EDIT_COMMENT, Action.VIEW_POLLS, Action.VIEW_THREADS]],
  [Action.VIEW_POLLS, [Action.VIEW_REACTIONS, Action.VIEW_COMMENTS, Action.VIEW_THREADS]],
  [Action.CREATE_POLL, [Action.CREATE_REACTION, Action.VIEW_REACTIONS, Action.CREATE_COMMENT, Action.VIEW_COMMENTS, Action.EDIT_COMMENT, Action.DELETE_COMMENT, Action.VIEW_POLLS, Action.VIEW_THREADS]],
  [Action.VOTE_ON_POLLS, [Action.CREATE_REACTION, Action.VIEW_REACTIONS, Action.CREATE_COMMENT, Action.VIEW_COMMENTS, Action.EDIT_COMMENT, Action.DELETE_COMMENT, Action.CREATE_POLL, Action.VIEW_POLLS]],
  [Action.VIEW_THREADS, [Action.VIEW_REACTIONS, Action.VIEW_COMMENTS, Action.VIEW_POLLS]],
  [Action.CREATE_THREAD, [Action.CREATE_REACTION, Action.VIEW_REACTIONS, Action.CREATE_COMMENT, Action.VIEW_COMMENTS, Action.EDIT_COMMENT, Action.DELETE_COMMENT, Action.CREATE_POLL, Action.VIEW_POLLS, Action.VOTE_ON_POLLS, Action.VIEW_THREADS, Action.EDIT_THREAD, Action.DELETE_THREAD]],
  [Action.EDIT_THREAD, [Action.CREATE_REACTION, Action.VIEW_REACTIONS, Action.CREATE_COMMENT, Action.VIEW_COMMENTS, Action.EDIT_COMMENT, Action.DELETE_COMMENT, Action.CREATE_POLL, Action.VIEW_POLLS, Action.VOTE_ON_POLLS, Action.VIEW_THREADS, Action.CREATE_THREAD, Action.DELETE_THREAD]],
  [Action.DELETE_THREAD, [Action.CREATE_REACTION, Action.VIEW_REACTIONS, Action.CREATE_COMMENT, Action.VIEW_COMMENTS, Action.EDIT_COMMENT, Action.DELETE_COMMENT, Action.CREATE_POLL, Action.VIEW_POLLS, Action.VOTE_ON_POLLS, Action.VIEW_THREADS, Action.CREATE_THREAD, Action.EDIT_THREAD]],
]);

export function isPermitted(permission: Permissions, action: number): boolean {
  const actionAsBigInt: bigint = BigInt(1) << BigInt(action);
  const hasAction: boolean =
    (BigInt(permission) & actionAsBigInt) == actionAsBigInt;
  return hasAction;
}

export function computeImplicitPermissions(
  permission: Permissions
): Permissions {
  let result = BigInt(permission);
  // Find the highest hierachy action that is permitted
  for (const [action, implicitActions] of IMPLICIT_PERMISSIONS_BY_ACTION) {
    if (isPermitted(permission, Number(action))) {
      // add all the implicit actions and then return the result
      for (const implicitAction of implicitActions) {
        result = addPermission(result, implicitAction);
      }
    }
  }
  return result;
}

export function computePermissions(
  base: Permissions,
  assignments: Array<{ allow: Permissions; deny: Permissions }>
): Permissions {
  let permission: Permissions = base;
  for (const assignment of assignments) {
    permission &= ~BigInt(assignment.deny);
    permission |= BigInt(assignment.allow);
  }
  // Finally, compute implicit permissions which will overwrite denials that overlap with implicit permissions
  permission = computeImplicitPermissions(permission);
  return permission;
}
