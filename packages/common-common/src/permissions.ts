// Permissioning Library for Common
// Modeled after the Discord Permissions Implementation

export type Permissions = bigint;

export type Permission = 'admin' | 'moderator' | 'member';

export enum PermissionError {
  NOT_PERMITTED = 'Action not permitted',
}

// Note all new actions MUST be added to the end of this list (some migrations are tied to this ordering)
export enum Action {
  CREATE_CHAT = 0,
  CREATE_REACTION = 1,
  VIEW_REACTIONS = 2,
  CREATE_COMMENT = 3,
  VIEW_COMMENTS = 4,
  EDIT_COMMENT = 5,
  DELETE_COMMENT = 6,
  CREATE_POLL = 7,
  VIEW_POLLS = 8,
  VOTE_ON_POLLS = 9,
  CREATE_THREAD = 10,
  VIEW_CHAT_CHANNELS = 11,
  VIEW_THREADS = 12,
  EDIT_THREAD = 13,
  DELETE_THREAD = 14,
  LINK_THREAD_TO_THREAD = 15,
  LINK_PROPOSAL_TO_THREAD = 16,
  MANAGE_TOPICS = 17,
  DELETE_TOPIC = 18,
}

// Implicit Permissions are a tree hierarchy of permissions that are implied by other permissions
const ALLOW_IMPLICIT_PERMISSIONS_BY_ACTION = new Map<number, Action[]>([
  // Chat Subtree
  [Action.CREATE_CHAT, [Action.VIEW_CHAT_CHANNELS]],
  // View Subtree
  [Action.VIEW_THREADS, [Action.VIEW_COMMENTS]],
  [Action.VIEW_COMMENTS, [Action.VIEW_REACTIONS]],
  // Create Subtree
  [Action.CREATE_THREAD, [Action.VIEW_THREADS, Action.CREATE_COMMENT]],
  [Action.CREATE_POLL, [Action.VOTE_ON_POLLS]],
  [Action.CREATE_COMMENT, [Action.CREATE_REACTION, Action.VIEW_COMMENTS]],
  [Action.CREATE_REACTION, [Action.VIEW_REACTIONS]],
  // Voting Subtree
  [Action.VOTE_ON_POLLS, [Action.VIEW_POLLS]],
  // Delete Subtree
  [Action.DELETE_THREAD, [Action.EDIT_THREAD]],
  [Action.DELETE_COMMENT, [Action.EDIT_COMMENT]],
  [Action.DELETE_TOPIC, [Action.MANAGE_TOPICS]],
  // Edit Subtree
  [Action.EDIT_THREAD, [Action.CREATE_THREAD]],
  [Action.EDIT_COMMENT, [Action.CREATE_COMMENT]],
]);

const DENY_IMPLICIT_PERMISSIONS_BY_ACTION = new Map<number, Action[]>([
  // Chat Subtree
  [Action.VIEW_CHAT_CHANNELS, [Action.CREATE_CHAT]],
  // View Subtree
  [Action.VIEW_REACTIONS, [Action.VIEW_COMMENTS, Action.CREATE_REACTION]],
  [Action.VIEW_COMMENTS, [Action.VIEW_THREADS, Action.CREATE_COMMENT]],
  [Action.VIEW_POLLS, [Action.VOTE_ON_POLLS]],
  [Action.VIEW_THREADS, [Action.CREATE_THREAD]],
  // Create Subtree
  [Action.CREATE_REACTION, [Action.CREATE_COMMENT]],
  [Action.CREATE_COMMENT, [Action.EDIT_COMMENT, Action.CREATE_THREAD]],
  [Action.CREATE_THREAD, [Action.EDIT_THREAD]],
  [Action.MANAGE_TOPICS, [Action.DELETE_TOPIC]],
  // Voting Subtree
  [Action.VOTE_ON_POLLS, [Action.CREATE_POLL]],
  // Edit Subtree
  [Action.EDIT_COMMENT, [Action.DELETE_COMMENT]],
  [Action.EDIT_THREAD, [Action.DELETE_THREAD]]
]);

