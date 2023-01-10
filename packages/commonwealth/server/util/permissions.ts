import { DB } from '../models';

export type AccessLevel = "admin" | "moderator" | "member" | "everyone";

export enum PermissionError {
  NOT_PERMITTED = "Action not permitted",
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
}

const defaultAdminPermissions = {
  [Action.DELETE_THREAD]: [
    Action.EDIT_THREAD,
    Action.CREATE_THREAD,
    Action.VIEW_THREADS,
  ],
  [Action.DELETE_COMMENT]: [
    Action.EDIT_COMMENT,
    Action.CREATE_COMMENT,
    Action.VIEW_COMMENTS,
  ],
  [Action.DELETE_REACTION]: [
    Action.CREATE_REACTION,
    Action.VIEW_REACTIONS,
  ],
  [Action.DELETE_TOPIC]: [
    Action.EDIT_TOPIC,
    Action.CREATE_TOPIC,
    Action.VIEW_TOPICS,
  ],
}

const defaultModeratorPermissions = {
  [Action.CREATE_CHAT]: Action.VIEW_CHAT_CHANNELS,
  [Action.EDIT_THREAD]: [
    Action.CREATE_THREAD,
    Action.VIEW_THREADS,
  ],
  [Action.EDIT_COMMENT]: [
    Action.CREATE_COMMENT,
    Action.VIEW_COMMENTS,
  ],
  [Action.EDIT_TOPIC]: [
    Action.CREATE_TOPIC,
    Action.VIEW_TOPICS,
  ],
}

const defaultMemberPermissions = {
  [Action.CREATE_POLL]: [
    Action.VOTE_ON_POLLS,
    Action.VIEW_POLLS,
  ],
  [Action.CREATE_THREAD]: [Action.VIEW_THREADS],
  [Action.CREATE_COMMENT]: [Action.VIEW_COMMENTS],
  [Action.CREATE_REACTION]: [Action.VIEW_REACTIONS],
}

const defaultEveryonePermissions: bigint =
  (BigInt(1) << BigInt(Action.VIEW_REACTIONS)) |
  (BigInt(1) << BigInt(Action.CREATE_REACTION)) |
  (BigInt(1) << BigInt(Action.DELETE_REACTION)) |
  (BigInt(1) << BigInt(Action.CREATE_THREAD)) |
  (BigInt(1) << BigInt(Action.VIEW_CHAT_CHANNELS)) |
  (BigInt(1) << BigInt(Action.VIEW_THREADS));

export class PermissionManager {
  private models: DB;
  private action: Action;
  private defaultEveryonePermissions: bigint
  private defaultAdminPermissions: { [key: number]: Array<Action> | Action };
  private defaultModeratorPermissions: { [key: number]: Array<Action> | Action };
  private defaultMemberPermissions: { [key: number]: Array<Action> | Action };

  constructor(_models: DB) {
    this.models = _models;
    this.defaultEveryonePermissions = defaultEveryonePermissions;
    this.defaultAdminPermissions = defaultAdminPermissions;
    this.defaultModeratorPermissions = defaultModeratorPermissions;
    this.defaultMemberPermissions = defaultMemberPermissions;
  }

  gateGetAction(action: Action): bigint {
    return BigInt(1) << BigInt(action);
  }

  gatePostAction(action: Action): bigint {
    return BigInt(1) << BigInt(action);
  }

  gatePatchAction(action: Action): bigint {
    return BigInt(1) << BigInt(action);
  }

  gateDeleteAction(action: Action): bigint {
    return BigInt(1) << BigInt(action);
  }

  gateAction(action: Action): bigint {
    switch (action) {
      case Action.VIEW_REACTIONS:
      case Action.VIEW_COMMENTS:
      case Action.VIEW_POLLS:
      case Action.VIEW_THREADS:
      case Action.VIEW_TOPICS:
      case Action.VIEW_CHAT_CHANNELS:
        return this.gateGetAction(action);
      case Action.CREATE_CHAT:
      case Action.CREATE_REACTION:
      case Action.CREATE_COMMENT:
      case Action.CREATE_POLL:
      case Action.CREATE_THREAD:
      case Action.CREATE_TOPIC:
        return this.gatePostAction(action);
      case Action.EDIT_COMMENT:
      case Action.EDIT_THREAD:
      case Action.EDIT_TOPIC:
        return this.gatePatchAction(action);
      case Action.DELETE_REACTION:
      case Action.DELETE_COMMENT:
      case Action.DELETE_THREAD:
      case Action.DELETE_TOPIC:
        return this.gateDeleteAction(action);
      default:
        return BigInt(0);
    }
  }

  public addAllowImplicitPermission(allowPermission: bigint, actionNumber: number): bigint {
    const actionAsBigInt: bigint = BigInt(1) << BigInt(actionNumber);
    const newAllowPermission: bigint = allowPermission | actionAsBigInt;
    return newAllowPermission;
  }

  public removeAllowImplicitPermission(allowPermission: bigint, actionNumber: number): bigint {
    const actionAsBigInt: bigint = BigInt(1) << BigInt(actionNumber);
    const newAllowPermission: bigint = allowPermission & ~actionAsBigInt;
    return newAllowPermission;
  }

  public addDenyImplicitPermission(denyPermission: bigint, actionNumber: number): bigint {
    const actionAsBigInt: bigint = BigInt(1) << BigInt(actionNumber);
    const newDenyPermission: bigint = denyPermission | actionAsBigInt;
    return newDenyPermission;
  }

  public removeDenyImplicitPermission(denyPermission: bigint, actionNumber: number): bigint {
    const actionAsBigInt: bigint = BigInt(1) << BigInt(actionNumber);
    const newDenyPermission: bigint = denyPermission & ~actionAsBigInt;
    return newDenyPermission;
  }

  public isPermitted(action: Action): boolean {
    const actionAsBigInt: bigint = BigInt(1) << BigInt(action);
    const hasAction: boolean =
      (this.permissions & actionAsBigInt) == actionAsBigInt;
    return hasAction;
  }

  public computePermissions(
    assignments: Array<{ allow: bigint; deny: bigint }>
  ): bigint {
    let permission: bigint = this.permissions;
    for (const assignment of assignments) {
      permission &= ~BigInt(assignment.deny);
      permission |= BigInt(assignment.allow);
    }

    return permission;
  }

  public getPermissions(): bigint {
    return this.permissions;
  }

  public setPermissions(permissions: bigint) {
    this.permissions = permissions;
  }


  public getImplicitPermissions(action: Action): Array<Action> {
    return this.implicitPermissions[action] || [];
  }

  public getImplicitPermissionsForAllActions(): Array<Action> {
    const result: Array<Action> = [];
    if (this.implicitPermissions) {
      for (const action in this.implicitPermissions) {
        result.push(...this.implicitPermissions[action]);
      }
    }
    return result;
  }
}
