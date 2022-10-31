import { assert } from 'chai';
import {
  computePermissions,
  Permissions,
  Action,
} from 'common-common/src/permissions';

describe('computePermissions() unit tests', () => {
  const base_permission = BigInt(0);
  const overwrite_admin = { allow: base_permission, deny: base_permission };
  const overwrite_moderator = { allow: base_permission, deny: base_permission };
  const overwrite_member = { allow: base_permission, deny: base_permission };

  it('should correctly computePermissions for allowing createThread action with two roles overwrites', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.allow = BigInt(1) << BigInt(Action.CREATE_THREAD);

    // eslint-disable-next-line no-bitwise
    overwrite_moderator.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);

    const permission = computePermissions(base_permission, [overwrite_moderator, overwrite_admin]);
    // eslint-disable-next-line no-bitwise
    assert.deepEqual(permission, (base_permission | (BigInt(1) << BigInt(Action.CREATE_THREAD))));
  });

  it('should correctly computePermissions for denying createThread action with two roles overwrites', () => {
    // eslint-disable-next-line no-bitwise
    overwrite_admin.deny = BigInt(1) << BigInt(Action.CREATE_THREAD);

    // eslint-disable-next-line no-bitwise
    overwrite_moderator.allow = BigInt(1) << BigInt(Action.CREATE_THREAD);

    const permission = computePermissions(base_permission, [overwrite_moderator, overwrite_admin]);
    // eslint-disable-next-line no-bitwise
    assert.deepEqual(permission, (base_permission));
  });

});