// Recursive function to get all implicit permissions of an action
const recurseImplicitActions = (action: Action, result_actions: Action[], allowDeny: boolean): Action[] => {
  let implicitActions;
  if (allowDeny) {
    implicitActions = ALLOW_IMPLICIT_PERMISSIONS_BY_ACTION.get(action);
  } else {
    implicitActions = DENY_IMPLICIT_PERMISSIONS_BY_ACTION.get(action);
  }
  // Base Case, if there are no implicit permission leaves, return the action
  if (!implicitActions) {
    return [ action ];
  }
  // Recursive Case, if there are implicit permission leaves, return the action and the leaves
  for (let i = 0; i < implicitActions.length; i++) {
    if (allowDeny) {
      result_actions = result_actions.concat(recurseImplicitActions(implicitActions[i], ALLOW_IMPLICIT_PERMISSIONS_BY_ACTION.get(implicitActions[i]), allowDeny));
    } else {
      result_actions = result_actions.concat(recurseImplicitActions(implicitActions[i], DENY_IMPLICIT_PERMISSIONS_BY_ACTION.get(implicitActions[i]), allowDeny));
    }
  };

  let uniqueActions = [...new Set(result_actions.concat([action]))];
  return uniqueActions;
}

export const getImplicitActionsSet = (action: Action, allowDeny: boolean): Action[] => {
  if (allowDeny) {
    return recurseImplicitActions(action, ALLOW_IMPLICIT_PERMISSIONS_BY_ACTION.get(action), allowDeny);
  } else {
    return recurseImplicitActions(action, DENY_IMPLICIT_PERMISSIONS_BY_ACTION.get(action), allowDeny);
  }
}

// Allows or Denies the implicit permissions of a permission
export function addAllowImplicitPermissions(
  allow_permission: Permissions,
  actionNumber: number,
): Permissions {
  let result = BigInt(allow_permission);
  const implicitActions = getImplicitActionsSet(actionNumber, true);
  if (implicitActions) {
    for (let i = 0; i < implicitActions.length; i++) {
      result |= BigInt(1) << BigInt(implicitActions[i]);
    }
  }
  return result;
}

export function removeAllowImplicitPermissions(
  allow_permission: Permissions,
  actionNumber: number,
): Permissions {
  let result = BigInt(allow_permission);
  const implicitActions = getImplicitActionsSet(actionNumber, true);
  for (let i = 0; i < implicitActions.length; i++) {
      result &= ~(BigInt(1) << BigInt(implicitActions[i]));
    }
  
  return result;
};

export function addDenyImplicitPermissions(
  deny_permission: Permissions,
  actionNumber: number
): Permissions {
  let result = BigInt(deny_permission);
  const implicitActions = getImplicitActionsSet(actionNumber, false);
  if (implicitActions) {
    for (let i = 0; i < implicitActions.length; i++) {
      result |= BigInt(1) << BigInt(implicitActions[i]);
    }
  }
  return result;
}

export function removeDenyImplicitPermissions(
  deny_permission: Permissions,
  actionNumber: number
): Permissions {
  let result = BigInt(deny_permission);
  const implicitActions = getImplicitActionsSet(actionNumber, false);
  for (let i = 0; i < implicitActions.length; i++) {
    result &= ~(BigInt(1) << BigInt(implicitActions[i]));
  }
  return result;
}

// Must be Used to Add Permissions to allow permission set
export function addAllowPermission(
  allow_permission: Permissions,
  actionNumber: number
): Permissions {
  let result = BigInt(allow_permission);
  // eslint-disable-next-line no-bitwise
  result |= BigInt(1) << BigInt(actionNumber);
  result = addAllowImplicitPermissions(result, actionNumber);
  return result;
}

