import { assert } from 'chai';
import { isPermitted, Permissions, Action } from 'common-common/src/permissions';

describe('isPermitted() unit tests', () => {
  it('should validate a create thread permission', () => {
    // eslint-disable-next-line no-bitwise
    const permission: Permissions = BigInt(1 << Action.CREATE_THREAD);
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should validate a create thread permission with other permissions', () => {
    // eslint-disable-next-line no-bitwise
    const permission: Permissions = BigInt(1 << Action.CREATE_THREAD) | BigInt(1 << 13);
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should validate a create thread permission with other permissions', () => {
    // eslint-disable-next-line no-bitwise
    const permission: Permissions = BigInt(1 << Action.CREATE_COMMENT) | BigInt(1 << 15);
    assert.isFalse(isPermitted(permission, Action.CREATE_THREAD));
  });
});
