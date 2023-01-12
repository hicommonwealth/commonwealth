import { expect } from 'chai';
import {
  PermissionManager,
  AccessLevel,
  Permissions,
  Action,
  adminPermissions,
  moderatorPermissions,
  memberPermissions,
  everyonePermissions,
} from '../../../server/util/permissions';

describe('PermissionManager', () => {
  let permissionManager: PermissionManager;

  beforeEach(() => {
    permissionManager = new PermissionManager();
  });

  describe('addAllowImplicitPermission', () => {
    it('should add the permission', () => {
      const originalPermission = 0n;
      const action = Action.CREATE_CHAT;
      const newPermission = permissionManager.addAllowPermission(
        originalPermission,
        action
      );
      const expectedPermission = BigInt(1) << BigInt(action);
      expect(newPermission).to.equal(expectedPermission);
    });
  });

  describe('removeAllowImplicitPermission', () => {
    it('should remove the permission', () => {
      const originalPermission = BigInt(1) << BigInt(Action.CREATE_CHAT);
      const action = Action.CREATE_CHAT;
      const newPermission = permissionManager.removeAllowPermission(
        originalPermission,
        action
      );
      expect(newPermission).to.equal(0n);
    });
  });

  describe('addDenyImplicitPermission', () => {
    it('should add the permission', () => {
      const originalPermission = 0n;
      const action = Action.CREATE_CHAT;
      const newPermission = permissionManager.addDenyPermission(
        originalPermission,
        action
      );
      expect(newPermission).to.equal(BigInt(1) << BigInt(action));
    });
  });

  describe('removeDenyImplicitPermission', () => {
    it('should remove the permission', () => {
      const originalPermission = BigInt(1) << BigInt(Action.CREATE_CHAT);
      const action = Action.CREATE_CHAT;
      const newPermission = permissionManager.removeDenyPermission(
        originalPermission,
        action
      );
      expect(newPermission).to.equal(0n);
    });
  });
});

describe('Access Level Permissions', () => {
  let permissionManager: PermissionManager;

  beforeEach(() => {
    permissionManager = new PermissionManager();
  });

  describe(AccessLevel.Admin, () => {
    it('should have all permissions', () => {
      const permissions = permissionManager.getPermissionsForAccessLevel(
        AccessLevel.Admin
      );
      expect(permissions).to.equal(adminPermissions);
    });
  });

  describe(AccessLevel.Moderator, () => {
    it('should have all permissions except admin-only permissions', () => {
      const permissions = permissionManager.getPermissionsForAccessLevel(
        AccessLevel.Moderator
      );
      expect(permissions).to.equal(moderatorPermissions);
    });
  });

  describe(AccessLevel.Member, () => {
    it('should have member permissions', () => {
      const permissions = permissionManager.getPermissionsForAccessLevel(
        AccessLevel.Member
      );
      expect(permissions).to.equal(memberPermissions);
    });
  });

  describe(AccessLevel.Everyone, () => {
    it('should have everyone permissions', () => {
      const permissions = permissionManager.getPermissionsForAccessLevel(
        AccessLevel.Everyone
      );
      expect(permissions).to.equal(everyonePermissions);
    });
  });
});
