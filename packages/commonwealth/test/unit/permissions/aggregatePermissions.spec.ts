import { aggregatePermissions } from "shared/utils";
import { assert } from 'chai';
import { addPermission, Action, isPermitted } from "common-common/src/permissions";

describe('aggregatePermissions() unit tests', () => {
  const base_permission = BigInt(0);
  const overwrite_admin = { allow: base_permission, deny: base_permission };
  const overwrite_moderator = { allow: base_permission, deny: base_permission };
  const overwrite_member = { allow: base_permission, deny: base_permission };
  const chain_permission = { allow: base_permission, deny: base_permission };

  it('should correctly aggregate permissions for a community with member roles', () => {
    const allowCreateThread = addPermission(base_permission, Action.CREATE_THREAD);
    const roles = [
        {
            allow: allowCreateThread,
            deny: base_permission,
            permission: 'admin'
        },
        {
            ...overwrite_moderator,
            permission: 'moderator'
        }]

    const permission = aggregatePermissions(roles, chain_permission);
    console.log("bigint", permission);
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
  });
});
