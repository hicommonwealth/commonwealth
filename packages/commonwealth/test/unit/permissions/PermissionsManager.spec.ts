import { expect } from 'chai';
import {
  PermissionManager,
  AccessLevel,
  Permissions,
  Action,
  defaultAdminPermissions,
  defaultModeratorPermissions,
  defaultMemberPermissions,
  defaultEveryonePermissions,
} from '../../../server/util/permissions';

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
      expect(newPermission).to.equal(BigInt(1) << BigInt(action));
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

  describe('computePermissions for each AccessLevel', () => {
    it('should compute permissions correctly for Admin access level', () => {
      const base = defaultAdminPermissions;
      const assignments = [
        { allow: BigInt(1) << BigInt(Action.CREATE_CHAT), deny: 0n },
      ];
      const expectedPermission =
        (BigInt(1) << BigInt(Action.CREATE_CHAT)) |
        (BigInt(1) << BigInt(Action.VIEW_CHAT_CHANNELS));
      const permission = permissionManager.computePermissions(
        base,
        assignments
      );
      expect(permission).to.equal(expectedPermission);
    });

    it('should compute permissions correctly for Moderator access level', () => {
      const base = defaultModeratorPermissions;
      const assignments = [
        { allow: BigInt(1) << BigInt(Action.CREATE_POLL), deny: 0n },
      ];
      const expectedPermission =
        (BigInt(1) << BigInt(Action.CREATE_POLL)) |
        (BigInt(1) << BigInt(Action.VOTE_ON_POLLS)) |
        (BigInt(1) << BigInt(Action.VIEW_POLLS));
      const permission = permissionManager.computePermissions(
        base,
        assignments
      );
      expect(permission).to.equal(expectedPermission);
    });

    it('should compute permissions correctly for Member access level', () => {
      const base = defaultMemberPermissions;
      const assignments = [
        { allow: BigInt(1) << BigInt(Action.CREATE_TOPIC), deny: 0n },
      ];
      const expectedPermission =
        (BigInt(1) << BigInt(Action.CREATE_TOPIC)) |
        (BigInt(1) << BigInt(Action.VIEW_TOPICS));
      const permission = permissionManager.computePermissions(
        base,
        assignments
      );
      expect(permission).to.equal(expectedPermission);
    });

    it('should compute permissions correctly for Everyone access level', () => {
      const base = defaultEveryonePermissions;
      const assignments = [
        { allow: BigInt(1) << BigInt(Action.CREATE_TOPIC), deny: 0n },
      ];
      const expectedPermission =
        (BigInt(1) << BigInt(Action.CREATE_TOPIC)) |
        (BigInt(1) << BigInt(Action.VIEW_TOPICS));
      const permission = permissionManager.computePermissions(
        base,
        assignments
      );
      expect(permission).to.equal(expectedPermission);
    });
  });
});
