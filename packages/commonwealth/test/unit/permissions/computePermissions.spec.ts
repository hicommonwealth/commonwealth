import { assert } from 'chai';
import {
  PermissionManager,
  Action,
} from 'commonwealth/server/util/permissions';

describe('computePermissions() unit tests', () => {
  const permissionsManager = new PermissionManager();
  let base_permission;
  let overwrite_admin;
  let overwrite_moderator;
  let overwrite_member;
  let chain_permission;
  beforeEach(() => {
    base_permission = BigInt(0);
    overwrite_admin = { allow: base_permission, deny: base_permission };
    overwrite_moderator = { allow: base_permission, deny: base_permission };
    overwrite_member = { allow: base_permission, deny: base_permission };
    chain_permission = { allow: base_permission, deny: base_permission };
  });

  it('should correctly computePermissions for allowing createThread action with two roles overwrites', () => {
// eslint-disable-next-line no-bitwise
    overwrite_admin.allow = BigInt(1) << BigInt(Action.CREATE_THREAD);

    // eslint-disable-next-line no-bitwise
    overwrite_moderator.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);

    const permission = permissionsManager.computePermissions(base_permission, [
      overwrite_moderator,
      overwrite_admin,
    ]);
    assert.isTrue(permissionsManager.isPermitted(permission, Action.CREATE_THREAD));
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
      permissionsManager.isPermitted(permission, Action.CREATE_THREAD)
    );
  });

  it('should correctly computePermissions for Denying createThread action with community permissions overwrite', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);

    const permission = permissionsManager.computePermissions(base_permission, [
      chain_permission,
      overwrite_admin,
    ]);
    assert.isFalse(
      permissionsManager.isPermitted(permission, Action.CREATE_THREAD)
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
      permissionsManager.isPermitted(permission, Action.CREATE_THREAD)
    );
  });

  it('should correctly default to allow for computePermissions for a permission with the same allow and deny and community permissions', () => {
    overwrite_admin.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);
    overwrite_admin.allow = BigInt(1) << BigInt(Action.CREATE_THREAD);
    chain_permission.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);

    const permission = permissionsManager.computePermissions(base_permission, [
      chain_permission,
      overwrite_admin,
    ]);
    assert.isTrue(
      permissionsManager.isPermitted(permission, Action.CREATE_THREAD)
    );
    assert.isFalse(
      permissionsManager.isPermitted(permission, Action.VIEW_CHAT_CHANNELS)
    );
  });

  it('should correctly implicit permissions for an addAllowPermission', () => {
    const actionPermission = permissionsManager.addAllowPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    assert.isTrue(
      permissionsManager.isPermitted(actionPermission, Action.VIEW_COMMENTS)
    );
    assert.isTrue(
      permissionsManager.isPermitted(actionPermission, Action.VIEW_THREADS)
    );
    // assert.isFalse(
    //   permissionsManager.isPermitted(actionPermission, Action.CREATE_THREAD)
    // );
  });

  it('should correctly computePermissions for an action and its implicit permissions', () => {
    overwrite_admin.allow = permissionsManager.addAllowPermission(
      BigInt(0),
      Action.CREATE_THREAD
    );
    overwrite_moderator.deny = permissionsManager.addDenyPermission(
      BigInt(0),
      Action.CREATE_THREAD
    );

    const permission = permissionsManager.computePermissions(base_permission, [
      overwrite_moderator,
      overwrite_admin,
    ]);

    assert.isTrue(
      permissionsManager.isPermitted(permission, Action.CREATE_THREAD)
    );
    assert.isTrue(
      permissionsManager.isPermitted(permission, Action.CREATE_COMMENT)
    );
    assert.isTrue(
      permissionsManager.isPermitted(permission, Action.CREATE_REACTION)
    );
    assert.isTrue(
      permissionsManager.isPermitted(permission, Action.VIEW_COMMENTS)
    );
    assert.isTrue(
      permissionsManager.isPermitted(permission, Action.VIEW_THREADS)
    );
    assert.isTrue(
      permissionsManager.isPermitted(permission, Action.VIEW_REACTIONS)
    );
    assert.isFalse(
      permissionsManager.isPermitted(permission, Action.CREATE_CHAT)
    );
  });

  it('should correctly computePermissions for an action and its implicit permissions with one denial that is overwritten by admin', () => {
    // If moderator allows viewing comments, but admin denies threads, we should still be able
    // to view comments because View Comments is not implicit for denying View Threads
    overwrite_admin.deny = permissionsManager.addDenyPermission(
      BigInt(0),
      Action.VIEW_THREADS
    );
    overwrite_moderator.allow = permissionsManager.addAllowPermission(
      BigInt(0),
      Action.VIEW_COMMENTS
    );

    const permission = permissionsManager.computePermissions(base_permission, [
      overwrite_moderator,
      overwrite_admin,
    ]);

    assert.isFalse(
      permissionsManager.isPermitted(permission, Action.VIEW_THREADS)
    );
    assert.isTrue(
      permissionsManager.isPermitted(permission, Action.VIEW_COMMENTS)
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
      permissionsManager.isPermitted(permission, Action.VIEW_THREADS)
    );
    assert.isFalse(
      permissionsManager.isPermitted(permission, Action.VIEW_COMMENTS)
    );
    assert.isFalse(
      permissionsManager.isPermitted(permission, Action.VIEW_THREADS)
    );
    assert.isFalse(
      permissionsManager.isPermitted(permission, Action.CREATE_THREAD)
    );
  });
});
