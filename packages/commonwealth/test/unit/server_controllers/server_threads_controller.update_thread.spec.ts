import { expect } from 'chai';
import {
  UpdateThreadPermissions,
  validatePermissions,
} from 'server/controllers/server_threads_methods/update_thread';
import { describe, test } from 'vitest';

describe('ServerThreadsController', () => {
  describe('#validatePermissions', () => {
    test('should fail if no permissions satisfied', () => {
      const permissions: UpdateThreadPermissions = {
        isThreadOwner: false,
        isMod: false,
        isAdmin: false,
        isSuperAdmin: false,
        isCollaborator: false,
      };
      expect(() =>
        validatePermissions(permissions, {
          isThreadOwner: true,
          isMod: true,
          isAdmin: true,
          isSuperAdmin: true,
        }),
      ).to.throw('Unauthorized');
    });

    test('should fail for all flags except for isAdmin', () => {
      const permissions: UpdateThreadPermissions = {
        isThreadOwner: false,
        isMod: false,
        isAdmin: true,
        isSuperAdmin: false,
        isCollaborator: false,
      };

      // throws
      expect(() =>
        validatePermissions(permissions, {
          isThreadOwner: true,
        }),
      ).to.throw('Unauthorized');

      // throws
      expect(() =>
        validatePermissions(permissions, {
          isMod: true,
        }),
      ).to.throw('Unauthorized');

      // does NOT throw
      expect(() =>
        validatePermissions(permissions, {
          isAdmin: true,
        }),
      ).to.not.throw();

      // throws
      expect(() =>
        validatePermissions(permissions, {
          isSuperAdmin: true,
        }),
      ).to.throw('Unauthorized');

      // does NOT throw
      expect(() =>
        validatePermissions(permissions, {
          isThreadOwner: true,
          isMod: true,
          isAdmin: true,
          isSuperAdmin: true,
        }),
      ).to.not.throw();
    });
  });
});
