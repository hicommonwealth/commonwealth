import { assert } from 'chai';
import {
  computeImplicitPermissions,
  Permissions,
  Action,
  addPermission,
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
    const actionPermission = addPermission(base_permission, Action.VIEW_THREADS);

    const permission = computeImplicitPermissions(actionPermission);
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(permission, Action.VIEW_COMMENTS));
  });

});
