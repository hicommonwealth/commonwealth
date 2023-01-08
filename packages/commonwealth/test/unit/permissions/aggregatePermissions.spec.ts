import { assert } from 'chai';
import { Action, addPermission, isPermitted } from 'common-common/src/permissions';
import type { Permission } from 'server/models/role';
import { aggregatePermissions } from '../../../shared/utils';

describe('aggregatePermissions() unit tests', () => {
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

  it('should correctly aggregate permissions for a community with one member roles', () => {
    const allowCreateThread = addPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    const admin_name: Permission = 'admin';
    const roles = [
      {
        allow: allowCreateThread,
        deny: base_permission,
        permission: admin_name,
      }
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
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
    // eslint-disable-next-line no-bitwise
    assert.isFalse(isPermitted(permission, Action.VIEW_CHAT_CHANNELS));
  });

  it('should correctly aggregate permissions for a community with multiple role and community overwrites', () => {
    const createThread = addPermission(base_permission, Action.CREATE_THREAD);
    const viewChat = addPermission(base_permission, Action.VIEW_CHAT_CHANNELS);
    const createChat = addPermission(base_permission, Action.CREATE_CHAT);
    const admin_name: Permission = 'admin';
    const moderator_name: Permission = 'moderator';
    const member_name: Permission = 'member';
    const roles = [
      {
        allow: createThread,
        deny: viewChat,
        permission: admin_name,
      },
      {
        allow: viewChat,
        deny: createThread,
        permission: member_name,
      },
      {
        allow: viewChat,
        deny: createThread,
        permission: moderator_name,
      },
    ];

    chain_permission.allow = createChat;
    chain_permission.deny = createThread;

    const permission = aggregatePermissions(roles, chain_permission);
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
    // eslint-disable-next-line no-bitwise
    assert.isFalse(isPermitted(permission, Action.VIEW_CHAT_CHANNELS));
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(permission, Action.CREATE_CHAT));
  });

  it('should correctly aggregate permissions for a community with multiple role overwrites', () => {
    const createThread = addPermission(base_permission, Action.CREATE_THREAD);
    const viewChat = addPermission(base_permission, Action.VIEW_CHAT_CHANNELS);
    const admin_name: Permission = 'admin';
    const moderator_name: Permission = 'moderator';
    const member_name: Permission = 'member';
    const roles = [
      {
        allow: createThread,
        deny: viewChat,
        permission: admin_name,
      },
      {
        allow: viewChat,
        deny: createThread,
        permission: member_name,
      },
      {
        allow: viewChat,
        deny: createThread,
        permission: moderator_name,
      },
    ];

    const permission = aggregatePermissions(roles, chain_permission);
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
    // eslint-disable-next-line no-bitwise
    assert.isFalse(isPermitted(permission, Action.VIEW_CHAT_CHANNELS));
  });
});
