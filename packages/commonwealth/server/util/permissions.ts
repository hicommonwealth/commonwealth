import { DB } from '../models';
export type AccessLevel = "admin" | "moderator" | "member";

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
  VIEW_TOPICS = 19,
  EDIT_TOPIC = 20,
  DELETE_TOPIC = 21,
}

const permissionsTree = {
  // Chat Subtree
  [Action.CREATE_CHAT]: [Action.VIEW_CHAT_CHANNELS],
  // View Subtree
  [Action.VIEW_TOPICS]: [Action.VIEW_THREADS],
  [Action.VIEW_THREADS]: [Action.VIEW_POLLS],
  [Action.VIEW_POLLS]: [Action.VIEW_COMMENTS],
  [Action.VIEW_COMMENTS]: [Action.VIEW_REACTIONS],
  // Create Subtree
  [Action.CREATE_TOPIC]: [
    Action.CREATE_THREAD,
    Action.EDIT_TOPIC,
    Action.DELETE_TOPIC,
    Action.VIEW_TOPICS,
  ],
  [Action.CREATE_THREAD]: [
    Action.CREATE_POLL,
    Action.EDIT_THREAD,
    Action.DELETE_THREAD,
    Action.VIEW_TOPICS,
  ],
  [Action.CREATE_POLL]: [
    Action.CREATE_COMMENT,
    Action.VOTE_ON_POLLS,
    Action.VIEW_TOPICS,
  ],
  [Action.CREATE_COMMENT]: [
    Action.CREATE_REACTION,
    Action.EDIT_COMMENT,
    Action.DELETE_COMMENT,
    Action.VIEW_TOPICS,
  ],
  [Action.CREATE_REACTION]: [Action.DELETE_REACTION, Action.VIEW_TOPICS],
  // Voting Subtree
  [Action.VOTE_ON_POLLS]: [Action.VIEW_POLLS],
  // Delete Subtree
  [Action.DELETE_TOPIC]: [Action.DELETE_THREAD],
  [Action.DELETE_THREAD]: [Action.DELETE_COMMENT],
  [Action.DELETE_COMMENT]: [Action.DELETE_REACTION],
  // Edit Subtree
  [Action.EDIT_TOPIC]: [Action.EDIT_THREAD],
  [Action.EDIT_THREAD]: [
    Action.LINK_THREAD_TO_THREAD,
    Action.LINK_PROPOSAL_TO_THREAD,
    Action.EDIT_COMMENT,
  ],
};

const defaultPermissions: bigint =
  (BigInt(1) << BigInt(Action.VIEW_REACTIONS)) |
  (BigInt(1) << BigInt(Action.CREATE_REACTION)) |
  (BigInt(1) << BigInt(Action.DELETE_REACTION)) |
  (BigInt(1) << BigInt(Action.CREATE_THREAD)) |
  (BigInt(1) << BigInt(Action.VIEW_CHAT_CHANNELS)) |
  (BigInt(1) << BigInt(Action.VIEW_THREADS));

export class PermissionManager {
  private models: DB;
  private permissions: bigint;
  private action: Action;
  private implicitPermissions: { [key: number]: Array<Action> };
  private log: Logger;

  constructor(_models: DB) {
    this.models = _models;
    this.implicitPermissions = permissionsTree;
    this.permissions = defaultPermissions;
      }

  public addPermission(access: AccessLevel) {
    switch (access) {
      case "admin":
        this.permissions |= BigInt(2) ** BigInt(Action.CREATE_CHAT) - BigInt(1);
        break;
      case "moderator":
        this.permissions |=
          BigInt(2) ** BigInt(Action.CREATE_TOPIC) - BigInt(1);
        break;
      case "member":
        this.permissions |= defaultPermissions;
        break;
      default:
        break;
    }
  }

  public removePermission(access: AccessLevel) {
    switch (access) {
      case "admin":
        this.permissions &= BigInt(2) ** BigInt(Action.CREATE_CHAT) - BigInt(1);
        break;
      case "moderator":
        this.permissions &=
          BigInt(2) ** BigInt(Action.CREATE_TOPIC) - BigInt(1);
        break;
      case "member":
        this.permissions &= ~defaultPermissions;
        break;
      default:
        break;
    }
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
