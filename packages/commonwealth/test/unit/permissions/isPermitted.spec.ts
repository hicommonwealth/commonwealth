import { assert } from 'chai';
import { PermissionManager, Action } from 'commonwealth/server/util/permissions';

describe('isPermitted() unit tests', () => {
  const permissionsManager = new PermissionManager();

  it('should validate a create thread permission', () => {
    // eslint-disable-next-line no-bitwise
    const permission = BigInt(1 << Action.CREATE_THREAD);
    assert.isTrue(permissionsManager.isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should validate a create thread permission with other permissions', () => {
    // eslint-disable-next-line no-bitwise
    const permission = BigInt(1 << Action.CREATE_THREAD) | BigInt(1 << 13);
    assert.isTrue(permissionsManager.isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should validate a create thread permission with other permissions', () => {
    // eslint-disable-next-line no-bitwise
    const permission = BigInt(1 << Action.CREATE_COMMENT) | BigInt(1 << 15);
    assert.isFalse(permissionsManager.isPermitted(permission, Action.CREATE_THREAD));
  });

});
