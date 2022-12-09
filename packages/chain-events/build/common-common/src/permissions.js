"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePermissions = exports.isPermitted = exports.BASE_PERMISSIONS = exports.removePermission = exports.addPermission = exports.PermissionError = exports.Action = void 0;
var Action;
(function (Action) {
    Action[Action["INVITE_MEMBERS"] = 0] = "INVITE_MEMBERS";
    Action[Action["BAN_MEMBERS"] = 1] = "BAN_MEMBERS";
    Action[Action["MANAGE_COMMUNITY"] = 2] = "MANAGE_COMMUNITY";
    Action[Action["ADMINISTRATOR"] = 3] = "ADMINISTRATOR";
    Action[Action["MANAGE_ROLES"] = 4] = "MANAGE_ROLES";
    Action[Action["MANAGE_WEBHOOKS"] = 5] = "MANAGE_WEBHOOKS";
    Action[Action["MANAGE_TOPICS"] = 6] = "MANAGE_TOPICS";
    Action[Action["MANAGE_CHAT_CHANNELS"] = 7] = "MANAGE_CHAT_CHANNELS";
    Action[Action["VIEW_COMMUNITY_INSIGHTS"] = 8] = "VIEW_COMMUNITY_INSIGHTS";
    Action[Action["MANAGE_INVITES"] = 9] = "MANAGE_INVITES";
    Action[Action["VIEW_TOPIC"] = 10] = "VIEW_TOPIC";
    Action[Action["VIEW_CHAT_CHANNELS"] = 11] = "VIEW_CHAT_CHANNELS";
    Action[Action["CREATE_THREAD"] = 12] = "CREATE_THREAD";
    Action[Action["MANAGE_THREADS"] = 13] = "MANAGE_THREADS";
    Action[Action["CREATE_CHAT"] = 14] = "CREATE_CHAT";
    Action[Action["CREATE_REACTION"] = 15] = "CREATE_REACTION";
    Action[Action["CREATE_COMMENT"] = 16] = "CREATE_COMMENT";
    Action[Action["CREATE_POLL"] = 17] = "CREATE_POLL";
    Action[Action["VOTE_ON_POLLS"] = 18] = "VOTE_ON_POLLS";
    Action[Action["MANAGE_POLLS"] = 19] = "MANAGE_POLLS";
})(Action = exports.Action || (exports.Action = {}));
var PermissionError;
(function (PermissionError) {
    PermissionError["NOT_PERMITTED"] = "Action not permitted";
})(PermissionError = exports.PermissionError || (exports.PermissionError = {}));
function addPermission(permission, actionNumber) {
    let result = BigInt(permission);
    // eslint-disable-next-line no-bitwise
    result |= BigInt(1) << BigInt(actionNumber);
    return result;
}
exports.addPermission = addPermission;
function removePermission(permission, actionNumber) {
    let result = BigInt(permission);
    // eslint-disable-next-line no-bitwise
    result &= ~(BigInt(1) << BigInt(actionNumber));
    return result;
}
exports.removePermission = removePermission;
exports.BASE_PERMISSIONS = addPermission(BigInt(0), Action.CREATE_THREAD) |
    addPermission(BigInt(0), Action.VIEW_CHAT_CHANNELS);
function isPermitted(permission, action) {
    const actionAsBigInt = BigInt(1) << BigInt(action);
    const hasAction = (BigInt(permission) & actionAsBigInt) == actionAsBigInt;
    return hasAction;
}
exports.isPermitted = isPermitted;
function computePermissions(base, assignments) {
    let permission = base;
    for (const assignment of assignments) {
        permission &= ~BigInt(assignment.deny);
        permission |= BigInt(assignment.allow);
    }
    return permission;
}
exports.computePermissions = computePermissions;
