import { PermissionManager, Action } from '../../../server/util/permissions';
import DB from '../../../server/database';
import { expect } from 'chai';

describe('PermissionManager', () => {
  let permissionManager: PermissionManager;

  beforeEach(() => {
    permissionManager = new PermissionManager(DB);
  });

  describe('addAllowImplicitPermission', () => {
    it('should add the permission', () => {
      const originalPermission = 0n;
      const action = Action.CREATE_CHAT;
      const newPermission = permissionManager.addAllowImplicitPermission(originalPermission, action);
      expect(newPermission).to.equal(BigInt(1) << BigInt(action));
    });
  });

  describe('removeAllowImplicitPermission', () => {
    it('should remove the permission', () => {
      const originalPermission = BigInt(1) << BigInt(Action.CREATE_CHAT);
      const action = Action.CREATE_CHAT;
      const newPermission = permissionManager.removeAllowImplicitPermission(originalPermission, action);
      expect(newPermission).to.equal(0n);
    });
  });

  describe('addDenyImplicitPermission', () => {
    it('should add the permission', () => {
      const originalPermission = 0n;
      const action = Action.CREATE_CHAT;
      const newPermission = permissionManager.addDenyImplicitPermission(originalPermission, action);
      expect(newPermission).to.equal(BigInt(1) << BigInt(action));
    });
  });

  describe('removeDenyImplicitPermission', () => {
    it('should remove the permission', () => {
      const originalPermission = BigInt(1) << BigInt(Action.CREATE_CHAT);
      const action = Action.CREATE_CHAT;
      const newPermission = permissionManager.removeDenyImplicitPermission(originalPermission, action);
      expect(newPermission).to.equal(0n);
    });
  });
});


