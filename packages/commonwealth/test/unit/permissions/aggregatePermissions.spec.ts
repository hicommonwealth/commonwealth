import { aggregatePermissions } from 'shared/utils';
import { assert } from 'chai';
import {
  addPermission,
  Action,
  isPermitted,
} from 'common-common/src/permissions';
import { Permission } from 'server/models/role';

describe('aggregatePermissions() unit tests', () => {
  const base_permission = BigInt(0);
  const overwrite_admin = { allow: base_permission, deny: base_permission };
  const overwrite_moderator = { allow: base_permission, deny: base_permission };
  const overwrite_member = { allow: base_permission, deny: base_permission };
  const chain_permission = { allow: base_permission, deny: base_permission };

  it('should correctly aggregate permissions for a community with member roles', () => {
    const allowCreateThread = addPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    const admin_name: Permission = 'admin';
    const moderator_name: Permission = 'moderator';
    const roles = [
      {
        allow: allowCreateThread,
        deny: base_permission,
        permission: admin_name,
      },
      {
        ...overwrite_moderator,
        permission: moderator_name,
      },
    ];

    const permission = aggregatePermissions(roles, chain_permission);
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should correctly aggregate permissions for a community with member roles that overwrite each other', () => {
    const createThread = addPermission(base_permission, Action.CREATE_THREAD);
    const viewChat = addPermission(base_permission, Action.VIEW_CHAT_CHANNELS);
    const admin_name: Permission = 'admin';
    const moderator_name: Permission = 'moderator';
    const roles = [
      {
        allow: createThread,
        deny: viewChat,
        permission: admin_name,
      },
      {
        allow: viewChat,
        deny: createThread,
        permission: moderator_name,
      },
    ];

    const permission = aggregatePermissions(roles, chain_permission);
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(permission, Action.VIEW_CHAT_CHANNELS));
    // eslint-disable-next-line no-bitwise
    assert.isFalse(isPermitted(permission, Action.CREATE_THREAD));
  });
});
