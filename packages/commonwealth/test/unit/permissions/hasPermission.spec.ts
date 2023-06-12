import { assert } from 'chai';
import { PermissionManager, Action, ToCheck } from 'shared/permissions';

describe('hasPermissions() unit tests', () => {
  const permissionsManager = new PermissionManager();

  it('should validate a create thread permission', () => {
    // eslint-disable-next-line no-bitwise
    const permission = BigInt(1 << Action.CREATE_THREAD);
    assert.isTrue(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
  });

  it('should validate a create thread permission with other permissions', () => {
    // eslint-disable-next-line no-bitwise
    const permission = BigInt(1 << Action.CREATE_THREAD) | BigInt(1 << 13);
    assert.isTrue(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
  });

  it('should validate a create thread permission with other permissions', () => {
    // eslint-disable-next-line no-bitwise
    const permission = BigInt(1 << Action.CREATE_COMMENT) | BigInt(1 << 15);
    assert.isFalse(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
  });
});
