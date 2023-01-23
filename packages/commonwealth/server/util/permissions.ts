/* eslint-disable */

export enum AccessLevel {
  Admin = 'admin',
  Moderator = 'moderator',
  Member = 'member',
  Everyone = 'everyone',
}

export enum PermissionError {
  NOT_PERMITTED = 'Action not permitted',
}

export enum Action {
  CREATE_CHAT = 0,
  CREATE_REACTION = 1,
  VIEW_REACTIONS = 2,
  DELETE_REACTION = 3,
  CREATE_COMMENT = 4,
  VIEW_COMMENTS = 5,
  EDIT_COMMENT = 6,
  DELETE_COMMENT = 7,
  CREATE_POLL = 8,
  VIEW_POLLS = 9,
  VOTE_ON_POLLS = 10,
  VIEW_CHAT_CHANNELS = 11,
  CREATE_THREAD = 12,
  VIEW_THREADS = 13,
  EDIT_THREAD = 14,
  DELETE_THREAD = 15,
  LINK_THREAD_TO_THREAD = 16,
  LINK_PROPOSAL_TO_THREAD = 17,
  CREATE_TOPIC = 18,
  MANAGE_TOPIC = 19,
  VIEW_TOPICS = 20,
  EDIT_TOPIC = 21,
  DELETE_TOPIC = 22,
  CREATE_ROLE = 23,
  EDIT_ROLE = 24,
  DELETE_ROLE = 25,
  VIEW_ROLES = 26,
  CREATE_PERMISSION = 27,
  EDIT_PERMISSIONS = 28,
}

export type Permissions = { [key: number]: Array<Action> | Action };

export const everyonePermissions: Permissions = {
  [Action.DELETE_REACTION]: [
    Action.DELETE_REACTION,
    Action.CREATE_REACTION,
    Action.VIEW_REACTIONS,
  ],
  [Action.CREATE_THREAD]: [Action.CREATE_THREAD, Action.VIEW_THREADS],
  [Action.VIEW_CHAT_CHANNELS]: [Action.VIEW_CHAT_CHANNELS],
};

export const impliedAllowPermissionsByAction: Permissions = {
  [Action.CREATE_CHAT]: [Action.CREATE_CHAT, Action.VIEW_CHAT_CHANNELS],
  [Action.VIEW_THREADS]: [Action.VIEW_THREADS, Action.VIEW_COMMENTS],
  [Action.VIEW_COMMENTS]: [Action.VIEW_COMMENTS, Action.VIEW_REACTIONS],
  [Action.CREATE_THREAD]: [
    Action.CREATE_THREAD,
    Action.VIEW_THREADS,
    Action.CREATE_COMMENT,
  ],
  [Action.CREATE_POLL]: [Action.CREATE_POLL, Action.VOTE_ON_POLLS],
  [Action.CREATE_COMMENT]: [
    Action.CREATE_COMMENT,
    Action.CREATE_REACTION,
    Action.VIEW_COMMENTS,
  ],
  [Action.VIEW_CHAT_CHANNELS]: [Action.VIEW_CHAT_CHANNELS],
  [Action.CREATE_REACTION]: [Action.CREATE_REACTION, Action.VIEW_REACTIONS],
  [Action.VOTE_ON_POLLS]: [Action.VOTE_ON_POLLS, Action.VIEW_POLLS],
  [Action.DELETE_THREAD]: [Action.DELETE_THREAD, Action.EDIT_THREAD],
  [Action.DELETE_COMMENT]: [Action.DELETE_COMMENT, Action.EDIT_COMMENT],
  [Action.DELETE_TOPIC]: [Action.DELETE_TOPIC, Action.MANAGE_TOPIC],
  [Action.EDIT_THREAD]: [Action.EDIT_THREAD, Action.CREATE_THREAD],
  [Action.EDIT_COMMENT]: [Action.EDIT_COMMENT, Action.CREATE_COMMENT],
};

export const impliedDenyPermissionsByAction: Permissions = {
  [Action.CREATE_CHAT]: [Action.CREATE_CHAT, Action.VIEW_CHAT_CHANNELS],
  [Action.VIEW_THREADS]: [
    Action.VIEW_THREADS,
    Action.VIEW_COMMENTS,
    Action.CREATE_THREAD,
  ],
  [Action.VIEW_COMMENTS]: [
    Action.VIEW_COMMENTS,
    Action.VIEW_REACTIONS,
    Action.CREATE_COMMENT,
  ],
  [Action.CREATE_THREAD]: [Action.CREATE_THREAD, Action.VIEW_THREADS],
  [Action.CREATE_POLL]: [
    Action.CREATE_POLL,
    Action.VOTE_ON_POLLS,
    Action.CREATE_POLL,
  ],
  [Action.CREATE_COMMENT]: [
    Action.CREATE_COMMENT,
    Action.CREATE_REACTION,
    Action.VIEW_COMMENTS,
    Action.EDIT_COMMENT,
  ],
  [Action.CREATE_REACTION]: [
    Action.CREATE_REACTION,
    Action.VIEW_REACTIONS,
    Action.CREATE_COMMENT,
  ],
  [Action.VOTE_ON_POLLS]: [
    Action.VOTE_ON_POLLS,
    Action.VIEW_POLLS,
    Action.CREATE_POLL,
  ],
  [Action.VIEW_CHAT_CHANNELS]: [Action.VIEW_CHAT_CHANNELS],
  [Action.DELETE_THREAD]: [Action.DELETE_THREAD, Action.EDIT_THREAD],
  [Action.DELETE_COMMENT]: [Action.DELETE_COMMENT, Action.EDIT_COMMENT],
  [Action.DELETE_TOPIC]: [
    Action.DELETE_TOPIC,
    Action.MANAGE_TOPIC,
    Action.DELETE_TOPIC,
  ],
  [Action.EDIT_THREAD]: [
    Action.EDIT_THREAD,
    Action.CREATE_THREAD,
    Action.EDIT_THREAD,
  ],
  [Action.EDIT_COMMENT]: [
    Action.EDIT_COMMENT,
    Action.CREATE_COMMENT,
    Action.EDIT_COMMENT,
  ],
};

