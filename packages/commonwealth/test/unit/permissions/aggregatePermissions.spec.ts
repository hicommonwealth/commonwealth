import { assert } from 'chai';
import {
  Action,
  AccessLevel,
  PermissionManager,
  ToCheck,
} from 'shared/permissions';
import { aggregatePermissions } from 'shared/utils';
import type { RoleObject } from 'shared/types';

describe('aggregatePermissions() unit tests', () => {
  let base_permission;
  let overwrite_admin;
  let overwrite_moderator;
  let overwrite_member;
  let chain_permission;
  let permissionsManager;

  beforeEach(() => {
    base_permission = BigInt(0);
    chain_permission = { allow: base_permission, deny: base_permission };
    permissionsManager = new PermissionManager();
  });

  it('should correctly aggregate permissions for a community with one member roles', () => {
    const allowCreateThread = permissionsManager.addAllowPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    const roles = [
      {
        allow: allowCreateThread,
        deny: base_permission,
        permission: AccessLevel.Admin,
      },
    ];

    console.log('roles', roles);

    const permission = aggregatePermissions(roles, chain_permission);
    // eslint-disable-next-line no-bitwise
    assert.isTrue(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
  });

  it('should correctly aggregate permissions for a community with member roles that overwrite each other', () => {
    const allowCreateThread = permissionsManager.addAllowPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    const allowViewChat = permissionsManager.addAllowPermission(
      base_permission,
      Action.VIEW_CHAT_CHANNELS
    );
    const denyViewChat = permissionsManager.removeAllowPermission(
      base_permission,
      Action.VIEW_CHAT_CHANNELS
    );
    const denyCreateThread = permissionsManager.addDenyPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    const admin_name = AccessLevel.Admin;
    const moderator_name = AccessLevel.Moderator;
    const roles: RoleObject[] = [
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
    assert.isTrue(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
  });

  it('should correctly aggregate permissions for a community with multiple role and community overwrites (no implicit)', () => {
    const allowCreateThread = permissionsManager.addAllowPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    const allowViewChat = permissionsManager.addAllowPermission(
      base_permission,
      Action.VIEW_CHAT_CHANNELS
    );
    const denyViewChat = permissionsManager.addDenyPermission(
      base_permission,
      Action.VIEW_CHAT_CHANNELS
    );
    const denyCreateThread = permissionsManager.addDenyPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    const allowCreateChat = permissionsManager.addAllowPermission(
      base_permission,
      Action.CREATE_CHAT
    );
    const admin_name = AccessLevel.Admin;
    const moderator_name = AccessLevel.Moderator;
    const member_name = AccessLevel.Member;
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
    assert.isTrue(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
    assert.isFalse(
      permissionsManager.hasPermission(
        permission,
        Action.VIEW_CHAT_CHANNELS,
        ToCheck.Allow
      )
    );
    assert.isTrue(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_CHAT,
        ToCheck.Allow
      )
    );
  });

  it('should correctly aggregate permissions for a community with multiple role overwrites', () => {
    const allowCreateThread = permissionsManager.addAllowPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    const allowViewChat = permissionsManager.addAllowPermission(
      base_permission,
      Action.VIEW_CHAT_CHANNELS
    );
    const denyViewChat = permissionsManager.addDenyPermission(
      base_permission,
      Action.VIEW_CHAT_CHANNELS
    );
    const denyCreateThread = permissionsManager.addDenyPermission(
      base_permission,
      Action.CREATE_THREAD
    );
    const admin_name = AccessLevel.Admin;
    const moderator_name = AccessLevel.Moderator;
    const member_name = AccessLevel.Member;
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
    assert.isTrue(
      permissionsManager.hasPermission(
        permission,
        Action.CREATE_THREAD,
        ToCheck.Allow
      )
    );
    // eslint-disable-next-line no-bitwise
    assert.isFalse(
      permissionsManager.hasPermission(
        permission,
        Action.VIEW_CHAT_CHANNELS,
        ToCheck.Allow
      )
    );
  });
});
