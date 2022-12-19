import { assert } from 'chai';
import {
  addRemoveImplicitPermissions,
  Permissions,
  Action,
  addPermission,
  isPermitted,
  computePermissions,
} from 'common-common/src/permissions';

describe('addRemoveImplicitPermissions() unit tests', () => {
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

  it('should correctly addRemoveImplicitPermissions for Allowing createThread action with one role overwrite', () => {
    overwrite_moderator.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);
    const permission = addRemoveImplicitPermissions(overwrite_moderator.deny, Action.CREATE_THREAD, true);
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
    assert.isTrue(isPermitted(permission, Action.VIEW_COMMENTS));
  });

  it('should correctly addRemoveImplicitPermissions for Denying createThread action with one role overwrite', () => {
    overwrite_moderator.deny = BigInt(1) << BigInt(Action.CREATE_THREAD) | BigInt(1) << BigInt(Action.VIEW_COMMENTS);
    const permission = addRemoveImplicitPermissions(overwrite_moderator.deny, Action.CREATE_THREAD, false);
    assert.isFalse(isPermitted(permission, Action.VIEW_COMMENTS));
  });
});
