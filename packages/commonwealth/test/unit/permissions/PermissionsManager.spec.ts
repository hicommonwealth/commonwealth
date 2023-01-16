import { expect, assert } from 'chai';
import {
  PermissionManager,
  AccessLevel,
  Action,
  Permissions,
} from 'commonwealth/server/util/permissions';

describe('PermissionManager', () => {
  let permissionManager: PermissionManager;

  beforeEach(() => {
    permissionManager = new PermissionManager();
  });

  describe('getPermissions', () => {
    it('should return the correct permissions for a given access level', () => {
      const accessLevel = AccessLevel.Admin;
      const expectedPermissions = {
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
      };
      expect(permissionManager.getPermissions(accessLevel)).to.deep.equal(
        expectedPermissions
      );
    });
  });

  describe('getAllowedPermissionsByAction', () => {
    it('should return an array of actions that are allowed by the given action, including the given action', () => {
      const action = Action.CREATE_COMMENT;
      const expectedPermissions = [
        Action.CREATE_REACTION,
        Action.VIEW_COMMENTS,
      ];
      const result = permissionManager.getAllowedPermissionsByAction(action);
      assert.deepEqual(result, expectedPermissions);
    });
  });

  describe('getDeniedPermissionsByAction', () => {
    it('should return an array of actions that are denied by the given action', () => {
      const action = Action.CREATE_COMMENT;
      const expectedPermissions = [
        Action.CREATE_REACTION,
        Action.VIEW_COMMENTS,
        Action.EDIT_COMMENT,
      ];
      assert.deepEqual(
        permissionManager.getDeniedPermissionsByAction(action),
        expectedPermissions
      );
    });
  });

  describe('removeAllowPermission', () => {
    it('should remove the given action from the allow permission bigint', () => {
      });
  });

  describe('removeDenyPermission', () => {
    it('should remove the given action from the deny permission bigint', () => {
      const denyPermission = BigInt(5); // 101 in binary (actions 1, 2 are denied)
      const actionNumber = Action.VIEW_REACTIONS;
      const expectedPermission = BigInt(1); // 001 in binary (only action 1 is denied)
      assert.deepEqual(
        permissionManager.removeDenyPermission(denyPermission, actionNumber),
        expectedPermission
      );
    });
  });

  describe('addAllowPermission', () => {
    it('should add the given action and its implied actions to the allow permission bigint', () => {
      const allowPermission = BigInt(0); // 0000 in binary (no actions allowed)
      const actionNumber = Action.CREATE_COMMENT;
      const expectedPermission = BigInt(11100); // 101100 in binary (actions 4, 5, 6 are allowed)
      assert.deepEqual(
        permissionManager.addAllowPermission(allowPermission, actionNumber),
        expectedPermission
      );
    });
  });

  describe('addDenyPermission', () => {
    it('should add the given action and its implied actions to the deny permission bigint', () => {
      let denyPermission = BigInt(0); // 0000 in binary (no actions denied)
      const actionNumber = Action.READ;
      denyPermission = permissionManager.addDenyPermission(
        denyPermission,
        actionNumber
      );
      const expectedPermission = BigInt(5); // 101 in binary (actions 1, 2 are denied)
      assert.deepEqual(denyPermission, expectedPermission);
    });
  });

  describe('mapPermissionsToBigint', () => {
    it('should map the given permissions object to a bigint', () => {
      const permissions: Permissions = {
        [Action.CREATE_THREAD]: [Action.VIEW_THREADS, Action.DELETE_THREAD],
        [Action.CREATE_COMMENT]: [Action.VIEW_COMMENTS, Action.DELETE_COMMENT],
        [Action.CREATE_POLL]: [Action.VOTE_ON_POLLS, Action.VIEW_POLLS],
      };
      const expectedBigInt =
        (BigInt(1) << BigInt(Action.CREATE_THREAD)) |
        (BigInt(1) << BigInt(Action.VIEW_THREADS)) |
        (BigInt(1) << BigInt(Action.DELETE_THREAD)) |
        (BigInt(1) << BigInt(Action.CREATE_COMMENT)) |
        (BigInt(1) << BigInt(Action.VIEW_COMMENTS)) |
        (BigInt(1) << BigInt(Action.DELETE_COMMENT)) |
        (BigInt(1) << BigInt(Action.CREATE_POLL)) |
        (BigInt(1) << BigInt(Action.VOTE_ON_POLLS)) |
        (BigInt(1) << BigInt(Action.VIEW_POLLS));
      assert.deepEqual(
        permissionManager.mapPermissionsToBigint(permissions),
        expectedBigInt
      );
    });
  });
});
