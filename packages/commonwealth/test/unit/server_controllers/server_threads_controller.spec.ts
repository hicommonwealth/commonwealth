import BN from 'bn.js';
import { expect } from 'chai';
import { ServerThreadsController } from 'server/controllers/server_threads_controller';
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

  describe('#deleteThread', () => {
    it('should delete a thread', async () => {
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
      const user = {
        getAddresses: async () => [{ id: 1, address: '0x123', verified: true }],
      };
      const threadId = 1;
      await serverThreadsController.deleteThread(user as any, threadId);
    });

    it('should should throw error (thread not found)', async () => {
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
      const user = {
        getAddresses: async () => [{ id: 1, address: '0x123', verified: true }],
      };
      const threadId = 1;
      expect(
        serverThreadsController.deleteThread(user as any, threadId)
      ).to.be.rejectedWith('Thread not found: 1');
    });

    it('should throw error (banned)', async () => {
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
          findAll: async () => [
            {
              toJSON: () => ({}),
            },
          ],
        },
        Subscription: {
          destroy: async () => ({}),
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: async () => [false, 'bad'],
      };
      const serverThreadsController = new ServerThreadsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );
      const user = {
        getAddresses: async () => [{ id: 1, address: '0x123', verified: true }],
      };
      const threadId = 1;
      expect(
        serverThreadsController.deleteThread(user as any, threadId)
      ).to.be.rejectedWith('Ban error: bad');
    });

    it('should throw error (not owned)', async () => {
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
      const user = {
        // address is different from thread author
        getAddresses: async () => [{ id: 2, address: '0x124', verified: true }],
      };
      const threadId = 1;
      expect(
        serverThreadsController.deleteThread(user as any, threadId)
      ).to.be.rejectedWith('Not owned by this user');
    });
  });

  describe('#updateThread', () => {
    it('should update a thread', async () => {
      let data;
      data = {
        id: 1,
        title: 'title',
        body: 'body',
        chain: 'ethereum',
        kind: 'discussion',
        Address: {
          address: '0x123',
          chain: 'ethereum',
        },
        version_history: ['{"body":""}'],
        save: async () => ({}),
        toJSON: () => data,
      };

      const db = {
        Thread: {
          findOne: async () => data,
        },
        Collaboration: {
          findOne: async () => ({
            id: 1,
          }),
        },
        CommunityRole: {
          findAll: async () => [], // no mod/admin roles
        },
        Address: {
          findAll: async () => [{}], // used in findOneRole
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
      const user = {
        getAddresses: async () => [{ id: 2, address: '0x123', verified: true }],
      };
      const address = {
        id: 1,
        address: '0x123',
        chain: 'ethereum',
        save: async () => ({}),
      };
      const chain = {
        id: 'ethereum',
      };
      const threadId = 1;
      const body = 'hello';
      const title = 'mythread';
      const stage = 'stage';
      const url = 'http://blah';
      const attachments = undefined;
      const canvasAction = undefined;
      const canvasSession = undefined;
      const canvasHash = undefined;

      const [updatedThread, notificationOptions] =
        await serverThreadsController.updateThread(
          user as any,
          address as any,
          chain as any,
          threadId,
          title,
          body,
          stage,
          url,
          attachments,
          canvasAction,
          canvasSession,
          canvasHash
        );

      expect(updatedThread.title).to.equal(title);
      expect(updatedThread.body).to.equal(body);
      expect(updatedThread.stage).to.equal(stage);

      expect(!!updatedThread).to.equal(true);
      expect(notificationOptions).to.have.length(1);
      expect(notificationOptions[0]).to.include({
        categoryId: 'thread-edit',
        objectId: '',
        webhookData: null,
      });
      expect(notificationOptions[0].notificationData).to.include({
        thread_id: 1,
        root_type: 'discussion',
        root_title: 'mythread',
        chain_id: 'ethereum',
        author_address: '0x123',
        author_chain: 'ethereum',
      });
      expect(notificationOptions[0].excludeAddresses[0]).to.equal('0x123');
    });

    it('should throw error (banned)', async () => {
      const db = {
        Thread: {
          findOne: async () => null,
        },
        Collaboration: {
          findOne: async () => ({
            id: 1,
          }),
        },
        CommunityRole: {
          findAll: async () => [], // no mod/admin roles
        },
        Address: {
          findAll: async () => [{}], // used in findOneRole
        },
      };
      const tokenBalanceCache = {};
      const banCache = {
        checkBan: async () => [false, 'banned'],
      };
      const serverThreadsController = new ServerThreadsController(
        db as any,
        tokenBalanceCache as any,
        banCache as any
      );
      const user = {
        getAddresses: async () => [{ id: 2, address: '0x123', verified: true }],
      };
      const address = {
        id: 1,
        address: '0x123',
        chain: 'ethereum',
        save: async () => ({}),
      };
      const chain = {
        id: 'ethereum',
      };
      const threadId = 1;
      const body = 'hello';
      const title = 'mythread';
      const stage = 'stage';
      const url = 'http://blah';
      const attachments = undefined;
      const canvasAction = undefined;
      const canvasSession = undefined;
      const canvasHash = undefined;

      expect(
        serverThreadsController.updateThread(
          user as any,
          address as any,
          chain as any,
          threadId,
          title,
          body,
          stage,
          url,
          attachments,
          canvasAction,
          canvasSession,
          canvasHash
        )
      ).to.be.rejectedWith('Ban error: banned');
    });

    it('should throw error (discussion without body or attachments)', async () => {
      let data;
      data = {
        id: 1,
        title: 'title',
        body: 'body',
        chain: 'ethereum',
        kind: 'discussion',
        Address: {
          address: '0x123',
          chain: 'ethereum',
        },
        version_history: ['{"body":""}'],
        save: async () => ({}),
        toJSON: () => data,
      };

      const db = {
        Thread: {
          findOne: async () => data,
        },
        Collaboration: {
          findOne: async () => ({
            id: 1,
          }),
        },
        CommunityRole: {
          findAll: async () => [], // no mod/admin roles
        },
        Address: {
          findAll: async () => [{}], // used in findOneRole
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
      const user = {
        getAddresses: async () => [{ id: 2, address: '0x123', verified: true }],
      };
      const address = {
        id: 1,
        address: '0x123',
        chain: 'ethereum',
        save: async () => ({}),
      };
      const chain = {
        id: 'ethereum',
      };
      const threadId = 1;
      const body = '';
      const title = 'mythread';
      const stage = 'stage';
      const url = 'http://blah';
      const attachments = undefined;
      const canvasAction = undefined;
      const canvasSession = undefined;
      const canvasHash = undefined;

      expect(
        serverThreadsController.updateThread(
          user as any,
          address as any,
          chain as any,
          threadId,
          title,
          body,
          stage,
          url,
          attachments,
          canvasAction,
          canvasSession,
          canvasHash
        )
      ).to.be.rejectedWith('Must provide body or attachment');
    });

    it('should throw error (thread not found)', async () => {
      const db = {
        Thread: {
          findOne: async () => null,
        },
        Collaboration: {
          findOne: async () => ({
            id: 1,
          }),
        },
        CommunityRole: {
          findAll: async () => [], // no mod/admin roles
        },
        Address: {
          findAll: async () => [{}], // used in findOneRole
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
      const user = {
        getAddresses: async () => [{ id: 2, address: '0x123', verified: true }],
      };
      const address = {
        id: 1,
        address: '0x123',
        chain: 'ethereum',
        save: async () => ({}),
      };
      const chain = {
        id: 'ethereum',
      };
      const threadId = 1;
      const body = 'hello';
      const title = 'mythread';
      const stage = 'stage';
      const url = 'http://blah';
      const attachments = undefined;
      const canvasAction = undefined;
      const canvasSession = undefined;
      const canvasHash = undefined;

      expect(
        serverThreadsController.updateThread(
          user as any,
          address as any,
          chain as any,
          threadId,
          title,
          body,
          stage,
          url,
          attachments,
          canvasAction,
          canvasSession,
          canvasHash
        )
      ).to.be.rejectedWith('Thread not found: 1');
    });

    it('should throw error (invalid link)', async () => {
      let data;
      data = {
        id: 1,
        title: 'title',
        body: 'body',
        chain: 'ethereum',
        kind: 'link',
        Address: {
          address: '0x123',
          chain: 'ethereum',
        },
        version_history: ['{"body":""}'],
        save: async () => ({}),
        toJSON: () => data,
      };

      const db = {
        Thread: {
          findOne: async () => data,
        },
        Collaboration: {
          findOne: async () => ({
            id: 1,
          }),
        },
        CommunityRole: {
          findAll: async () => [], // no mod/admin roles
        },
        Address: {
          findAll: async () => [{}], // used in findOneRole
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
      const user = {
        getAddresses: async () => [{ id: 2, address: '0x123', verified: true }],
      };
      const address = {
        id: 1,
        address: '0x123',
        chain: 'ethereum',
        save: async () => ({}),
      };
      const chain = {
        id: 'ethereum',
      };
      const threadId = 1;
      const body = 'hello';
      const title = 'mythread';
      const stage = 'stage';
      const url = '--';
      const attachments = undefined;
      const canvasAction = undefined;
      const canvasSession = undefined;
      const canvasHash = undefined;

      expect(
        serverThreadsController.updateThread(
          user as any,
          address as any,
          chain as any,
          threadId,
          title,
          body,
          stage,
          url,
          attachments,
          canvasAction,
          canvasSession,
          canvasHash
        )
      ).to.be.rejectedWith('Invalid thread URL');
    });
  });

  describe('#createThread', () => {
    it('should create a thread', async () => {
      let data = {};

      const db = {
        CommunityRole: {
          findAll: async () => [
            {
              toJSON: () => ({
                chain_id: 'ethereum',
                name: 'member',
                allow: '0',
                deny: '0',
                RoleAssignments: [{}],
              }),
            },
          ],
        },
        Chain: {
          findOne: async () => ({}),
        },
        sequelize: {
          transaction: async (callback) => {
            return callback();
          },
          query: async () => ({}),
        },
        Topic: {
          findOrCreate: async () => ({}),
        },
        Thread: {
          findOne: async () => ({
            ...data,
            Address: {
              address: '0x123',
              chain: 'ethereum',
            },
            toJSON: () => ({
              ...data,
              Address: {
                address: '0x123',
                chain: 'ethereum',
              },
            }),
          }),
          create: async (d) => {
            data = {
              id: 1,
              ...d,
            };
            return data;
          },
        },
        Subscription: {
          create: async () => ({}),
        },
        Address: {
          findAll: async () => [{}], // used in findOneRole
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
      const user = {
        getAddresses: async () => [{ id: 1, address: '0x123', verified: true }],
      };
      const address = {
        id: 1,
        address: '0x123',
        chain: 'ethereum',
        save: async () => ({}),
      };
      const chain = {
        id: 'ethereum',
      };
      const body = 'hello';
      const kind = 'discussion';
      const readOnly = false;
      const topicId = 1;
      const topicName = undefined;
      const title = 'mythread';
      const stage = 'stage';
      const url = 'http://blah';
      const attachments = undefined;
      const canvasAction = undefined;
      const canvasSession = undefined;
      const canvasHash = undefined;

      const [thread, notificationOptions, analyticsOptions] =
        await serverThreadsController.createThread(
          user as any,
          address as any,
          chain as any,
          title,
          body,
          kind,
          readOnly,
          topicId,
          topicName,
          stage,
          url,
          attachments,
          canvasAction,
          canvasSession,
          canvasHash
        );

      expect(thread.title).to.equal(title);
      expect(thread.body).to.equal(body);
      expect(thread.stage).to.equal(stage);

      expect(notificationOptions).to.have.length(1);
      expect(notificationOptions[0]).to.include({
        categoryId: 'new-thread-creation',
        objectId: 'ethereum',
      });
      expect(notificationOptions[0].webhookData).to.include({
        user: '0x123',
        author_chain: 'ethereum',
        url: 'http://localhost:8080/ethereum/discussion/1-mythread',
        title: 'mythread',
        bodyUrl: 'http://blah',
        chain: 'ethereum',
        body: 'hello',
      });
      expect(notificationOptions[0].notificationData).to.include({
        thread_id: 1,
        root_type: 'discussion',
        root_title: 'mythread',
        chain_id: 'ethereum',
        author_address: '0x123',
        author_chain: 'ethereum',
      });
      expect(notificationOptions[0].excludeAddresses[0]).to.equal('0x123');
    });
  });
});
