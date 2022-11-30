import { assert } from 'chai';
import {
  computeImplicitPermissions,
  Permissions,
  Action,
  addPermission,
  isPermitted,
  computePermissions,
} from 'common-common/src/permissions';

describe('computeImplicitPermissions() unit tests', () => {
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

  it('should correctly computeImplicitPermissions for an addPermission', () => {
    const actionPermission = addPermission(
      base_permission,
      Action.VIEW_THREADS
    );
    assert.isTrue(isPermitted(actionPermission, Action.VIEW_COMMENTS));
    assert.isTrue(isPermitted(actionPermission, Action.VIEW_COMMENTS));
    assert.isTrue(isPermitted(actionPermission, Action.VIEW_THREADS));
    assert.isTrue(isPermitted(actionPermission, Action.VIEW_REACTIONS));
    assert.isTrue(isPermitted(actionPermission, Action.VIEW_POLLS));
    assert.isFalse(isPermitted(actionPermission, Action.CREATE_THREAD));
  });

  it('should correctly computePermissions for an action and its implicit permissions', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.allow = addPermission(BigInt(0), Action.CREATE_THREAD);

    // eslint-disable-next-line no-bitwise
    overwrite_moderator.deny = addPermission(BigInt(0), Action.CREATE_THREAD);

    const permission = computePermissions(base_permission, [
      overwrite_moderator,
      overwrite_admin,
    ]);

    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
    assert.isTrue(isPermitted(permission, Action.CREATE_COMMENT));
    assert.isTrue(isPermitted(permission, Action.CREATE_POLL));
    assert.isTrue(isPermitted(permission, Action.CREATE_REACTION));
    assert.isTrue(isPermitted(permission, Action.VIEW_COMMENTS));
    assert.isTrue(isPermitted(permission, Action.VIEW_THREADS));
    assert.isTrue(isPermitted(permission, Action.VIEW_REACTIONS));
    assert.isTrue(isPermitted(permission, Action.VIEW_POLLS));
    assert.isTrue(isPermitted(permission, Action.DELETE_THREAD));
    assert.isFalse(isPermitted(permission, Action.CREATE_CHAT));
  });

  it('should correctly computePermissions for an action and its implicit permissions with one denial that is overwritten by admin', () => {
    // If moderator allows viewing comments, but admin denies threads. Then view threads should be allowed because viewing comments implies viewing threads.

    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = addPermission(BigInt(0), Action.VIEW_THREADS);

    // eslint-disable-next-line no-bitwise
    overwrite_moderator.allow = addPermission(BigInt(0), Action.VIEW_COMMENTS);

    const permission = computePermissions(base_permission, [
      overwrite_moderator,
      overwrite_admin,
    ]);

    assert.isFalse(isPermitted(permission, Action.VIEW_THREADS));
    assert.isFalse(isPermitted(permission, Action.VIEW_COMMENTS));
  });

  it('should correctly computePermissions for an action and its implicit permissions with one denial', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = BigInt(1) << BigInt(Action.VIEW_COMMENTS);

    // eslint-disable-next-line no-bitwise
    overwrite_moderator.allow = BigInt(1) << BigInt(Action.VIEW_COMMENTS);

    const permission = computePermissions(base_permission, [
      overwrite_moderator,
      overwrite_admin,
    ]);
    assert.isFalse(isPermitted(permission, Action.VIEW_THREADS));
    assert.isFalse(isPermitted(permission, Action.VIEW_COMMENTS));
  });
});
