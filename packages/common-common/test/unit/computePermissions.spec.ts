import { assert } from 'chai';
import { Action, addPermission, computePermissions, isPermitted, } from 'common-common/src/permissions';

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
    // eslint-disable-next-line no-bitwise
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
    // eslint-disable-next-line no-bitwise
    assert.isFalse(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should correctly computePermissions for Denying createThread action with community permissions overwrite', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);

    const permission = computePermissions(base_permission, [
      chain_permission,
      overwrite_admin,
    ]);
    // eslint-disable-next-line no-bitwise
    assert.isFalse(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should correctly default to allow for computePermissions for a permission with the same allow and deny', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = addPermission(BigInt(0), Action.CREATE_THREAD);
    // eslint-disable-next-line no-bitwise
    overwrite_admin.allow = addPermission(BigInt(0), Action.CREATE_THREAD);

    const permission = computePermissions(base_permission, [
      chain_permission,
      overwrite_admin,
    ]);
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should correctly default to allow for computePermissions for a permission with the same allow and deny and community permissions', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = addPermission(BigInt(0), Action.CREATE_THREAD);
    // eslint-disable-next-line no-bitwise
    overwrite_admin.allow = addPermission(BigInt(0), Action.CREATE_THREAD);
    chain_permission.deny = addPermission(BigInt(0), Action.VIEW_CHAT_CHANNELS);
    const permission = computePermissions(base_permission, [
      chain_permission,
      overwrite_admin,
    ]);
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
    // eslint-disable-next-line no-bitwise
    assert.isFalse(isPermitted(permission, Action.VIEW_CHAT_CHANNELS));
  });
});
