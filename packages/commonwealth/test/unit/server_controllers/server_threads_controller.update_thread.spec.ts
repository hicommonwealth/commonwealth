import { expect } from 'chai';
import { ServerThreadsController } from 'server/controllers/server_threads_controller';
import {
  UpdateThreadOptions,
  UpdateThreadPermissions,
  validatePermissions,
} from 'server/controllers/server_threads_methods/update_thread';

describe('ServerThreadsController', () => {
  describe('#validatePermissions', () => {
    it('should fail if no permissions satisfied', () => {
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

    it('should fail for all flags except for isAdmin', () => {
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

  describe('#updateThread', () => {
    it('should patch update thread attributes', async () => {
      const address = {
        id: 1,
        address: '0x1234',
        role: 'admin',
        community_id: 'ethereum',
        verified: true,
        update: async () => ({}),
      };
      const attributes: UpdateThreadOptions = {
        user: {
          getAddresses: async () => [address],
        } as any,
        address: address as any,
        threadId: 1,
        title: 'hello',
        body: 'wasup',
        url: 'https://example.com',
      };

      const db: any = {
        Thread: {
          findOne: async () => ({
            Address: address,
            address_id: address.id,
            version_history: ['{"body": ""}'],
            update: async () => null,
            toJSON: () => ({}),
          }),
        },
        Topic: {
          findOne: async () => ({
            id: 1,
          }),
        },
        // for findAllRoles
        Address: {
          findAll: async () => [address],
        },
        Community: {
          findByPk: async () => ({ id: 'ethereum' }),
        },
        sequelize: {
          transaction: async () => ({
            rollback: async () => ({}),
            commit: async () => ({}),
          }),
        },
      };
      const banCache: any = {
        checkBan: () => [true, null],
      };

      const serverThreadsController = new ServerThreadsController(db, banCache);
      const [updatedThread, notificationOptions, analyticsOptions] =
        await serverThreadsController.updateThread(attributes);

      expect(updatedThread).to.be.ok;
      expect(notificationOptions).to.have.length(1);
      expect(analyticsOptions).to.have.length(0);
    });
  });
});
