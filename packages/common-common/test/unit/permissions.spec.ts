import { assert } from 'chai';
import {addPermission, removePermission, Action, isPermitted } from '../../src/permissions';

describe('addPermission() unit tests', () => {
  const base_permission = BigInt(0);
  const overwrite_admin = { allow: base_permission, deny: base_permission };
  const overwrite_moderator = { allow: base_permission, deny: base_permission };
  const overwrite_member = { allow: base_permission, deny: base_permission };
  const chain_permission = { allow: base_permission, deny: base_permission };

  it('should correctly add permission to a role', () => {
    let base = base_permission;
    base = addPermission(base, Action.CREATE_THREAD);

    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(base, Action.CREATE_THREAD));
  });
});