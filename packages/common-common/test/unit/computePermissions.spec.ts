import { assert } from 'chai';
import {
  computePermissions,
  Permissions,
  Action,
  addAllowPermission,
  addDenyPermission,
  isPermitted,
} from 'common-common/src/permissions';

describe('computePermissions() unit tests', () => {
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

    const permission = computePermissions(base_permission, [
      overwrite_moderator,
      overwrite_admin,
    ]);
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should correctly computePermissions for Denying createThread action with two roles overwrites', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);

    // eslint-disable-next-line no-bitwise
    overwrite_moderator.allow = BigInt(1) << BigInt(Action.CREATE_THREAD);

    const permission = computePermissions(base_permission, [
      overwrite_moderator,
      overwrite_admin,
    ]);
    assert.isFalse(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should correctly computePermissions for Denying createThread action with community permissions overwrite', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);

    const permission = computePermissions(base_permission, [
      chain_permission,
      overwrite_admin,
    ]);
    assert.isFalse(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should correctly default to allow for computePermissions for a permission with the same allow and deny', () => {
    overwrite_admin.deny = addDenyPermission(BigInt(0), Action.CREATE_THREAD);
    overwrite_admin.allow = addAllowPermission(BigInt(0), Action.CREATE_THREAD);

    const permission = computePermissions(base_permission, [
      chain_permission,
      overwrite_admin,
    ]);
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should correctly default to allow for computePermissions for a permission with the same allow and deny and community permissions', () => {
    overwrite_admin.deny = addDenyPermission(BigInt(0), Action.CREATE_THREAD);
    overwrite_admin.allow = addAllowPermission(BigInt(0), Action.CREATE_THREAD);
    chain_permission.deny = addDenyPermission(BigInt(0), Action.VIEW_CHAT_CHANNELS);
    const permission = computePermissions(base_permission, [
      chain_permission,
      overwrite_admin,
    ]);
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
    assert.isFalse(isPermitted(permission, Action.VIEW_CHAT_CHANNELS));
  });

  it('should correctly implicit permissions for an addAllowPermission', () => {
    const actionPermission = addAllowPermission(
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
    overwrite_admin.allow = addAllowPermission(BigInt(0), Action.CREATE_THREAD);
    overwrite_moderator.deny = addDenyPermission(BigInt(0), Action.CREATE_THREAD);

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

    // If moderator allows viewing comments, but admin denies threads, we should still be able 
    // to view comments because View Comments is not implicit for denying View Threads
    overwrite_admin.deny = addDenyPermission(BigInt(0), Action.VIEW_THREADS);
    overwrite_moderator.allow = addAllowPermission(BigInt(0), Action.VIEW_COMMENTS);

    const permission = computePermissions(base_permission, [
      overwrite_moderator,
      overwrite_admin,
    ]);

    assert.isFalse(isPermitted(permission, Action.VIEW_THREADS));
    assert.isTrue(isPermitted(permission, Action.VIEW_COMMENTS));
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
    assert.isFalse(isPermitted(permission, Action.VIEW_THREADS));
    assert.isFalse(isPermitted(permission, Action.CREATE_THREAD));
    assert.isFalse(isPermitted(permission, Action.CREATE_TOPIC));
  });
});
