// Permissioning Library for Common
// Modeled after the Discord Permissions Implementation

export type Permissions = bigint;

export enum PermissionError {
  NOT_PERMITTED = 'Action not permitted',
}

export enum Action {
  CREATE_CHAT = 0,
  VIEW_CHAT_CHANNELS = 1,
  CREATE_REACTION = 2,
  VIEW_REACTIONS = 3,
  DELETE_REACTION = 4,
  CREATE_COMMENT = 5,
  VIEW_COMMENTS = 6,
  EDIT_COMMENT = 7,
  DELETE_COMMENT = 8,
  CREATE_POLL = 9,
  VIEW_POLLS = 10,
  VOTE_ON_POLLS = 11,
  CREATE_THREAD = 12,
  VIEW_THREADS = 13,
  EDIT_THREAD = 14,
  DELETE_THREAD = 15,
  LINK_THREAD_TO_THREAD = 16,
  LINK_PROPOSAL_TO_THREAD = 17,
  CREATE_TOPIC = 18,
  VIEW_TOPICS = 19,
  EDIT_TOPIC = 20,
  DELETE_TOPIC = 21,
}

const IMPLICIT_PERMISSIONS_BY_ACTION = new Map<number, Action[]>([
  [Action.CREATE_CHAT, [Action.VIEW_CHAT_CHANNELS]],
  [Action.VIEW_CHAT_CHANNELS, [Action.CREATE_CHAT]],
  [
    Action.VIEW_REACTIONS,
    [
      Action.VIEW_COMMENTS,
      Action.VIEW_POLLS,
      Action.VIEW_THREADS,
      Action.VIEW_TOPICS,
    ],
  ],
  [
    Action.CREATE_REACTION,
    [
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.VIEW_COMMENTS,
      Action.VIEW_POLLS,
      Action.VIEW_THREADS,
    ],
  ],
  [
    Action.VIEW_COMMENTS,
    [
      Action.VIEW_REACTIONS,
      Action.VIEW_POLLS,
      Action.VIEW_THREADS,
      Action.VIEW_TOPICS,
    ],
  ],
  [
    Action.CREATE_COMMENT,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.VIEW_COMMENTS,
      Action.EDIT_COMMENT,
      Action.DELETE_COMMENT,
      Action.VIEW_POLLS,
      Action.VIEW_THREADS,
    ],
  ],
  [
    Action.EDIT_COMMENT,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.VIEW_COMMENTS,
      Action.CREATE_COMMENT,
      Action.DELETE_COMMENT,
      Action.VIEW_POLLS,
      Action.VIEW_THREADS,
    ],
  ],
  [
    Action.DELETE_COMMENT,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.CREATE_COMMENT,
      Action.VIEW_COMMENTS,
      Action.EDIT_COMMENT,
      Action.VIEW_POLLS,
      Action.VIEW_THREADS,
    ],
  ],
  [
    Action.VIEW_POLLS,
    [
      Action.VIEW_REACTIONS,
      Action.VIEW_COMMENTS,
      Action.VIEW_THREADS,
      Action.VIEW_TOPICS,
    ],
  ],
  [
    Action.CREATE_POLL,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.CREATE_COMMENT,
      Action.VIEW_COMMENTS,
      Action.EDIT_COMMENT,
      Action.DELETE_COMMENT,
      Action.VIEW_POLLS,
      Action.VIEW_THREADS,
    ],
  ],
  [
    Action.VOTE_ON_POLLS,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.CREATE_COMMENT,
      Action.VIEW_COMMENTS,
      Action.EDIT_COMMENT,
      Action.DELETE_COMMENT,
      Action.CREATE_POLL,
      Action.VIEW_POLLS,
    ],
  ],
  [
    Action.VIEW_THREADS,
    [
      Action.VIEW_REACTIONS,
      Action.VIEW_COMMENTS,
      Action.VIEW_POLLS,
      Action.VIEW_TOPICS,
    ],
  ],
  [
    Action.CREATE_THREAD,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.CREATE_COMMENT,
      Action.VIEW_COMMENTS,
      Action.EDIT_COMMENT,
      Action.DELETE_COMMENT,
      Action.CREATE_POLL,
      Action.VIEW_POLLS,
      Action.VOTE_ON_POLLS,
      Action.VIEW_THREADS,
      Action.EDIT_THREAD,
      Action.DELETE_THREAD,
      Action.LINK_THREAD_TO_THREAD,
      Action.LINK_PROPOSAL_TO_THREAD,
    ],
  ],
  [
    Action.EDIT_THREAD,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.CREATE_COMMENT,
      Action.VIEW_COMMENTS,
      Action.EDIT_COMMENT,
      Action.DELETE_COMMENT,
      Action.CREATE_POLL,
      Action.VIEW_POLLS,
      Action.VOTE_ON_POLLS,
      Action.VIEW_THREADS,
      Action.CREATE_THREAD,
      Action.DELETE_THREAD,
      Action.LINK_THREAD_TO_THREAD,
      Action.LINK_PROPOSAL_TO_THREAD,
    ],
  ],
  [
    Action.DELETE_THREAD,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.CREATE_COMMENT,
      Action.VIEW_COMMENTS,
      Action.EDIT_COMMENT,
      Action.DELETE_COMMENT,
      Action.CREATE_POLL,
      Action.VIEW_POLLS,
      Action.VOTE_ON_POLLS,
      Action.VIEW_THREADS,
      Action.CREATE_THREAD,
      Action.EDIT_THREAD,
      Action.LINK_THREAD_TO_THREAD,
      Action.LINK_PROPOSAL_TO_THREAD,
    ],
  ],
  [
    Action.LINK_THREAD_TO_THREAD,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.CREATE_COMMENT,
      Action.VIEW_COMMENTS,
      Action.EDIT_COMMENT,
      Action.DELETE_COMMENT,
      Action.CREATE_POLL,
      Action.VIEW_POLLS,
      Action.VOTE_ON_POLLS,
      Action.VIEW_THREADS,
      Action.CREATE_THREAD,
      Action.EDIT_THREAD,
      Action.DELETE_THREAD,
      Action.LINK_PROPOSAL_TO_THREAD,
    ],
  ],
  [
    Action.LINK_PROPOSAL_TO_THREAD,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.CREATE_COMMENT,
      Action.VIEW_COMMENTS,
      Action.EDIT_COMMENT,
      Action.DELETE_COMMENT,
      Action.CREATE_POLL,
      Action.VIEW_POLLS,
      Action.VOTE_ON_POLLS,
      Action.VIEW_THREADS,
      Action.CREATE_THREAD,
      Action.EDIT_THREAD,
      Action.DELETE_THREAD,
      Action.LINK_THREAD_TO_THREAD,
    ],
  ],
  [
    Action.VIEW_TOPICS,
    [
      Action.VIEW_REACTIONS,
      Action.VIEW_COMMENTS,
      Action.VIEW_POLLS,
      Action.VIEW_THREADS,
    ],
  ],
  [
    Action.CREATE_TOPIC,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.CREATE_COMMENT,
      Action.VIEW_COMMENTS,
      Action.EDIT_COMMENT,
      Action.DELETE_COMMENT,
      Action.CREATE_POLL,
      Action.VIEW_POLLS,
      Action.VOTE_ON_POLLS,
      Action.VIEW_THREADS,
      Action.CREATE_THREAD,
      Action.EDIT_THREAD,
      Action.DELETE_THREAD,
      Action.LINK_THREAD_TO_THREAD,
      Action.LINK_PROPOSAL_TO_THREAD,
      Action.VIEW_TOPICS,
      Action.EDIT_TOPIC,
      Action.DELETE_TOPIC,
    ],
  ],
  [
    Action.EDIT_TOPIC,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.CREATE_COMMENT,
      Action.VIEW_COMMENTS,
      Action.EDIT_COMMENT,
      Action.DELETE_COMMENT,
      Action.CREATE_POLL,
      Action.VIEW_POLLS,
      Action.VOTE_ON_POLLS,
      Action.VIEW_THREADS,
      Action.CREATE_THREAD,
      Action.EDIT_THREAD,
      Action.DELETE_THREAD,
      Action.LINK_THREAD_TO_THREAD,
      Action.LINK_PROPOSAL_TO_THREAD,
      Action.VIEW_TOPICS,
      Action.CREATE_TOPIC,
      Action.DELETE_TOPIC,
    ],
  ],
  [
    Action.DELETE_TOPIC,
    [
      Action.CREATE_REACTION,
      Action.VIEW_REACTIONS,
      Action.DELETE_REACTION,
      Action.CREATE_COMMENT,
      Action.VIEW_COMMENTS,
      Action.EDIT_COMMENT,
      Action.DELETE_COMMENT,
      Action.CREATE_POLL,
      Action.VIEW_POLLS,
      Action.VOTE_ON_POLLS,
      Action.VIEW_THREADS,
      Action.CREATE_THREAD,
      Action.EDIT_THREAD,
      Action.DELETE_THREAD,
      Action.LINK_THREAD_TO_THREAD,
      Action.LINK_PROPOSAL_TO_THREAD,
      Action.VIEW_TOPICS,
      Action.CREATE_TOPIC,
      Action.EDIT_TOPIC,
    ],
  ],
]);

