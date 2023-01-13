import { assert } from 'chai';
import {
  PermissionManager,
  Action,
} from 'commonwealth/server/util/permissions';

describe('add, remove Allow and Deny ImplicitPermissions() unit tests', () => {
  let base_permission;
  let overwrite_admin;
  let overwrite_moderator;
  let overwrite_member;
  let chain_permission;

  const permissionsManager = new PermissionManager();

  beforeEach(() => {
    base_permission = BigInt(0);
    overwrite_admin = { allow: base_permission, deny: base_permission };
    overwrite_moderator = { allow: base_permission, deny: base_permission };
    overwrite_member = { allow: base_permission, deny: base_permission };
    chain_permission = { allow: base_permission, deny: base_permission };
  });

  it('should correctly addAllowImplicitPermissions for Allowing createThread action with one role overwrite', () => {
    overwrite_moderator.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);
    const allow_permission = permissionsManager.addAllowPermission(
      overwrite_moderator.deny,
      Action.CREATE_THREAD
    );
    assert.isTrue(
      permissionsManager.isPermitted(allow_permission, Action.CREATE_THREAD)
    );
    assert.isTrue(
      permissionsManager.isPermitted(allow_permission, Action.VIEW_COMMENTS)
    );
  });

  it('Should still be able to view comments if creating thread is denied', () => {
    overwrite_moderator.deny =
      permissionsManager.addDenyPermission(base_permission, Action.CREATE_THREAD) |
      permissionsManager.addDenyPermission(base_permission, Action.VIEW_COMMENTS);
    const deny_permission = permissionsManager.removeDenyPermission(
      overwrite_moderator.deny,
      Action.CREATE_THREAD
    );
    assert.isTrue(permissionManager.isPermitted(deny_permission, Action.VIEW_COMMENTS));
  });

  it('View Threads should not be been part of the deny permission', () => {
    overwrite_moderator.deny = permissionsManager.addDenyPermission(
      base_permission,
      Action.MANAGE_TOPIC
    );
    const deny_permission = permissionsManager.addDenyPermission(
      overwrite_moderator.deny,
      Action.MANAGE_TOPIC
    );
    assert.isFalse(permissionsManager.isPermitted(deny_permission, Action.VIEW_THREADS));
  });
});
