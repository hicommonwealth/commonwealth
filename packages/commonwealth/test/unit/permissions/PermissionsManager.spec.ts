import { expect, assert } from 'chai';
import {
  PermissionManager,
  AccessLevel,
  Action,
  Permissions,
  impliedDenyPermissionsByAction,
  impliedAllowPermissionsByAction,
} from 'shared/permissions';

describe('PermissionManager', () => {
  let permissionManager: PermissionManager;

  beforeEach(() => {
    permissionManager = new PermissionManager();
  });

  describe('getAllowedPermissionsByAction', () => {
    it('should return an array of actions that are allowed by the given action, including the given action', () => {
      const action = Action.CREATE_COMMENT;
      const expectedPermissions = [
        Action.CREATE_COMMENT,
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
        Action.CREATE_COMMENT,
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
    it('should remove the given action and its impled actions from the allow permission bigint', () => {
      const allowPermission = BigInt(0);
      const actionNumber = Action.CREATE_THREAD;

      const result = permissionManager.addAllowPermission(
        allowPermission,
        actionNumber
      );

      const expectedPermissions =
        BigInt(1 << Action.VIEW_THREADS) |
        BigInt(1 << Action.CREATE_COMMENT) |
        BigInt(1 << Action.CREATE_THREAD);
      assert.equal(result, expectedPermissions);
    });
  });

  describe('removeDenyPermission', () => {
    it('should remove the given action and its implied actions from the deny permission bigint', () => {
      const denyPermission = BigInt(0);
      const actionNumber = Action.DELETE_COMMENT;

      const result = permissionManager.addDenyPermission(
        denyPermission,
        actionNumber
      );

      const expectedPermissions =
        BigInt(1 << Action.EDIT_COMMENT) | BigInt(1 << Action.DELETE_COMMENT);

      assert.equal(result, expectedPermissions);
    });
  });

  describe('addAllowPermission', () => {
    it('should add the given action and its implied actions to the allow permission bigint', () => {
      const allowPermission = BigInt(0);
      const actionNumber = Action.CREATE_THREAD;

      const result = permissionManager.addAllowPermission(
        allowPermission,
        actionNumber
      );

      const expectedPermissions =
        BigInt(1 << Action.CREATE_THREAD) |
        BigInt(1 << Action.VIEW_THREADS) |
        BigInt(1 << Action.CREATE_COMMENT);

      assert.equal(result, expectedPermissions);
    });
  });

  describe('addDenyPermission', () => {
    it('should add the given action and its implied actions to the deny permission bigint', () => {
      const denyPermission = BigInt(0);
      const actionNumber = Action.DELETE_COMMENT;

      const result = permissionManager.addDenyPermission(
        denyPermission,
        actionNumber
      );

      const expectedPermissions =
        BigInt(1 << Action.EDIT_COMMENT) | BigInt(1 << Action.DELETE_COMMENT);
      assert.equal(result, expectedPermissions);
    });
  });
});
