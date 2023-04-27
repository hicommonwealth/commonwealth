import { assert } from 'chai';
import { PermissionManager, Action, ToCheck } from 'shared/permissions';

describe('computePermissions() unit tests', () => {
  let base_permission;
  let overwrite_admin;
  let overwrite_moderator;
  let overwrite_member;
  let chain_permission;
  let permissionsManager;
  beforeEach(() => {
    permissionsManager = new PermissionManager();
    base_permission = BigInt(0);
    overwrite_admin = { allow: base_permission, deny: base_permission };
    overwrite_moderator = { allow: base_permission, deny: base_permission };
    overwrite_member = { allow: base_permission, deny: base_permission };
    chain_permission = { allow: base_permission, deny: base_permission };
  });

  it('should correctly computePermissions for allowing createThread action with two roles overwrites', () => {
    const permission = permissionsManager.computePermissions(base_permission, [
      overwrite_moderator,
      overwrite_admin,
    ]);
    assert.isTrue(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Deny
      )
    );
  });

  it('should correctly computePermissions for Denying createThread action with two roles overwrites', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);

    // eslint-disable-next-line no-bitwise
    overwrite_moderator.allow = BigInt(1) << BigInt(Action.CREATE_THREAD);

    const permission = permissionsManager.computePermissions(base_permission, [
      overwrite_moderator,
      overwrite_admin,
    ]);

    assert.isFalse(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
  });

  it('should correctly computePermissions for Denying createThread action with community permissions overwrite', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);

    const permission = permissionsManager.computePermissions(base_permission, [
      chain_permission,
      overwrite_admin,
    ]);
    assert.isTrue(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Deny
      )
    );
  });

  it('should correctly default to allow for computePermissions for a permission with the same allow and deny', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);
    // eslint-disable-next-line no-bitwise
    overwrite_admin.allow = BigInt(1) << BigInt(Action.CREATE_THREAD);

    const permission = permissionsManager.computePermissions(base_permission, [
      chain_permission,
      overwrite_admin,
    ]);
    assert.isTrue(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
  });

  it('should correctly implicit permissions for an addAllowPermission', () => {
    const permission = permissionsManager.addAllowPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    assert.isTrue(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
    assert.isTrue(
      permissionsManager.hasPermission(
        permission,
        Action.VIEW_THREADS,
        ToCheck.Allow
      )
    );
  });

  it('should correctly implicit permissions for addDenyPermission', () => {
    const permission = permissionsManager.addDenyPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    console.log('permission', permission);
    assert.isFalse(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Deny
      )
    );
    assert.isFalse(
      permissionsManager.hasPermission(
        permission,
        Action.VIEW_THREADS,
        ToCheck.Deny
      )
    );
  });

  it('should correctly implicit permissions for removeAllowPermission', () => {
    const permission = permissionsManager.addAllowPermission(
      base_permission,
      Action.CREATE_THREAD
    );

    const actionPermission = permissionsManager.removeAllowPermission(
      permission,
      Action.CREATE_THREAD
    );

    const res = permissionsManager.hasPermission(
      actionPermission,
      Action.CREATE_THREAD,
      ToCheck.Allow
    );

    assert.isFalse(
      permissionsManager.hasPermission(
        actionPermission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
    assert.isFalse(
      permissionsManager.hasPermission(
        actionPermission,
        Action.VIEW_THREADS,
        ToCheck.Allow
      )
    );
  });

  it('should correctly computePermissions for an action and its implicit permissions', () => {
    const allowPermission = permissionsManager.addAllowPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    assert.isTrue(
      permissionsManager.hasPermission(
        allowPermission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
    assert.isTrue(
      permissionsManager.hasPermission(
        allowPermission,
        Action.VIEW_THREADS,
        ToCheck.Allow
      )
    );
  });

  it('should correctly computePermissions for an action and its implicit permissions with one denial', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = BigInt(1) << BigInt(Action.VIEW_COMMENTS);

    // eslint-disable-next-line no-bitwise
    overwrite_moderator.allow = BigInt(1) << BigInt(Action.VIEW_COMMENTS);

    const permission = permissionsManager.computePermissions(base_permission, [
      overwrite_moderator,
      overwrite_admin,
    ]);
    assert.isFalse(
      permissionsManager.hasPermission(
        permission,
        Action.VIEW_THREADS,
        ToCheck.Allow
      )
    );
    assert.isFalse(
      permissionsManager.hasPermission(
        permission,
        Action.VIEW_COMMENTS,
        ToCheck.Allow
      )
    );
    assert.isFalse(
      permissionsManager.hasPermission(
        permission,
        Action.VIEW_THREADS,
        ToCheck.Allow
      )
    );
    assert.isFalse(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
  });
});