type allowDenyBigInt = {
  allow: bigint;
  deny: bigint;
};

export enum ToCheck {
  Allow = 'allow',
  Deny = 'deny',
}

export class PermissionManager {
  private action: Action;

  public getAllowedPermissionsByAction(action: Action): Action[] | Action {
    const permissions = impliedAllowPermissionsByAction[action];
    if (!permissions) {
      throw new Error(`Invalid action: ${action}`);
    }
    return permissions;
  }

  public getDeniedPermissionsByAction(action: Action): Action[] | Action {
    const permissions = impliedDenyPermissionsByAction[action];
    if (!permissions) {
      throw new Error(`Invalid action: ${action}`);
    }
    return permissions;
  }

  public addAllowPermission(
    allowPermission: bigint,
    actionNumber: number
  ): bigint {
    const impliedAllowPermissions =
      this.getAllowedPermissionsByAction(actionNumber);
    if (Array.isArray(impliedAllowPermissions)) {
      impliedAllowPermissions.forEach((impliedAllowPermission) => {
        allowPermission = allowPermission | BigInt(1 << impliedAllowPermission);
      });
    } else {
      allowPermission = allowPermission | BigInt(1 << impliedAllowPermissions);
    }
    return allowPermission;
  }

  public addDenyPermission(
    denyPermission: bigint,
    actionNumber: number
  ): bigint {
    const impliedDenyPermissions =
      this.getDeniedPermissionsByAction(actionNumber);
    if (Array.isArray(impliedDenyPermissions)) {
      impliedDenyPermissions.forEach((impliedDenyPermission) => {
        denyPermission = denyPermission | BigInt(1 << impliedDenyPermission);
      });
    } else {
      denyPermission = denyPermission | BigInt(1 << impliedDenyPermissions);
    }
    return denyPermission;
  }

  public removeAllowPermission(
    allowPermission: bigint,
    actionNumber: number
  ): bigint {
    const impliedAllowPermissions =
      this.getAllowedPermissionsByAction(actionNumber);
    if (Array.isArray(impliedAllowPermissions)) {
      impliedAllowPermissions.forEach((impliedAllowPermission) => {
        allowPermission =
          allowPermission & ~BigInt(1 << impliedAllowPermission);
      });
    } else {
      allowPermission = allowPermission & ~BigInt(1 << impliedAllowPermissions);
    }
    return allowPermission;
  }

  public removeDenyPermission(
    denyPermission: bigint,
    actionNumber: number
  ): bigint {
    const impliedDenyPermissions =
      this.getDeniedPermissionsByAction(actionNumber);
    if (Array.isArray(impliedDenyPermissions)) {
      impliedDenyPermissions.forEach((impliedDenyPermission) => {
        denyPermission = denyPermission & ~BigInt(1 << impliedDenyPermission);
      });
    } else {
      denyPermission = denyPermission & ~BigInt(1 << impliedDenyPermissions);
    }
    return denyPermission;
  }

  mapPermissionsToBigint(permissions: Permissions): bigint {
    let permission = BigInt(0);
    for (const key in permissions) {
      const action = permissions[key];
      if (Array.isArray(action)) {
        for (const a of action) {
          permission |= BigInt(1) << BigInt(a);
        }
      } else {
        permission |= BigInt(1) << BigInt(action);
      }
    }
    return permission;
  }

  convertStringToBigInt(
    allowPermission: string,
    denyPermission: string
  ): allowDenyBigInt {
    const allowPermissionAsBigInt: bigint = BigInt(allowPermission);
    const denyPermissionAsBigInt: bigint = BigInt(denyPermission);
    return { allow: allowPermissionAsBigInt, deny: denyPermissionAsBigInt };
  }

  public computePermissions(
    base: Permissions,
    assignments: Array<{ allow: bigint; deny: bigint }>
  ): bigint {
    let permissionsBigInt = this.mapPermissionsToBigint(base);

    for (const assignment of assignments) {
      const { allow, deny } = assignment;
      if (allow === deny) {
        permissionsBigInt = allow;
        // eslint-disable-next-line no-continue
        continue;
      }
      if (typeof allow === 'string' && typeof deny === 'string') {
        const converted = this.convertStringToBigInt(allow, deny);
        permissionsBigInt &= ~converted.deny;
        permissionsBigInt |= converted.allow;
      } else {
        permissionsBigInt &= ~deny;
        permissionsBigInt |= allow;
      }
    }
    return permissionsBigInt;
  }

  hasPermission(permission: bigint, action: number, type: ToCheck): boolean {
    const actionAsBigInt: bigint = BigInt(1) << BigInt(action);
    const hasAction: boolean =
      (BigInt(permission) & actionAsBigInt) == actionAsBigInt;
    if (type === 'allow') {
      return hasAction;
    } else if (type === 'deny') {
      return !hasAction;
    } else {
      return false;
    }
  }
}
