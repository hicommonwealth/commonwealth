import {
  PermissionManager,
  Permissions,
  Action,
  defaultAdminPermissions,
  defaultModeratorPermissions,
  defaultMemberPermissions,
} from '../../../server/util/permissions';
import DB from '../../../server/database';
import { expect } from 'chai';

function permissionsToBigInt(permissions: Permissions): bigint {
  let bigInt = 0n;
  for (const key in permissions) {
    if (permissions.hasOwnProperty(key)) {
      const element = permissions[key];
      if (Array.isArray(element)) {
        element.forEach((subElement) => {
          bigInt |= BigInt(1) << BigInt(subElement);
        });
      } else {
        bigInt |= BigInt(1) << BigInt(element);
      }
    }
  }
  return bigInt;
}

describe('PermissionManager', () => {
  let permissionManager: PermissionManager;

  beforeEach(() => {
    permissionManager = new PermissionManager(DB);
  });

  describe('addAllowImplicitPermission', () => {
    it('should add the permission', () => {
      const originalPermission = 0n;
      const action = Action.CREATE_CHAT;
      const newPermission = permissionManager.addAllowImplicitPermission(
        originalPermission,
        action
      );
      expect(newPermission).to.equal(BigInt(1) << BigInt(action));
    });
  });

  describe('removeAllowImplicitPermission', () => {
    it('should remove the permission', () => {
      const originalPermission = BigInt(1) << BigInt(Action.CREATE_CHAT);
      const action = Action.CREATE_CHAT;
      const newPermission = permissionManager.removeAllowImplicitPermission(
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
      const newPermission = permissionManager.addDenyImplicitPermission(
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
      const newPermission = permissionManager.removeDenyImplicitPermission(
        originalPermission,
        action
      );
      expect(newPermission).to.equal(0n);
    });
  });

  describe('computeAllowPermissions for admin', () => {
    it('should compute permissions for admin', () => {
      const newPermission = permissionManager.computeAllowPermissions(
        defaultAdminPermissions
      );
      expect(newPermission).to.equal(
        permissionsToBigInt(defaultAdminPermissions)
      );
    });

    it('should compute permissions for moderator', () => {
      const newPermission = permissionManager.computeAllowPermissions(
        defaultModeratorPermissions
      );
      expect(newPermission).to.equal(
        permissionsToBigInt(defaultModeratorPermissions)
      );
    });

    it('should compute permissions for member', () => {
      const newPermission = permissionManager.computeAllowPermissions(
        defaultMemberPermissions
      );
      expect(newPermission).to.equal(
        permissionsToBigInt(defaultMemberPermissions)
      );
    });
  });
});