// Adds the implicit permissions to a permission
export function computeImplicitPermissions(
  permission: Permissions,
  actionNumber: number,
  isAdd: boolean
): Permissions {
  let result = BigInt(permission);
  const implicitActions = IMPLICIT_PERMISSIONS_BY_ACTION.get(actionNumber);
  if (implicitActions && isAdd) {
    for (let i = 0; i < implicitActions.length; i++) {
      result |= BigInt(1) << BigInt(implicitActions[i]);
    }
  } else if (implicitActions && !isAdd) {
    for (let i = 0; i < implicitActions.length; i++) {
      result &= ~(BigInt(1) << BigInt(implicitActions[i]));
    }
  }
  return result;
}

// Must be Used to Add Permissions
export function addPermission(
  permission: Permissions,
  actionNumber: number
): Permissions {
  let result = BigInt(permission);
  // eslint-disable-next-line no-bitwise
  result |= BigInt(1) << BigInt(actionNumber);
  result = computeImplicitPermissions(result, actionNumber, true);
  return result;
}

// Must be Used to Remove Permissions
export function removePermission(
  permission: Permissions,
  actionNumber: number
): Permissions {
  let result = BigInt(permission);
  // eslint-disable-next-line no-bitwise
  result &= ~(BigInt(1) << BigInt(actionNumber));
  result = computeImplicitPermissions(result, actionNumber, false);
  return result;
}

