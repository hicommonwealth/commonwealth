import BN from 'bn.js';
import { expect } from 'chai';
import { ServerThreadsController } from 'server/controllers/server_threads_controller';
import { AddressInstance } from 'server/models/address';
import { ChainInstance } from 'server/models/chain';
import { UserInstance } from 'server/models/user';
import Sinon from 'sinon';

describe('ServerThreadsController', () => {
  describe('#createThreadReaction', () => {
    it('should create a thread reaction (new reaction)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 2,
            chain: 'ethereum',
            Address: {
              address: '0x123',
              chain: 'ethereum',
            },
            destroy: sandbox.stub(),
            toJSON: () => ({}),
          }),
          findOrCreate: sandbox.stub().resolves([
            {
              id: 2,
              chain: 'ethereum',
              Address: {
                address: '0x123',
                chain: 'ethereum',
              },
              destroy: sandbox.stub(),
              toJSON: () => ({}),
            },
            false,
          ]),
        },
        Thread: {
          findOne: sandbox.stub().resolves({
            id: 4,
            title: 'Big Thread!',
            chain: 'ethereum',
          }),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: sandbox.stub().resolves([true, null]),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {};
      const chain = {
        id: 'ethereum',
      };
      const reaction = {};
      const threadId = 123;

      const serverThreadsController = new ServerThreadsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      const [newReaction, notificationOptions, analyticsOptions] =
        await serverThreadsController.createThreadReaction(
          user as any,
          address as any,
          chain as any,
          reaction as any,
          threadId
        );

      expect(newReaction).to.be.ok;

      expect(notificationOptions).to.have.property(
        'categoryId',
        'new-reaction'
      );
      expect(notificationOptions).to.have.property('objectId', 'discussion_4');

      expect(notificationOptions).to.have.property('notificationData');
      const { notificationData } = notificationOptions;
      expect(notificationData).to.have.property('created_at');
      expect(notificationData).to.include({
        thread_id: 4,
        root_title: 'Big Thread!',
        root_type: 'discussion',
        chain_id: 'ethereum',
        author_address: '0x123',
        author_chain: 'ethereum',
      });

      expect(notificationOptions).to.have.property('webhookData');
      const { webhookData } = notificationOptions;
      expect(webhookData).to.include({
        user: '0x123',
        author_chain: 'ethereum',
        url: 'http://localhost:8080/ethereum/discussion/4-big-thread',
        title: 'Big Thread!',
        chain: 'ethereum',
        body: '',
      });

      expect(notificationOptions).to.have.property('excludeAddresses');
      const { excludeAddresses } = notificationOptions;
      expect(excludeAddresses[0]).to.equal('0x123');

      expect(analyticsOptions).to.include({
        event: 'Create New Reaction',
        community: 'ethereum',
        isCustomDomain: null,
      });
    });

    it('should throw error (thread not found)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 2,
            chain: 'ethereum',
            Address: {
              address: '0x123',
              chain: 'ethereum',
            },
            destroy: sandbox.stub(),
            toJSON: () => ({}),
          }),
          findOrCreate: sandbox.stub().resolves([
            {
              id: 2,
              chain: 'ethereum',
              Address: {
                address: '0x123',
                chain: 'ethereum',
              },
              destroy: sandbox.stub(),
              toJSON: () => ({}),
            },
            false,
          ]),
        },
        Thread: {
          findOne: sandbox.stub().resolves(null),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: sandbox.stub().resolves([true, null]),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {};
      const chain = {
        id: 'ethereum',
      };
      const reaction = {};

      const serverThreadsController = new ServerThreadsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      expect(
        serverThreadsController.createThreadReaction(
          user as any,
          address as any,
          chain as any,
          reaction as any,
          123
        )
      ).to.be.rejectedWith('Thread not found: 123');
    });

    it('should throw error (banned)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 2,
            chain: 'ethereum',
            Address: {
              address: '0x123',
              chain: 'ethereum',
            },
            destroy: sandbox.stub(),
            toJSON: () => ({}),
          }),
          findOrCreate: sandbox.stub().resolves([
            {
              id: 2,
              chain: 'ethereum',
              Address: {
                address: '0x123',
                chain: 'ethereum',
              },
              destroy: sandbox.stub(),
              toJSON: () => ({}),
            },
            false,
          ]),
        },
        Thread: {
          findOne: sandbox.stub().resolves({
            id: 4,
            title: 'Big Thread!',
            chain: 'ethereum',
          }),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: sandbox.stub().resolves([false, 'big ban err']),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {};
      const chain = {
        id: 'ethereum',
      };
      const reaction = {};
      const commentId = 123;

      const serverThreadsController = new ServerThreadsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      expect(
        serverThreadsController.createThreadReaction(
          user as any,
          address as any,
          chain as any,
          reaction as any,
          commentId
        )
      ).to.be.rejectedWith('Ban error: big ban err');
    });

    it('should throw error (token balance)', async () => {
      const sandbox = Sinon.createSandbox();
      const db = {
        Reaction: {
          findOne: sandbox.stub().resolves({
            id: 2,
            chain: 'ethereum',
            Address: {
              address: '0x123',
              chain: 'ethereum',
            },
            destroy: sandbox.stub(),
            toJSON: () => ({}),
          }),
          findOrCreate: sandbox.stub().resolves([
            {
              id: 2,
              chain: 'ethereum',
              Address: {
                address: '0x123',
                chain: 'ethereum',
              },
              destroy: sandbox.stub(),
              toJSON: () => ({}),
            },
            false,
          ]),
        },
        Thread: {
          findOne: sandbox.stub().resolves({
            id: 4,
            title: 'Big Thread!',
            chain: 'ethereum',
            topic_id: 77,
          }),
        },
        // for validateTopicThreshold
        Topic: {
          findOne: sandbox.stub().resolves({
            chain: {
              ChainNode: {
                id: 99,
              },
            },
            token_threshold: 1,
          }),
        },
        CommunityContract: {
          findOne: sandbox.stub().resolves({}),
        },
        // for findAllRoles
        Address: {
          findAll: sandbox.stub().resolves([]),
        },
      };
      const tokenBalanceCache = {
        fetchUserBalance: sandbox.stub().resolves(new BN(0.5)),
      };
      const banCache = {
        checkBan: sandbox.stub().resolves([true, null]),
      };

      const user = {
        getAddresses: sandbox.stub().resolves([{ id: 1, verified: true }]),
      };
      const address = {
        address: '0x123',
      };
      const chain = {
        id: 'ethereum',
        network: 'ethereum',
      };
      const reaction = {};
      const commentId = 123;

      const serverThreadsController = new ServerThreadsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      expect(
        serverThreadsController.createThreadReaction(
          user as any,
          address as any,
          chain as any,
          reaction as any,
          commentId
        )
      ).to.be.rejectedWith('Insufficient token balance');
    });
  });

  describe('#createThreadComment', () => {
    it('should create a thread comment', async () => {
      const user = {};
      const address = {
        id: 1,
        address: '0x123',
        save: async () => ({}),
      };
      const chain = {
        id: 'ethereum',
        network: 'ethereum',
      };
      const parentId = null;
      const threadId = 1;
      const text = 'hello';
      const attachments = null;
      const canvasAction = null;
      const canvasHash = null;
      const canvasSession = null;

      const db = {
        Thread: {
          findOne: async () => ({
            save: async () => ({}),
          }),
        },
        // for findAllRoles
        Address: {
          findAll: async () => [
            {
              toJSON: () => ({}),
            },
          ],
        },
        sequelize: {
          transaction: async () => ({
            rollback: async () => ({}),
            commit: async () => ({}),
          }),
        },
        Comment: {
          create: async (data) => ({
            id: 1,
            ...data,
          }),
          findOne: async () => {
            const data = {
              id: 1,
              thread_id: threadId,
              text,
              address_id: address.id,
              chain: chain.id,
              Address: address,
            };
            return {
              ...data,
              destroy: async () => ({}),
              toJSON: () => data,
            };
          },
        },
        Subscription: {
          create: async () => ({}),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: async () => [true, null],
      };

      const serverThreadsController = new ServerThreadsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      const [newComment, notificationOptions, analyticsOptions] =
        await serverThreadsController.createThreadComment(
          user as any,
          address as any,
          chain as any,
          parentId,
          threadId,
          text,
          attachments,
          canvasAction,
          canvasSession,
          canvasHash
        );
      expect(newComment).to.include({
        thread_id: threadId,
        text,
        address_id: address.id,
        chain: chain.id,
      });
      expect(notificationOptions).to.have.length.greaterThan(0);
      expect(analyticsOptions).to.include({
        event: 'Create New Comment',
        community: chain.id,
      });
    });

    it('should throw error (banned)', async () => {
      const db = {
        Thread: {
          findOne: async () => ({
            save: async () => ({}),
          }),
        },
        // for findAllRoles
        CommunityRole: {
          findAll: async () => [
            {
              toJSON: () => ({}),
            },
          ],
        },
        sequelize: {
          transaction: async () => ({
            rollback: async () => ({}),
            commit: async () => ({}),
          }),
        },
        Comment: {
          create: async () => ({}),
          findOne: async () => ({
            Address: {
              id: 1,
              address: '0x123',
            },
            destroy: async () => ({}),
            toJSON: () => ({}),
          }),
        },
        Subscription: {
          create: async () => ({}),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: async () => [false, 'big bad error'],
      };

      const serverThreadsController = new ServerThreadsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      const user = {};
      const address = {
        id: 1,
        address: '0x123',
        save: async () => ({}),
      };
      const chain = {
        id: 'ethereum',
        network: 'ethereum',
      };
      const parentId = null;
      const threadId = 1;
      const text = 'hello';
      const attachments = null;
      const canvasAction = null;
      const canvasHash = null;
      const canvasSession = null;

      expect(
        serverThreadsController.createThreadComment(
          user as any,
          address as any,
          chain as any,
          parentId,
          threadId,
          text,
          attachments,
          canvasAction,
          canvasSession,
          canvasHash
        )
      ).to.be.rejectedWith('Ban error: big bad error');
    });

    it('should throw error (thread not found)', async () => {
      const db = {
        Thread: {
          findOne: async () => null,
        },
        // for findAllRoles
        CommunityRole: {
          findAll: async () => [
            {
              toJSON: () => ({}),
            },
          ],
        },
        sequelize: {
          transaction: async () => ({
            rollback: async () => ({}),
            commit: async () => ({}),
          }),
        },
        Comment: {
          create: async () => ({}),
          findOne: async () => ({
            Address: {
              id: 1,
              address: '0x123',
            },
            destroy: async () => ({}),
            toJSON: () => ({}),
          }),
        },
        Subscription: {
          create: async () => ({}),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: async () => [true, null],
      };

      const serverThreadsController = new ServerThreadsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      const user = {};
      const address = {
        id: 1,
        address: '0x123',
        save: async () => ({}),
      };
      const chain = {
        id: 'ethereum',
        network: 'ethereum',
      };
      const parentId = null;
      const threadId = 1;
      const text = 'hello';
      const attachments = null;
      const canvasAction = null;
      const canvasHash = null;
      const canvasSession = null;

      expect(
        serverThreadsController.createThreadComment(
          user as any,
          address as any,
          chain as any,
          parentId,
          threadId,
          text,
          attachments,
          canvasAction,
          canvasSession,
          canvasHash
        )
      ).to.be.rejectedWith('Thread not found');
    });

    it('should throw error (thread readonly)', async () => {
      const db = {
        Thread: {
          findOne: async () => ({
            read_only: true,
            save: async () => ({}),
          }),
        },
        // for findAllRoles
        CommunityRole: {
          findAll: async () => [
            {
              toJSON: () => ({}),
            },
          ],
        },
        sequelize: {
          transaction: async () => ({
            rollback: async () => ({}),
            commit: async () => ({}),
          }),
        },
        Comment: {
          create: async () => ({}),
          findOne: async () => ({
            Address: {
              id: 1,
              address: '0x123',
            },
            destroy: async () => ({}),
            toJSON: () => ({}),
          }),
        },
        Subscription: {
          create: async () => ({}),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: async () => [true, null],
      };

      const serverThreadsController = new ServerThreadsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      const user = {};
      const address = {
        id: 1,
        address: '0x123',
        save: async () => ({}),
      };
      const chain = {
        id: 'ethereum',
        network: 'ethereum',
      };
      const parentId = null;
      const threadId = 1;
      const text = 'hello';
      const attachments = null;
      const canvasAction = null;
      const canvasHash = null;
      const canvasSession = null;

      expect(
        serverThreadsController.createThreadComment(
          user as any,
          address as any,
          chain as any,
          parentId,
          threadId,
          text,
          attachments,
          canvasAction,
          canvasSession,
          canvasHash
        )
      ).to.be.rejectedWith('Cannot comment when thread is read_only');
    });

    it('should throw error (invalid parent)', async () => {
      const parentId = 3;

      const db = {
        Thread: {
          findOne: async () => ({
            save: async () => ({}),
          }),
        },
        // for findAllRoles
        CommunityRole: {
          findAll: async () => [
            {
              toJSON: () => ({}),
            },
          ],
        },
        sequelize: {
          transaction: async () => ({
            rollback: async () => ({}),
            commit: async () => ({}),
          }),
        },
        Comment: {
          create: async () => ({}),
          // for parent ID, return null comment
          findOne: async ({ where }) =>
            where.id === parentId
              ? null
              : {
                  Address: {
                    id: 1,
                    address: '0x123',
                  },
                  destroy: async () => ({}),
                  toJSON: () => ({}),
                },
        },
        Subscription: {
          create: async () => ({}),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: async () => [true, null],
      };

      const serverThreadsController = new ServerThreadsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      const user = {};
      const address = {
        id: 1,
        address: '0x123',
        save: async () => ({}),
      };
      const chain = {
        id: 'ethereum',
        network: 'ethereum',
      };
      const threadId = 1;
      const text = 'hello';
      const attachments = null;
      const canvasAction = null;
      const canvasHash = null;
      const canvasSession = null;

      expect(
        serverThreadsController.createThreadComment(
          user as any,
          address as any,
          chain as any,
          parentId,
          threadId,
          text,
          attachments,
          canvasAction,
          canvasSession,
          canvasHash
        )
      ).to.be.rejectedWith('Invalid parent');
    });

    it('should throw error (nesting too deep)', async () => {
      const db = {
        Thread: {
          findOne: async () => ({
            save: async () => ({}),
          }),
        },
        // for findAllRoles
        CommunityRole: {
          findAll: async () => [
            {
              toJSON: () => ({}),
            },
          ],
        },
        sequelize: {
          transaction: async () => ({
            rollback: async () => ({}),
            commit: async () => ({}),
          }),
        },
        Comment: {
          create: async () => ({}),
          findOne: async () => ({
            id: 2,
            parent_id: 1, // simulate infinite nesting
            Address: {
              id: 1,
              address: '0x123',
            },
            destroy: async () => ({}),
            toJSON: () => ({}),
          }),
        },
        Subscription: {
          create: async () => ({}),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: async () => [true, null],
      };

      const serverThreadsController = new ServerThreadsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );

      const user = {};
      const address = {
        id: 1,
        address: '0x123',
        save: async () => ({}),
      };
      const chain = {
        id: 'ethereum',
        network: 'ethereum',
      };
      const parentId = 1;
      const threadId = 1;
      const text = 'hello';
      const attachments = null;
      const canvasAction = null;
      const canvasHash = null;
      const canvasSession = null;

      expect(
        serverThreadsController.createThreadComment(
          user as any,
          address as any,
          chain as any,
          parentId,
          threadId,
          text,
          attachments,
          canvasAction,
          canvasSession,
          canvasHash
        )
      ).to.be.rejectedWith('Comments can only be nested 8 levels deep');
    });
  });
});
