import { commonProtocol } from '@hicommonwealth/model';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { ServerThreadsController } from 'server/controllers/server_threads_controller';
import Sinon from 'sinon';
import { afterEach, beforeEach, describe, test } from 'vitest';

chai.use(chaiAsPromised);

describe('ServerThreadsController', () => {
  beforeEach(() => {
    Sinon.stub(commonProtocol.contractHelpers, 'getNamespaceBalance').resolves({
      '0x123': '0',
    });
  });
  afterEach(() => {
    Sinon.restore();
  });

  describe('#deleteThread', () => {
    test('should delete a thread', async () => {
      const db = {
        Thread: {
          findOne: async () => ({
            id: 1,
            community_id: 'ethereum',
            address_id: 1,
            Address: {
              id: 1,
              address: '0x123',
            },
            destroy: async () => ({}),
          }),
          destroy: async () => ({}),
        },
        CommunityRole: {
          findAll: async () => [
            {
              toJSON: () => ({}),
            },
          ],
        },
        Subscription: {
          destroy: async () => ({}),
        },
        Address: {
          findAll: async () => [{}], // used in findOneRole
        },
        sequelize: {
          transaction: async (callback) => callback({}),
          query: () => Promise.resolve([]),
        },
      };
      const address = {
        address: '0x123',
      };

      // @ts-expect-error ignore type
      const serverThreadsController = new ServerThreadsController(db);
      const user = {
        getAddresses: async () => [{ id: 1, address: '0x123', verified: true }],
      };
      const threadId = 1;
      await serverThreadsController.deleteThread({
        // @ts-expect-error ignore type
        user: user,
        threadId,
        // @ts-expect-error ignore type
        address: address,
      });
    });

    test('should should throw error (thread not found)', () => {
      const db = {
        Thread: {
          findOne: async () => null,
          destroy: async () => ({}),
        },
        CommunityRole: {
          findAll: async () => [
            {
              toJSON: () => ({}),
            },
          ],
        },
        Subscription: {
          destroy: async () => ({}),
        },
        sequelize: {
          query: () => Promise.resolve([]),
        },
      };

      // @ts-expect-error ignore type
      const serverThreadsController = new ServerThreadsController(db);
      const user = {
        getAddresses: async () => [{ id: 1, address: '0x123', verified: true }],
      };
      const threadId = 1;
      const address = {
        address: '0x123',
      };
      expect(
        serverThreadsController.deleteThread({
          // @ts-expect-error ignore type
          user: user,
          threadId,
          // @ts-expect-error ignore type
          address: address,
        }),
      ).to.be.rejectedWith('Thread not found: 1');
    });

    test('should throw error (not owned)', () => {
      const db = {
        Thread: {
          findOne: async () => ({
            id: 1,
            Address: {
              id: 1,
              address: '0x123',
            },
          }),
          destroy: async () => ({}),
        },
        CommunityRole: {
          findAll: async () => [{}], // no mod/admin roles
        },
        Subscription: {
          destroy: async () => ({}),
        },
        Address: {
          findAll: async () => [{}], // used in findOneRole
        },
        sequelize: {
          query: () => Promise.resolve([]),
        },
      };

      // @ts-expect-error ignore type
      const serverThreadsController = new ServerThreadsController(db);
      const user = {
        // address is different from thread author
        getAddresses: async () => [{ id: 2, address: '0x124', verified: true }],
      };
      const threadId = 1;
      const address = {
        address: '0x123',
      };
      expect(
        serverThreadsController.deleteThread({
          // @ts-expect-error ignore type
          user: user,
          threadId,
          // @ts-expect-error ignore type
          address: address,
        }),
      ).to.be.rejectedWith('Not owned by this user');
    });
  });
});
