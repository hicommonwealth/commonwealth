import { assert } from 'chai';
import {
  allowDenyImplicitPermissions,
  Permissions,
  Action,
  addPermission,
  isPermitted,
  computePermissions,
} from 'common-common/src/permissions';

describe('allowDenyImplicitPermissions() unit tests', () => {
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

  it('should correctly allowDenyImplicitPermissions for Allowing createThread action with one role overwrite', () => {
    overwrite_moderator.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);
    const permission = allowDenyImplicitPermissions(overwrite_moderator.deny, Action.CREATE_THREAD, true);
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
    assert.isTrue(isPermitted(permission, Action.VIEW_COMMENTS));
  });

  it('Should still be able to view comments if creating thread is denied', () => {
    overwrite_moderator.deny = addPermission(base_permission, Action.CREATE_THREAD) | addPermission(base_permission, Action.VIEW_COMMENTS);
    const permission = allowDenyImplicitPermissions(overwrite_moderator.deny, Action.CREATE_THREAD, false);
    assert.isTrue(isPermitted(permission, Action.VIEW_COMMENTS));
  });

  it('Should still be able to view threads if creating topic is denied', () => {
    overwrite_moderator.deny = addPermission(base_permission, Action.CREATE_TOPIC);
    const permission = allowDenyImplicitPermissions(overwrite_moderator.deny, Action.CREATE_TOPIC, false);
    assert.isTrue(isPermitted(permission, Action.VIEW_THREADS));
  });
});
