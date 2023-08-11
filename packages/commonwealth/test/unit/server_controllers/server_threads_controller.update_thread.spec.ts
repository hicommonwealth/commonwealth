import { expect } from 'chai';
import { ServerThreadsController } from 'server/controllers/server_threads_controller';
import { UpdateThreadOptions } from 'server/controllers/server_threads_methods/update_thread';
import { ChainInstance } from 'server/models/chain';

describe('ServerThreadsController', () => {
  describe('#updateThread', () => {
    it('should patch update thread attributes', async () => {
      const address = {
        id: 1,
        address: '0x1234',
        role: 'admin',
        chain: 'ethereum',
        verified: true,
        update: async () => null,
      };
      const attributes: UpdateThreadOptions = {
        user: {
          getAddresses: async () => [address],
        } as any,
        address: address as any,
        chain: {
          id: 'ethereum',
        } as ChainInstance,
        threadId: 1,
        title: 'hello',
        body: 'wasup',
        url: 'https://example.com',
      };

      const db: any = {
        Thread: {
          findByPk: async () => ({
            version_history: ['{"body": ""}'],
            update: async () => null,
          }),
          findOne: async () => ({
            Address: address,
            toJSON: () => ({}),
          }),
        },
        // for findAllRoles
        Address: {
          findAll: async () => [address],
        },
        sequelize: {
          transaction: async () => ({
            rollback: async () => ({}),
            commit: async () => ({}),
          }),
        },
      };
      const tokenBalanceCache: any = {};
      const banCache: any = {
        checkBan: async () => [true, null],
      };

      const serverThreadsController = new ServerThreadsController(
        db,
        tokenBalanceCache,
        banCache
      );
      const [updatedThread, notificationOptions, analyticsOptions] =
        await serverThreadsController.updateThread(attributes);

      expect(updatedThread).to.be.ok;
      expect(notificationOptions).to.have.length(1);
      expect(analyticsOptions).to.have.length(0);
    });
  });
});