// Must be Used to Remove Permissions from allow permission set
export function removeAllowPermission(
  allow_permission: Permissions,
  actionNumber: number
): Permissions {
  let result = BigInt(allow_permission);
  // eslint-disable-next-line no-bitwise
  result &= ~(BigInt(1) << BigInt(actionNumber));
  result = removeAllowImplicitPermissions(result, actionNumber);
  return result;
}

// Must be Used to Add Permissions to deny permission set
export function addDenyPermission(
  deny_permission: Permissions,
  actionNumber: number
): Permissions {
  let result = BigInt(deny_permission);
  // eslint-disable-next-line no-bitwise
  result |= BigInt(1) << BigInt(actionNumber);
  result = addDenyImplicitPermissions(result, actionNumber);
  return result;
}

// Must be Used to Remove Permissions from deny permission set
export function removeDenyPermission(
  deny_permission: Permissions,
  actionNumber: number
): Permissions {
  let result = BigInt(deny_permission);
  // eslint-disable-next-line no-bitwise
  result &= ~(BigInt(1) << BigInt(actionNumber));
  result = removeDenyImplicitPermissions(result, actionNumber);
  return result;
}

// Default Permissions
export const BASE_PERMISSIONS: Permissions =
  // addPermission(BigInt(0), Action.VIEW_REACTIONS) |
  // addPermission(BigInt(0), Action.CREATE_REACTION) |
  // addPermission(BigInt(0), Action.DELETE_REACTION) |
  // addPermission(BigInt(0), Action.VIEW_COMMENTS) |
  // addPermission(BigInt(0), Action.CREATE_COMMENT) |
  // addPermission(BigInt(0), Action.EDIT_COMMENT) |
  // addPermission(BigInt(0), Action.DELETE_COMMENT) |
  // addPermission(BigInt(0), Action.VIEW_POLLS) |
  // addPermission(BigInt(0), Action.CREATE_POLL) |
  // addPermission(BigInt(0), Action.VOTE_ON_POLLS) |
  // addPermission(BigInt(0), Action.VIEW_TOPICS) |
  BigInt(1) << BigInt(Action.CREATE_THREAD) |
  // addPermission(BigInt(0), Action.EDIT_THREAD) |
  // addPermission(BigInt(0), Action.DELETE_THREAD) |
  // addPermission(BigInt(0), Action.LINK_THREAD_TO_THREAD) |
  // addPermission(BigInt(0), Action.LINK_PROPOSAL_TO_THREAD) |
  BigInt(1) << BigInt(Action.VIEW_CHAT_CHANNELS) |
  BigInt(1) << BigInt(Action.VIEW_THREADS);

// Checks if a permission explicitly has a specific action
export function isPermitted(permission: Permissions, action: number): boolean {
  const actionAsBigInt: bigint = BigInt(1) << BigInt(action);
  const hasAction: boolean =
    (BigInt(permission) & actionAsBigInt) == actionAsBigInt;
  return hasAction;
}

// Computes the permissions for a user
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

type RoleObject = {
  permission: Permission;
  allow: Permissions;
  deny: Permissions;
};

// Aggregates role permissions with chain permissions for a user by ordering the roles by lowest to highest permission levels and then computing the permissions
export function aggregatePermissions(
  roles: RoleObject[],
  chain_permissions: { allow: Permissions; deny: Permissions }
) {
  // sort roles by roles with highest permissions last
  const ORDER: Permission[] = ['member', 'moderator', 'admin'];

  function compare(o1: RoleObject, o2: RoleObject) {
    return ORDER.indexOf(o1.permission) - ORDER.indexOf(o2.permission);
  }
  roles = roles.sort(compare);

  const permissionsAllowDeny: Array<{
    allow: Permissions;
    deny: Permissions;
  }> = roles;

  // add chain default permissions to beginning of permissions array
  permissionsAllowDeny.unshift(chain_permissions);

  // compute permissions
  const permission: bigint = computePermissions(
    BASE_PERMISSIONS,
    permissionsAllowDeny
  );
  return permission;
}
