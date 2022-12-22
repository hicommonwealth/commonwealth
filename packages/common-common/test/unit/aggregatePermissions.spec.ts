import { assert } from 'chai';
import {
  addAllowPermission,
  Action,
  isPermitted,
  Permission,
  aggregatePermissions,
  addDenyPermission,
} from 'common-common/src/permissions';

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
    const allowCreateThread = addAllowPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    const admin_name: Permission = 'admin';
    const roles = [
      {
        allow: allowCreateThread,
        deny: base_permission,
        permission: admin_name,
      },
    ];

    const permission = aggregatePermissions(roles, chain_permission);
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
  });

  it('should correctly aggregate permissions for a community with member roles that overwrite each other', () => {
    const allowCreateThread = addAllowPermission(base_permission, Action.CREATE_THREAD);
    const allowViewChat = addAllowPermission(base_permission, Action.VIEW_CHAT_CHANNELS);
    const denyViewChat = addDenyPermission(base_permission, Action.VIEW_CHAT_CHANNELS);
    const denyCreateThread = addDenyPermission(base_permission, Action.CREATE_THREAD);
    const admin_name: Permission = 'admin';
    const moderator_name: Permission = 'moderator';
    const roles = [
      {
        allow: allowCreateThread,
        deny: denyViewChat,
        permission: admin_name,
      },
      {
        allow: allowViewChat,
        deny: denyCreateThread,
        permission: moderator_name,
      },
    ];

    const permission = aggregatePermissions(roles, chain_permission);
    // eslint-disable-next-line no-bitwise
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
    // eslint-disable-next-line no-bitwise
    assert.isFalse(isPermitted(permission, Action.VIEW_CHAT_CHANNELS));
  });

  it('should correctly aggregate permissions for a community with multiple role and community overwrites (no implicit)', () => {
    const allowCreateThread = addAllowPermission(base_permission, Action.CREATE_THREAD);
    const allowViewChat = addAllowPermission(base_permission, Action.VIEW_CHAT_CHANNELS);
    const denyViewChat = addDenyPermission(base_permission, Action.VIEW_CHAT_CHANNELS);
    const denyCreateThread = addDenyPermission(base_permission, Action.CREATE_THREAD);
    const allowCreateChat = addAllowPermission(base_permission, Action.CREATE_CHAT);
    const admin_name: Permission = 'admin';
    const moderator_name: Permission = 'moderator';
    const member_name: Permission = 'member';
    const roles = [
      {
        allow: allowCreateThread,
        deny: denyViewChat,
        permission: admin_name,
      },
      {
        allow: allowViewChat,
        deny: denyCreateThread,
        permission: member_name,
      },
      {
        allow: allowViewChat,
        deny: denyCreateThread,
        permission: moderator_name,
      },
    ];

    chain_permission.allow = allowCreateChat;
    chain_permission.deny = denyCreateThread;

    const permission = aggregatePermissions(roles, chain_permission);
    assert.isTrue(isPermitted(permission, Action.CREATE_THREAD));
    // View chat should be denied because it is denied by admin
    assert.isFalse(isPermitted(permission, Action.VIEW_CHAT_CHANNELS));
    // Create Chat is denied permitted because View Chat is denied
    assert.isFalse(isPermitted(permission, Action.CREATE_CHAT));
  });

  it('should correctly aggregate permissions for a community with multiple role overwrites', () => {
    const allowCreateThread = addAllowPermission(base_permission, Action.CREATE_THREAD);
    const allowViewChat = addAllowPermission(base_permission, Action.VIEW_CHAT_CHANNELS);
    const denyViewChat = addDenyPermission(base_permission, Action.VIEW_CHAT_CHANNELS);
    const denyCreateThread = addDenyPermission(base_permission, Action.CREATE_THREAD);
    const admin_name: Permission = 'admin';
    const moderator_name: Permission = 'moderator';
    const member_name: Permission = 'member';
    const roles = [
      {
        allow: allowCreateThread,
        deny: denyViewChat,
        permission: admin_name,
      },
      {
        allow: allowViewChat,
        deny: denyCreateThread,
        permission: member_name,
      },
      {
        allow: allowViewChat,
        deny: denyCreateThread,
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
