export enum Action {
  CREATE_CHAT = 0,
  VIEW_CHAT_CHANNELS = 1,
  CREATE_THREAD = 3,
  VIEW_THREADS = 4,
  MANAGE_THREAD = 5,
  CREATE_COMMENT = 6,
  VIEW_COMMENTS = 7,
  MANAGE_COMMENT = 8,
  CREATE_REACTION = 9,
  VIEW_REACTIONS = 10,
  CREATE_POLL = 11,
  VIEW_POLLS = 12,
  VOTE_ON_POLLS = 13,
  MANAGE_POLLS = 14,
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


const IMPLICIT_PERMISSIONS_BY_ACTION: Record<number, Action[]> = {
  [Action.MANAGE_THREAD]: [Action.CREATE_THREAD],
  [Action.CREATE_THREAD]: [Action.VIEW_THREADS],
  [Action.VIEW_THREADS]: [Action.MANAGE_POLLS],
  [Action.MANAGE_POLLS]: [Action.VOTE_ON_POLLS],
  [Action.VOTE_ON_POLLS]: [Action.CREATE_POLL],
  [Action.CREATE_POLL]: [Action.VIEW_POLLS],
  [Action.VIEW_POLLS]: [Action.MANAGE_COMMENT],
  [Action.MANAGE_COMMENT]: [Action.CREATE_COMMENT],
  [Action.CREATE_COMMENT]: [Action.VIEW_COMMENTS],
  [Action.VIEW_COMMENTS]: [Action.CREATE_REACTION],
  [Action.CREATE_REACTION]: [Action.VIEW_REACTIONS],
};

export function isPermitted(permission: Permissions, action: number): boolean {
  const actionAsBigInt: bigint = BigInt(1) << BigInt(action);
  const hasAction: boolean =
    (BigInt(permission) & actionAsBigInt) == actionAsBigInt;
  return hasAction;
}

function isThereImplicitAction(action: number): boolean {
  return IMPLICIT_PERMISSIONS_BY_ACTION[action] != undefined;
}

function computeImplicitPermissions(permission: Permissions): Permissions {
  let result = BigInt(permission);
  for (const [action, implicitActions] of IMPLICIT_PERMISSIONS_BY_ACTION.keys) {
    if (isPermitted(permission, Number(action))) {
      //if the action is permitted, add all the implicit actions recursively
      while (isThereImplicitAction(action)) {
        const implicitAction = implicitActions.pop();
        if (implicitAction) {
          result = addPermission(result, implicitAction);
        }
      }
    }
  }
  return BigInt(0);
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

  return permission;
}
