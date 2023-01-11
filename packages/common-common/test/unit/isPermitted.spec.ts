import { assert } from 'chai';
import type { Permissions } from 'common-common/src/permissions';
import { isPermitted, Action } from 'common-common/src/permissions';

describe('isPermitted() unit tests', () => {
  it('should validate a create thread permission', () => {
    // eslint-disable-next-line no-bitwise
    const permission: Permissions = BigInt(1 << 12);
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should validate a create thread permission with other permissions', () => {
    // eslint-disable-next-line no-bitwise
    const permission: Permissions = BigInt(1 << 12) | BigInt(1 << 13);
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should validate a create thread permission with other permissions', () => {
    // eslint-disable-next-line no-bitwise
    const permission: Permissions = BigInt(1 << 13) | BigInt(1 << 15);
    assert.isFalse(isPermitted(permission, Action.CREATE_THREAD));
  });
});