// Default Permissions
export const BASE_PERMISSIONS: Permissions =
  addPermission(BigInt(0), Action.VIEW_REACTIONS) |
  addPermission(BigInt(0), Action.CREATE_REACTION) |
  addPermission(BigInt(0), Action.DELETE_REACTION) |
  addPermission(BigInt(0), Action.VIEW_COMMENTS) |
  addPermission(BigInt(0), Action.CREATE_COMMENT) |
  addPermission(BigInt(0), Action.EDIT_COMMENT) |
  addPermission(BigInt(0), Action.DELETE_COMMENT) |
  addPermission(BigInt(0), Action.VIEW_POLLS) |
  addPermission(BigInt(0), Action.CREATE_POLL) |
  addPermission(BigInt(0), Action.VOTE_ON_POLLS) |
  addPermission(BigInt(0), Action.VIEW_TOPICS) |
  addPermission(BigInt(0), Action.CREATE_THREAD) |
  addPermission(BigInt(0), Action.EDIT_THREAD) |
  addPermission(BigInt(0), Action.DELETE_THREAD) |
  addPermission(BigInt(0), Action.LINK_THREAD_TO_THREAD) |
  addPermission(BigInt(0), Action.LINK_PROPOSAL_TO_THREAD) |
  addPermission(BigInt(0), Action.VIEW_CHAT_CHANNELS) |
  addPermission(BigInt(0), Action.VIEW_THREADS);

// Checks implicitly if a permission has a specific action
export function isImplicitlyPermitted(
  permission: Permissions,
  actionNumber: number
): boolean {
  // Check implicit permissions map by while looping through the map and checking each entry whose values include the action number
  // Check whether the key (which is an action) is permitted
  for (let [key, value] of IMPLICIT_PERMISSIONS_BY_ACTION) {
    if (value.includes(actionNumber)) {
      console.log("key", key);
      if (isPermitted(permission, key)) {
        return true;
      }
      return false;
    }
  };
  return false;
}

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
